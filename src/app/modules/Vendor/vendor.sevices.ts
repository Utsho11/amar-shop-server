import { Request } from "express";
import prisma from "../../../shared/prisma";
import { OrderStatus } from "@prisma/client";
import AppError from "../../errors/AppError";
import httpStatus from "http-status";

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
        status: true,
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
      orderStatus: item.status || item.order.status,
      overallOrderStatus: item.order.status,
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
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Invalid status. Must be one of: ${Object.values(OrderStatus).join(", ")}`
    );
  }

  // Ensure this vendor owns products in this order
  const vendorItems = await prisma.orderItem.findMany({
    where: {
      orderId: orderId,
      product: {
        shop: {
          vendorEmail: v_email,
        },
      },
    },
  });

  if (!vendorItems.length) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Order not found or you are not authorized to update items in this order."
    );
  }

  // Update only the line-items belonging to this vendor
  await prisma.orderItem.updateMany({
    where: {
      orderId: orderId,
      product: {
        shop: {
          vendorEmail: v_email,
        },
      },
    },
    data: {
      status: status as OrderStatus,
    },
  });

  // Calculate aggregate parent order fulfillment status
  const allOrderItems = await prisma.orderItem.findMany({
    where: { orderId: orderId },
    select: { status: true },
  });

  const allStatuses = allOrderItems.map((i) => i.status);
  let aggregateStatus = status as OrderStatus;

  if (allStatuses.every((s) => s === OrderStatus.COMPLETED || s === OrderStatus.DELIVERED)) {
    aggregateStatus = OrderStatus.DELIVERED;
  } else if (allStatuses.some((s) => s === OrderStatus.SHIPPED)) {
    aggregateStatus = OrderStatus.SHIPPED;
  } else if (allStatuses.some((s) => s === OrderStatus.PROCESSING)) {
    aggregateStatus = OrderStatus.PROCESSING;
  } else if (allStatuses.every((s) => s === OrderStatus.CANCELLED)) {
    aggregateStatus = OrderStatus.CANCELLED;
  }

  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: { status: aggregateStatus },
  });

  return {
    orderId,
    vendorUpdatedStatus: status,
    parentOrderStatus: updatedOrder.status,
  };
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


const generateAiProductData = async (payload: { titleHint: string; categoryName?: string }) => {
  const { titleHint, categoryName = "General" } = payload;

  if (!titleHint || !titleHint.trim()) {
    throw new AppError(httpStatus.BAD_REQUEST, "Please provide a product title hint or keyword.");
  }

  const rawTitle = titleHint.trim();
  const lowerTitle = rawTitle.toLowerCase();

  let niche = "lifestyle";
  let suggestedPrice = 1499;
  let suggestedDiscount = 12;

  if (
    lowerTitle.includes("shirt") ||
    lowerTitle.includes("panjabi") ||
    lowerTitle.includes("dress") ||
    lowerTitle.includes("pant") ||
    lowerTitle.includes("jacket")
  ) {
    niche = "apparel";
    suggestedPrice = 1850;
    suggestedDiscount = 15;
  } else if (
    lowerTitle.includes("phone") ||
    lowerTitle.includes("earbud") ||
    lowerTitle.includes("watch") ||
    lowerTitle.includes("laptop") ||
    lowerTitle.includes("charger")
  ) {
    niche = "electronics";
    suggestedPrice = 3200;
    suggestedDiscount = 10;
  } else if (
    lowerTitle.includes("cream") ||
    lowerTitle.includes("serum") ||
    lowerTitle.includes("oil") ||
    lowerTitle.includes("soap")
  ) {
    niche = "beauty";
    suggestedPrice = 850;
    suggestedDiscount = 5;
  }

  const capitalizedTitle = rawTitle
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");

  const enhancedName = `Premium ${capitalizedTitle}`;

  let description = "";

  if (niche === "apparel") {
    description = `Elevate your everyday wardrobe with the **${enhancedName}**. Crafted from premium, breathable fabric engineered for all-day comfort and enduring elegance. Whether you're heading to a casual outing or an evening gathering, this piece delivers the perfect blend of modern sophistication and timeless tailoring.

### ✨ Key Highlights & Features:
* **Breathable Fabric:** Ultra-soft, skin-friendly textile designed to keep you cool and comfortable in humid weather.
* **Modern Tailoring:** Precision-stitched seams with a structured silhouette that complements every body type.
* **Color Fastness:** Rich, fade-resistant dyes that retain vibrancy wash after wash.
* **Versatile Styling:** Pairs effortlessly with formal trousers, casual chinos, or denim.

### 🧵 Material & Care:
* **Fabric Composition:** 100% Combed Cotton / Linen Blend.
* **Care Instructions:** Machine wash cold with like colors. Tumble dry low or line dry in shade. Warm iron if necessary.`;
  } else if (niche === "electronics") {
    description = `Experience cutting-edge technology and seamless performance with the **${enhancedName}**. Designed for tech enthusiasts and everyday professionals who demand reliability, sleek ergonomics, and uncompromising performance.

### ✨ Key Highlights & Features:
* **High-Efficiency Core:** Built with high-grade components ensuring rapid responsiveness and long-term durability.
* **Ergonomic & Portable:** Compact, lightweight form factor designed for effortless portability on the go.
* **Extended Battery / Lifespan:** Optimized power management delivering hours of uninterrupted productivity.
* **Universal Compatibility:** Works seamlessly across iOS, Android, macOS, and Windows ecosystems.

### ⚙️ Technical Specifications:
* **Build Material:** Matte Polycarbonate with reinforced alloy accents.
* **Package Includes:** 1x ${enhancedName}, 1x Fast-Charging Cable, User Guide.`;
  } else {
    description = `Discover superior craftsmanship and exceptional everyday utility with the **${enhancedName}**. Meticulously developed to provide top-tier performance, premium aesthetics, and long-lasting quality.

### ✨ Key Highlights & Features:
* **Premium Grade Quality:** Manufactured adhering to strict quality benchmarks for maximum durability.
* **Thoughtful Design:** Engineered for seamless daily usability and modern aesthetic appeal.
* **Vendor Authenticity Guaranteed:** 100% genuine product backed by our verified vendor guarantee.

### 📦 Package & Warranty:
* **Includes:** Genuine branded product packaging and verified warranty card.
* **Customer Support:** 7-day hassle-free replacement on manufacturer defects.`;
  }

  const tags = [
    categoryName.toLowerCase(),
    ...lowerTitle.split(" ").filter((w) => w.length > 3),
    "bestseller",
    "trending",
  ];

  return {
    name: enhancedName,
    description,
    suggestedPrice,
    suggestedDiscount,
    tags,
  };
};

export const VendorServices = {
  generateAiProductData,
  getProductsFromDB,
  getOrderHistoryFromDB,
  updateOrderStatusIntoDB,
  getVendorDashboardStatsFromDB,
};
