import { IFile, IImageFiles } from "../../../interfaces/file";
import prisma from "../../../../shared/prisma";
import { Request } from "express";
import type { TImageFiles } from "../../../interfaces/image.interface";
import AppError from "../../../errors/AppError";
import httpStatus from "http-status";
import { UserRole } from "@prisma/client";

type IProduct = {
  name: string;
  description?: string;
  price: string;
  categoryId: string;
  discount: string;
  inventoryCount: string;
  imageUrls?: string[];
};

type IUpdateProduct = {
  name?: string;
  description?: string;
  price?: number;
  categoryId?: string;
  discount?: number;
  inventoryCount?: number;
};

interface PaginatedProducts {
  products: any[];
  hasMore: boolean;
  totalProducts: number;
}

const createProductIntoDB = async (req: Request) => {
  try {
    const imgUrls = req.files;
    const { files } = (imgUrls || {}) as TImageFiles;

    const payload = req.body;
    payload.imageUrl =
      files && files.length > 0 ? files.map((file) => file.path) : [];

    const u_email = req.user.email;

    const isCategoryExist = await prisma.category.findFirst({
      where: {
        id: payload.categoryId,
        isDeleted: false,
      },
    });

    if (!isCategoryExist) {
      throw new AppError(httpStatus.NOT_FOUND, "Category not found");
    }

    const shop = await prisma.shop.findFirst({
      where: {
        vendorEmail: u_email,
        isDeleted: false,
      },
    });

    if (!shop) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Shop not found. Please create an active shop first."
      );
    }

    if (shop.isBlacklisted) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "Your shop is blacklisted. You cannot create products."
      );
    }

    // Strictly enforce shopId from verified vendor shop
    payload.shopId = shop.id;
    payload.price = Number(payload.price);
    payload.discount = Number(payload.discount || 0);
    payload.inventoryCount = Number(payload.inventoryCount || 0);

    const result = await prisma.product.create({ data: payload });

    return result;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error("Error creating product:", error);
    throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, "Product creation failed. Please try again.");
  }
};

const updateProductIntoDB = async (req: Request) => {
  try {
    const payload = req.body;
    const file = req.file as IFile | undefined;
    const user = req.user;

    if (!payload.id) {
      throw new AppError(httpStatus.BAD_REQUEST, "Product ID is required for update.");
    }

    const isProductExist = await prisma.product.findFirst({
      where: {
        id: payload.id,
        isDeleted: false,
      },
      include: {
        shop: true,
      },
    });

    if (!isProductExist) {
      throw new AppError(httpStatus.NOT_FOUND, "Product not found");
    }

    // Enforce tenant ownership: only product's shop owner or admin can update
    if (user.role !== UserRole.ADMIN && isProductExist.shop?.vendorEmail !== user.email) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "You do not have permission to update products from another shop!"
      );
    }

    if (payload.price !== undefined) {
      payload.price = Number(payload.price);
    }
    if (payload.discount !== undefined) {
      payload.discount = Number(payload.discount);
    }
    if (payload.inventoryCount !== undefined) {
      payload.inventoryCount = Number(payload.inventoryCount);
    }

    if (file) {
      payload.imageUrl = [file.path];
    }

    // Never allow tampering with system or relation fields
    delete payload.id;
    delete payload.shopId;
    delete payload.shop;
    delete payload.Review;
    delete payload.OrderItem;
    delete payload.averageRating;
    delete payload.reviewCount;
    delete payload.createdAt;
    delete payload.updatedAt;
    delete payload.isDeleted;

    const result = await prisma.product.update({
      where: {
        id: isProductExist.id,
      },
      data: payload,
    });

    return result;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error("Error updating product:", error);
    throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, "Product update failed. Please try again.");
  }
};

const deleteProductFromDB = async (product_id: string, user: any) => {
  try {
    const isProductExist = await prisma.product.findFirst({
      where: {
        id: product_id,
        isDeleted: false,
      },
      include: {
        shop: true,
      },
    });

    if (!isProductExist) {
      throw new AppError(httpStatus.NOT_FOUND, "Product not found");
    }

    // Enforce tenant ownership: only product's shop owner or admin can delete
    if (user.role !== UserRole.ADMIN && isProductExist.shop?.vendorEmail !== user.email) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "You do not have permission to delete products from another shop!"
      );
    }

    const result = await prisma.product.update({
      where: {
        id: product_id,
      },
      data: {
        isDeleted: true,
      },
    });
    return result;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error("Error deleting product:", error);
    throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, "Product deletion failed. Please try again.");
  }
};

