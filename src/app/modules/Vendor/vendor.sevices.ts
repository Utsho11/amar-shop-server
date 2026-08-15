import { Request } from "express";
import prisma from "../../../shared/prisma";
import { OrderStatus } from "@prisma/client";

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
        id: true,
        quantity: true,
        price: true,
        product: {
          select: {
            name: true,
            imageUrl: true,
            price: true,
          },
        },
        order: {
          select: {
            id: true,
            status: true,
            customerEmail: true,
            shippingAddress: true,
            shippingCity: true,
            shippingPhone: true,
            createdAt: true,
            Transaction: {
              select: {
                transactionId: true,
                createdAt: true,
              },
            },
          },
        },
      },
      orderBy: {
        id: "desc",
      },
    });

    // Restructure the output
    const orderItems = rawOrderItems.map((item) => ({
      id: item.id,
      orderId: item.order.id,
      quantity: item.quantity,
      productName: item.product.name,
      productImage: item.product.imageUrl,
      productPrice: item.price || item.product.price,
      orderStatus: item.order.status,
      customerEmail: item.order.customerEmail,
      shippingAddress: item.order.shippingAddress,
      shippingCity: item.order.shippingCity,
      shippingPhone: item.order.shippingPhone,
      transactionId: item.order.Transaction[0]?.transactionId || null,
      createdAt: item.order.createdAt || item.order.Transaction[0]?.createdAt || null,
    }));

    return orderItems;
  } catch (error) {
    throw new Error("Error fetching orders");
  }
};

const updateOrderStatusIntoDB = async (req: Request) => {
  const { orderId } = req.params;
  const { status } = req.body;
  const v_email = req.user.email;

  if (!Object.values(OrderStatus).includes(status)) {
    throw new Error(`Invalid status. Must be one of: ${Object.values(OrderStatus).join(", ")}`);
  }

  // Ensure this vendor owns at least one product in this order
  const orderExists = await prisma.order.findFirst({
    where: {
      id: orderId,
      OrderItem: {
        some: {
          product: {
            shop: {
              vendorEmail: v_email,
            },
          },
        },
      },
    },
  });

  if (!orderExists) {
    throw new Error("Order not found or you are not authorized to update this order.");
  }

  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: { status: status as OrderStatus },
  });

  return updatedOrder;
};

export const VendorServices = {
  getProductsFromDB,
  getOrderHistoryFromDB,
  updateOrderStatusIntoDB,
};
