import { IFile, IImageFiles } from "../../../interfaces/file";
import prisma from "../../../../shared/prisma";
import { Request } from "express";

type IProduct = {
  shopId: string;
  name: string;
  description?: string;
  price: number;
  categoryId: string;
  discount: number;
  inventoryCount: number;
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

const createProductIntoDB = async (payload: IProduct, images: IImageFiles) => {
  try {
    const { files } = images;
    payload.imageUrls = files.map((image) => image.path);

    const isCategoryExist = await prisma.category.findFirstOrThrow({
      where: {
        id: payload.categoryId,
        isDeleted: false,
      },
    });

    const isShopExist = await prisma.shop.findFirstOrThrow({
      where: {
        id: payload.shopId,
        isDeleted: false,
      },
    });

    if (!isCategoryExist) {
      throw new Error("Category not found");
    }

    if (!isShopExist) {
      throw new Error("Shop not found");
    }

    const result = await prisma.product.create({ data: payload });

    return result;
  } catch (error) {
    console.error("Error creating product:", error);
    throw new Error("Product creation failed. Please try again.");
  }
};

const updateProductIntoDB = async (p_id: string, req: Request) => {
  try {
    const images = req.files as IImageFiles;

    const { files } = images;
    const payload = req.body;

    if (files.length > 0) {
      payload.imageUrls = files.map((image) => image.path);
    }

    const isProductExist = await prisma.product.findFirstOrThrow({
      where: {
        id: p_id,
        isDeleted: false,
      },
    });

    if (!isProductExist) {
      throw new Error("Product not found");
    }

    const result = await prisma.product.update({
      where: {
        id: p_id,
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

const getAllProductsFromDB = async () => {
  try {
    const products = await prisma.product.findMany({
      where: {
        isDeleted: false,
      },
    });
    return products;
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
