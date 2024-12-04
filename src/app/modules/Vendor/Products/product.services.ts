import { IImageFiles } from "../../../interfaces/file";
import prisma from "../../../../shared/prisma";

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

export const ProductServices = {
  createProductIntoDB,
  deleteProductFromDB,
  getAllProductsFromDB,
  getSingleProductFromDB,
};