const getAllProductsFromDB = async (
  req: Request,
): Promise<PaginatedProducts> => {
  try {
    const {
      page = 1,
      limit = 8,
      category,
      keyword,
      sortByPrice,
      sortBy,
      minPrice,
      maxPrice,
      inStock,
    } = req.query;

    const pageNumber = Number(page) || 1;
    const pageLimit = Number(limit) || 8;

    const where: any = {
      isDeleted: false,
    };

    // Apply category filter dynamically (supports name or ID)
    if (category && category !== "all" && category !== "All") {
      where.OR = [
        { category: { name: { equals: category.toString(), mode: "insensitive" } } },
        { categoryId: category.toString() },
      ];
    }

    // Apply keyword search filter dynamically
    if (keyword && keyword.toString().trim()) {
      const kw = keyword.toString().trim();
      where.AND = where.AND || [];
      where.AND.push({
        OR: [
          { name: { contains: kw, mode: "insensitive" } },
          { description: { contains: kw, mode: "insensitive" } },
          { category: { name: { contains: kw, mode: "insensitive" } } },
        ],
      });
    }

    // Price range filters
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined && minPrice !== "") {
        where.price.gte = Number(minPrice);
      }
      if (maxPrice !== undefined && maxPrice !== "") {
        where.price.lte = Number(maxPrice);
      }
    }

    // In stock filter
    if (inStock === "true" || inStock === "1") {
      where.inventoryCount = { gt: 0 };
    }

    // Sort order
    let orderBy: any = { createdAt: "desc" };
    const sortParam = sortBy || sortByPrice;

    if (sortParam) {
      const s = sortParam.toString();
      if (s === "lowToHigh" || s === "priceAsc") {
        orderBy = { price: "asc" };
      } else if (s === "highToLow" || s === "priceDesc") {
        orderBy = { price: "desc" };
      } else if (s === "discount") {
        orderBy = { discount: "desc" };
      } else if (s === "newest") {
        orderBy = { createdAt: "desc" };
      }
    }

    // Fetch products from database with sorting
    const products = await prisma.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        discount: true,
        inventoryCount: true,
        imageUrl: true,
        shop: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } },
        Review: { select: { rating: true } },
      },
      skip: (pageNumber - 1) * pageLimit,
      take: pageLimit,
      orderBy,
    });

    const formattedProducts = products.map((p: any) => {
      const reviewList = p.Review || [];
      const reviewCount = reviewList.length;
      const totalRating = reviewList.reduce(
        (acc: number, r: any) => acc + (r.rating || 0),
        0
      );
      const averageRating =
        reviewCount > 0 ? Math.round((totalRating / reviewCount) * 10) / 10 : 0;
      const { Review, ...rest } = p;
      return {
        ...rest,
        reviewCount,
        averageRating,
      };
    });

    const totalProducts = await prisma.product.count({ where });

    const hasMore = pageNumber * pageLimit < totalProducts;

    return {
      products: formattedProducts,
      totalProducts,
      hasMore,
    };
  } catch (error) {
    throw new Error("Error fetching products: " + error);
  }
};

const getSingleProductFromDB = async (p_id: string) => {
  try {
    const product = await prisma.product.findFirstOrThrow({
      where: {
        id: p_id,
        isDeleted: false,
      },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        discount: true,
        inventoryCount: true,
        imageUrl: true,
        shop: { select: { id: true, name: true } },
        category: { select: { name: true } },
      },
    });
    return product;
  } catch (error) {
    throw new Error("Error fetching products: " + error);
  }
};

const duplicateProductFromDB = async (p_id: string, user: any) => {
  try {
    const existingProduct = await prisma.product.findUnique({
      where: { id: p_id },
      include: { shop: true },
    });

    if (!existingProduct || existingProduct.isDeleted) {
      throw new AppError(httpStatus.NOT_FOUND, `Product with ID ${p_id} not found`);
    }

    // Enforce tenant ownership: only product's shop owner or admin can duplicate
    if (user.role !== UserRole.ADMIN && existingProduct.shop?.vendorEmail !== user.email) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "You do not have permission to duplicate products from another shop!"
      );
    }

    // Remove unique and timestamp fields
    const { id, createdAt, updatedAt, shop, ...productData } = existingProduct as any;

    const duplicatedProduct = await prisma.product.create({
      data: {
        ...productData,
        shopId: existingProduct.shopId,
        name: `${existingProduct.name} (Copy)`,
      },
    });

    return duplicatedProduct;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error("Error duplicating product:", error);
    throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, "Duplicating product failed.");
  }
};

