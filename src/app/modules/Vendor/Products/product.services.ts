import { IFile, IImageFiles } from "../../../interfaces/file";
import prisma from "../../../../shared/prisma";
import { Request } from "express";

type IProduct = {
  name: string;
  description?: string;
  price: string;
  categoryId: string;
  discount: string;
  inventoryCount: string;
  imageUrls?: string;
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
    const file = req.file as IFile | undefined;

    const payload = req.body;
    payload.imageUrl = file?.path;

    const u_email = req.user.email;

    const isCategoryExist = await prisma.category.findFirstOrThrow({
      where: {
        id: payload.categoryId,
        isDeleted: false,
      },
    });

    const shopId = await prisma.shop.findFirst({
      where: {
        vendorEmail: u_email,
        isDeleted: false,
      },
    });

    if (!isCategoryExist) {
      throw new Error("Category not found");
    }

    if (!shopId) {
      throw new Error("Shop not found");
    }

    payload.shopId = shopId.id;

    console.log(payload);

    const result = await prisma.product.create({ data: payload });

    return result;
  } catch (error) {
    console.error("Error creating product:", error);
    throw new Error("Product creation failed. Please try again.");
  }
};

const updateProductIntoDB = async (req: Request) => {
  try {
    const payload = req.body;
    const file = req.file as IFile | undefined;

    if (file) {
      payload.imageUrl = file?.path;
    }

    const isProductExist = await prisma.product.findFirst({
      where: {
        id: payload.id,
        isDeleted: false,
      },
    });

    if (!isProductExist) {
      throw new Error("Product not found");
    }

    const result = await prisma.product.update({
      where: {
        id: payload.id,
      },
      data: payload,
    });

    return result;
  } catch (error) {
    throw new Error("Product update is failed. Please try again.");
  }
};

const deleteProductFromDB = async (product_id: string) => {
  try {
    const isProductExist = await prisma.product.findFirstOrThrow({
      where: {
        id: product_id,
        isDeleted: false,
      },
    });
    if (!isProductExist) {
      throw new Error("Product not found");
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
    throw new Error("Product deletion is failed. Please try again.");
  }
};

const getAllProductsFromDB = async (
  req: Request
): Promise<PaginatedProducts> => {
  try {
    const { page = 1, limit = 8, category, keyword, sortByPrice } = req.query;

    const pageNumber = Number(page);
    const pageLimit = Number(limit);

    const where: any = {
      isDeleted: false,
    };

    // Apply category filter dynamically
    if (category) {
      where.category = { name: { equals: category.toString() } };
    }

    // Apply keyword search filter dynamically
    if (keyword) {
      where.OR = [
        { name: { contains: keyword.toString(), mode: "insensitive" } },
        { description: { contains: keyword.toString(), mode: "insensitive" } },
      ];
    }

    // Sort the products based on price (low to high or high to low)
    let orderBy: any = {};
    if (sortByPrice) {
      if (sortByPrice.toString() === "lowToHigh") {
        orderBy.price = "asc"; // Low to high
      } else if (sortByPrice.toString() === "highToLow") {
        orderBy.price = "desc"; // High to low
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
        shop: { select: { name: true } },
        category: { select: { name: true } },
      },
      skip: (pageNumber - 1) * pageLimit,
      take: pageLimit,
      orderBy,
    });

    const totalProducts = await prisma.product.count({ where });

    const hasMore = pageNumber * pageLimit < totalProducts;

    return {
      products,
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

const duplicateProductFromDB = async (p_id: string) => {
  try {
    const existingProduct = await prisma.product.findUnique({
      where: { id: p_id },
    });

    if (!existingProduct) {
      throw new Error(`Product with ID ${p_id} not found`);
    }

    // Remove unique fields or modify them
    const { id, ...productData } = existingProduct;

    // Create a duplicate product
    const duplicatedProduct = await prisma.product.create({
      data: {
        ...productData,
        name: `${existingProduct.name} (Copy)`, // Optionally modify the name
      },
    });

    console.log("Duplicated Product:", duplicatedProduct);
    return duplicatedProduct;
  } catch (error) {
    throw new Error("Duplicated Product Error!!!");
  }
};

export const ProductServices = {
  createProductIntoDB,
  deleteProductFromDB,
  getAllProductsFromDB,
  getSingleProductFromDB,
  updateProductIntoDB,
  duplicateProductFromDB,
};
