import { Request } from "express";
import prisma from "../../../shared/prisma";

const getProductsFromDB = async (req: Request) => {
  try {
    const v_email = req.user.email;

    const products = await prisma.product.findMany({
      where: {
        isDeleted: false,
        shop: {
          vendorEmail: v_email,
          isDeleted: false,
        },
      },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        discount: true,
        inventoryCount: true,
        imageUrl: true,
        shop: {
          select: {
            name: true,
          },
        },
        category: {
          select: {
            name: true,
          },
        },
      },
    });

    return products;
  } catch (error) {
    throw new Error("Error fetching products: " + error);
  }
};

export const VendorServices = {
  getProductsFromDB,
};
