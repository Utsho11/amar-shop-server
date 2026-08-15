import { Request } from "express";
import prisma from "../../../shared/prisma";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import { initiatePayment, TCustomerData } from "../../../utils/payment.utils";

type TOrderItemInput = {
  productId: string;
  quantity: number;
  price?: number;
};

const createOrderIntoDB = async (req: Request) => {
  const payload = req.body;
  const { OrderItem, couponCode, ...rest } = payload;
  const orderItemPayload: TOrderItemInput[] = OrderItem?.data || [];
  const customerEmail = req.user.email;

  if (!orderItemPayload.length) {
    throw new Error("Cannot place an order with empty items.");
  }

  const customerDetails = await prisma.customer.findUnique({
    where: {
      email: customerEmail,
    },
  });

  if (!customerDetails) {
    throw new Error("Customer profile not found.");
  }

  // Pre-validate stock and calculate secure server-side price
  let calculatedSubtotal = 0;
  const verifiedItems: { productId: string; quantity: number; price: number }[] = [];

  for (const item of orderItemPayload) {
    const product = await prisma.product.findUnique({
      where: { id: item.productId, isDeleted: false },
    });

    if (!product) {
      throw new Error(`Product not found or unavailable.`);
    }

    if (product.inventoryCount < item.quantity) {
      throw new Error(
        `Insufficient stock for "${product.name}". Available: ${product.inventoryCount}`
      );
    }

    const originalPrice = Number(product.price);
    const discount = product.discount || 0;
    const itemPrice = discount > 0 ? originalPrice - (originalPrice * discount) / 100 : originalPrice;
    
    calculatedSubtotal += itemPrice * item.quantity;

    verifiedItems.push({
      productId: product.id,
      quantity: item.quantity,
      price: itemPrice,
    });
  }

  let finalAmount = calculatedSubtotal;

  if (couponCode) {
    const coupon = await prisma.coupon.findUnique({
      where: { code: couponCode },
    });
    if (coupon && coupon.discountPercent > 0) {
      finalAmount = finalAmount - (finalAmount * coupon.discountPercent) / 100;
    }
  }

  // Format to 2 decimal places
  finalAmount = Math.max(0, Math.round(finalAmount * 100) / 100);

  const transactionId = `TNX-${Date.now()}`;

  const orderDataPayload = {
    customerEmail,
    totalAmount: finalAmount,
    paymentMethod: "SSLCommerz",
    paymentStatus: PaymentStatus.PENDING,
    status: OrderStatus.PENDING,
    shippingAddress: payload.shippingAddress || rest.shippingAddress || null,
    shippingCity: payload.shippingCity || rest.shippingCity || null,
    shippingZipCode: payload.shippingZipCode || rest.shippingZipCode || null,
    shippingPhone: payload.shippingPhone || rest.shippingPhone || customerDetails.phone || null,
  };

  const transactionResult = await prisma.$transaction(async (transactionClient) => {
    const orderData = await transactionClient.order.create({
      data: orderDataPayload,
    });

    await Promise.all(
      verifiedItems.map(async (orderItem) =>
        transactionClient.orderItem.create({
          data: {
            orderId: orderData.id,
            productId: orderItem.productId,
            quantity: orderItem.quantity,
            price: orderItem.price,
          },
        }),
      ),
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
      name: customerDetails.name,
      email: customerDetails.email,
      totalAmount: finalAmount,
      transactionId: transactionId,
      phone: orderDataPayload.shippingPhone || "01700000000",
    };

    return { customerData: customerData as TCustomerData };
  });

  const paymentResponse = await initiatePayment(transactionResult.customerData);

  return paymentResponse;
};

const getItemForReviewFromDB = async (req: Request) => {
  const cus_email = req.user.email;
  const result = await prisma.orderItem.findMany({
    where: {
      isReviewed: false,
      order: {
        customerEmail: cus_email,
        paymentStatus: PaymentStatus.PAID,
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
    if (payload.orderItemId) {
      await prisma.orderItem.update({
        where: { id: payload.orderItemId },
        data: { isReviewed: true },
      });
    } else {
      await prisma.orderItem.updateMany({
        where: {
          productId: payload.productId,
          order: {
            customerEmail: cus_email,
            paymentStatus: PaymentStatus.PAID,
          },
        },
        data: {
          isReviewed: true,
        },
      });
    }
  }

  return "Review added successfully";
};

const getMyOrderHistoryFromDB = async (req: Request) => {
  const cus_email = req.user.email;
  const orders = await prisma.orderItem.findMany({
    where: {
      order: {
        customerEmail: cus_email,
        paymentStatus: PaymentStatus.PAID,
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
          id: true,
          status: true,
          createdAt: true,
          shippingAddress: true,
          shippingCity: true,
          Transaction: {
            select: {
              transactionId: true,
            },
          },
        },
      },
    },
    orderBy: {
      id: "desc",
    },
  });

  const structuredOrders = orders.map((item) => ({
    id: item.id,
    orderId: item.order.id,
    quantity: item.quantity,
    productName: item.product.name,
    productPrice: item.price || item.product.price,
    productImage: item.product.imageUrl,
    transactionId: item.order.Transaction[0]?.transactionId || null,
    orderStatus: item.order.status,
    createdAt: item.order.createdAt,
    shippingAddress: item.order.shippingAddress,
    shippingCity: item.order.shippingCity,
  }));

  return structuredOrders;
};

export const CustomerServices = {
  createOrderIntoDB,
  getItemForReviewFromDB,
  addReviewIntoDB,
  getMyOrderHistoryFromDB,
};