const getFlashSaleProductsFromDB = async () => {
  const results = await prisma.product.findMany({
    where: {
      discount: {
        gt: 0,
      },
      isDeleted: false,
    },
    include: {
      shop: { select: { id: true, name: true } },
      category: { select: { id: true, name: true } },
      Review: { select: { rating: true } },
    },
  });

  return results.map((p: any) => {
    const reviewList = p.Review || [];
    const reviewCount = reviewList.length;
    const totalRating = reviewList.reduce(
      (acc: number, r: any) => acc + (r.rating || 0),
      0
    );
    const averageRating =
      reviewCount > 0 ? Math.round((totalRating / reviewCount) * 10) / 10 : 0;
    const { Review, ...rest } = p;
    return {
      ...rest,
      reviewCount,
      averageRating,
    };
  });
};

const getReviewsFromDB = async (p_id: string, page = 1, limit = 50) => {
  const pageNum = Number(page) || 1;
  const limitNum = Number(limit) || 50;

  const result = await prisma.review.findMany({
    where: {
      productId: p_id,
    },
    include: {
      customer: {
        select: {
          name: true,
          image: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    skip: (pageNum - 1) * limitNum,
    take: limitNum,
  });

  const simplifiedReviews = result.map((review) => ({
    id: review.id,
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt,
    username: review.customer?.name || "Anonymous",
    image: review.customer?.image || null,
  }));

  return simplifiedReviews;
};

const getRecommendedProductsFromDB = async (p_id: string, limit = 6) => {
  try {
    const currentProduct = await prisma.product.findUnique({
      where: { id: p_id },
      select: { categoryId: true, price: true, id: true },
    });

    if (!currentProduct) {
      return await prisma.product.findMany({
        where: { isDeleted: false },
        take: limit,
        orderBy: { discount: "desc" },
        include: {
          shop: { select: { id: true, name: true } },
          category: { select: { name: true } },
        },
      });
    }

    const priceNum = Number(currentProduct.price);
    const minPrice = priceNum * 0.5;
    const maxPrice = priceNum * 1.5;

    let recommendations = await prisma.product.findMany({
      where: {
        id: { not: p_id },
        categoryId: currentProduct.categoryId,
        isDeleted: false,
        price: {
          gte: minPrice,
          lte: maxPrice,
        },
      },
      take: limit,
      orderBy: {
        discount: "desc",
      },
      include: {
        shop: { select: { id: true, name: true } },
        category: { select: { name: true } },
      },
    });

    if (recommendations.length < limit) {
      const existingIds = [p_id, ...recommendations.map((r) => r.id)];
      const additional = await prisma.product.findMany({
        where: {
          id: { notIn: existingIds },
          categoryId: currentProduct.categoryId,
          isDeleted: false,
        },
        take: limit - recommendations.length,
        orderBy: {
          discount: "desc",
        },
        include: {
          shop: { select: { id: true, name: true } },
          category: { select: { name: true } },
        },
      });
      recommendations = [...recommendations, ...additional];
    }

    if (recommendations.length < limit) {
      const existingIds = [p_id, ...recommendations.map((r) => r.id)];
      const fillers = await prisma.product.findMany({
        where: {
          id: { notIn: existingIds },
          isDeleted: false,
        },
        take: limit - recommendations.length,
        orderBy: {
          discount: "desc",
        },
        include: {
          shop: { select: { id: true, name: true } },
          category: { select: { name: true } },
        },
      });
      recommendations = [...recommendations, ...fillers];
    }

    return recommendations;
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    return [];
  }
};

export const ProductServices = {
  createProductIntoDB,
  deleteProductFromDB,
  getAllProductsFromDB,
  getSingleProductFromDB,
  updateProductIntoDB,
  duplicateProductFromDB,
  getFlashSaleProductsFromDB,
  getReviewsFromDB,
  getRecommendedProductsFromDB,
};
