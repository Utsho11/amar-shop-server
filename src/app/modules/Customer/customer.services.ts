import { Request } from "express";
import prisma from "../../../shared/prisma";
import { PaymentStatus, UserStatus } from "@prisma/client";
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

  console.log(order);

  return order;
};

export const CustomerServices = {
  createOrderIntoDB,
};
