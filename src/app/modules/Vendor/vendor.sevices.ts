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

const getOrderHistoryFromDB = async (req: Request) => {
  try {
    const v_email = req.user.email;

    const rawOrderItems = await prisma.orderItem.findMany({
      where: {
        product: {
          shop: {
            vendorEmail: v_email,
          },
        },
      },
      select: {
        quantity: true,
        product: {
          select: {
            name: true,
            imageUrl: true,
            price: true,
          },
        },
        order: {
          select: {
            Transaction: {
              select: {
                transactionId: true,
              },
            },
          },
        },
      },
    });

    // Restructure the output
    const orderItems = rawOrderItems.map((item) => ({
      quantity: item.quantity,
      productName: item.product.name,
      productImage: item.product.imageUrl,
      productPrice: item.product.price,
      transactionId: item.order.Transaction[0]?.transactionId || null,
    }));

    // console.log(orderItems);
    return orderItems;
  } catch (error) {
    throw new Error("Error fetching order");
  }
};

export const VendorServices = {
  getProductsFromDB,
  getOrderHistoryFromDB,
};
