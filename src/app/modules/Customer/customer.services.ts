import { Request } from "express";
import prisma from "../../../shared/prisma";
import { OrderStatus, PaymentStatus, UserStatus } from "@prisma/client";
import { initiatePayment, TCustomerData } from "../../../utils/payment.utils";

type TOrderItem = {
  productId: string;
  quantity: number;
  price: number;
};

const createOrderIntoDB = async (req: Request) => {
  const payload = req.body;
  const { OrderItem, ...rest } = payload;
  const orderItemPayload = OrderItem.data;
  const customerEmail = req.user.email;
  const customerDetails = await prisma.customer.findUnique({
    where: {
      email: customerEmail,
    },
  });

  const transactionId = `TNX-${Date.now()}`;

  const order = await prisma.$transaction(async (transactionClient) => {
    const orderData = await transactionClient.order.create({
      data: rest,
    });

    // Ensure all order items are created properly
    await Promise.all(
      orderItemPayload.map(async (orderItem: TOrderItem) =>
        transactionClient.orderItem.create({
          data: {
            orderId: orderData.id,
            ...orderItem,
          },
        })
      )
    );

    const tranxData = {
      orderId: orderData.id,
      transactionId: transactionId,
      amount: orderData.totalAmount,
      paymentStatus: PaymentStatus.PENDING,
    };

    await transactionClient.transaction.create({
      data: tranxData,
    });

    const customerData = {
      name: customerDetails?.name,
      email: customerDetails?.email,
      totalAmount: payload.totalAmount,
      transactionId: transactionId,
      phone: customerDetails?.phone,
    };

    const res = await initiatePayment(customerData as TCustomerData);

    return res; // Optionally return the created order
  });

  return order;
};

const getItemForReviewFromDB = async (req: Request) => {
  const cus_email = req.user.email;
  const result = await prisma.orderItem.findMany({
    where: {
      isReviewed: false,
      order: {
        customerEmail: cus_email,
        status: OrderStatus.COMPLETED,
      },
    },
    select: {
      id: true,
      productId: true,
      product: {
        select: {
          name: true,
          imageUrl: true,
        },
      },
    },
  });

  return result;
};

const addReviewIntoDB = async (req: Request) => {
  const payload = req.body;
  const cus_email = req.user.email;

  const reviewData = {
    productId: payload.productId,
    customerEmail: cus_email,
    rating: Number(payload.rating),
    comment: payload.comment,
  };

  const result = await prisma.review.create({
    data: reviewData,
  });

  if (result.id) {
    await prisma.orderItem.updateMany({
      where: {
        productId: payload.productId,
        order: {
          customerEmail: cus_email,
          status: OrderStatus.COMPLETED,
        },
      },
      data: {
        isReviewed: true,
      },
    });
  }

  return "Review added successfully";
};

const getMyOrderHistoryFromDB = async (req: Request) => {
  const cus_email = req.user.email;
  const orders = await prisma.orderItem.findMany({
    where: {
      order: {
        customerEmail: cus_email,
        status: OrderStatus.COMPLETED,
      },
    },
    include: {
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

  const structuredOrders = orders.map((item) => ({
    quantity: item.quantity,
    productName: item.product.name,
    productPrice: item.product.price,
    productImage: item.product.imageUrl,
    transactionId: item.order.Transaction[0]?.transactionId || null,
  }));

  console.log(structuredOrders);

  return structuredOrders;
};

export const CustomerServices = {
  createOrderIntoDB,
  getItemForReviewFromDB,
  addReviewIntoDB,
  getMyOrderHistoryFromDB,
};
