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

const getVendorDashboardStatsFromDB = async (req: Request) => {
  const v_email = req.user.email;

  const shop = await prisma.shop.findFirst({
    where: {
      vendorEmail: v_email,
      isDeleted: false,
    },
    select: { id: true, name: true, logoUrl: true, isBlacklisted: true },
  });

  if (!shop) {
    return {
      shop: null,
      shopRevenue: 0,
      totalProducts: 0,
      pendingOrdersCount: 0,
      completedOrdersCount: 0,
      averageRating: 0,
      totalReviews: 0,
      monthlySales: [],
      recentOrders: [],
    };
  }

  const [
    totalProducts,
    orderItems,
    reviews,
  ] = await Promise.all([
    prisma.product.count({
      where: { shopId: shop.id, isDeleted: false },
    }),
    prisma.orderItem.findMany({
      where: {
        product: { shopId: shop.id },
        order: { paymentStatus: "PAID" },
      },
      include: {
        product: { select: { name: true, imageUrl: true, price: true } },
        order: {
          select: {
            id: true,
            status: true,
            customerEmail: true,
            createdAt: true,
          },
        },
      },
      orderBy: { id: "desc" },
    }),
    prisma.review.findMany({
      where: {
        product: { shopId: shop.id },
      },
      select: { rating: true },
    }),
  ]);

  const shopRevenue = orderItems.reduce((sum, item) => {
    const price = Number(item.price || item.product?.price || 0);
    return sum + price * item.quantity;
  }, 0);

  const pendingOrdersCount = orderItems.filter(
    (item) => item.order.status === "PENDING" || item.order.status === "PROCESSING"
  ).length;

  const completedOrdersCount = orderItems.filter(
    (item) => item.order.status === "DELIVERED" || item.order.status === "COMPLETED"
  ).length;

  const totalReviews = reviews.length;
  const averageRating =
    totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const currentYear = new Date().getFullYear();
  const monthlySalesMap: Record<string, { revenue: number; orders: number }> = {};
  months.forEach((m) => {
    monthlySalesMap[m] = { revenue: 0, orders: 0 };
  });

  orderItems.forEach((item) => {
    const d = new Date(item.order.createdAt);
    if (d.getFullYear() === currentYear) {
      const monthName = months[d.getMonth()];
      const price = Number(item.price || item.product?.price || 0);
      monthlySalesMap[monthName].revenue += price * item.quantity;
      monthlySalesMap[monthName].orders += 1;
    }
  });

  const monthlySales = months.map((month) => ({
    month,
    revenue: monthlySalesMap[month].revenue,
    orders: monthlySalesMap[month].orders,
  }));

  const recentOrders = orderItems.slice(0, 5).map((item) => ({
    id: item.id,
    orderId: item.order.id,
    productName: item.product.name,
    productImage: item.product.imageUrl,
    productPrice: item.price || item.product.price,
    quantity: item.quantity,
    orderStatus: item.order.status,
    customerEmail: item.order.customerEmail,
    createdAt: item.order.createdAt,
  }));

  return {
    shop,
    shopRevenue,
    totalProducts,
    pendingOrdersCount,
    completedOrdersCount,
    averageRating,
    totalReviews,
    monthlySales,
    recentOrders,
  };
};

export const VendorServices = {
  getProductsFromDB,
  getOrderHistoryFromDB,
  updateOrderStatusIntoDB,
  getVendorDashboardStatsFromDB,
};
