"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VendorServices = void 0;
const prisma_1 = __importDefault(require("../../../shared/prisma"));
const client_1 = require("@prisma/client");
const getProductsFromDB = (req) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const v_email = req.user.email;
        const products = yield prisma_1.default.product.findMany({
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
    }
    catch (error) {
        throw new Error("Error fetching products: " + error);
    }
});
const getOrderHistoryFromDB = (req) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const v_email = req.user.email;
        const rawOrderItems = yield prisma_1.default.orderItem.findMany({
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
        const orderItems = rawOrderItems.map((item) => {
            var _a, _b;
            return ({
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
                transactionId: ((_a = item.order.Transaction[0]) === null || _a === void 0 ? void 0 : _a.transactionId) || null,
                createdAt: item.order.createdAt || ((_b = item.order.Transaction[0]) === null || _b === void 0 ? void 0 : _b.createdAt) || null,
            });
        });
        return orderItems;
    }
    catch (error) {
        throw new Error("Error fetching orders");
    }
});
const updateOrderStatusIntoDB = (req) => __awaiter(void 0, void 0, void 0, function* () {
    const { orderId } = req.params;
    const { status } = req.body;
    const v_email = req.user.email;
    if (!Object.values(client_1.OrderStatus).includes(status)) {
        throw new Error(`Invalid status. Must be one of: ${Object.values(client_1.OrderStatus).join(", ")}`);
    }
    // Ensure this vendor owns at least one product in this order
    const orderExists = yield prisma_1.default.order.findFirst({
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
    const updatedOrder = yield prisma_1.default.order.update({
        where: { id: orderId },
        data: { status: status },
    });
    return updatedOrder;
});
const getVendorDashboardStatsFromDB = (req) => __awaiter(void 0, void 0, void 0, function* () {
    const v_email = req.user.email;
    const shop = yield prisma_1.default.shop.findFirst({
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
    const [totalProducts, orderItems, reviews,] = yield Promise.all([
        prisma_1.default.product.count({
            where: { shopId: shop.id, isDeleted: false },
        }),
        prisma_1.default.orderItem.findMany({
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
        prisma_1.default.review.findMany({
            where: {
                product: { shopId: shop.id },
            },
            select: { rating: true },
        }),
    ]);
    const shopRevenue = orderItems.reduce((sum, item) => {
        var _a;
        const price = Number(item.price || ((_a = item.product) === null || _a === void 0 ? void 0 : _a.price) || 0);
        return sum + price * item.quantity;
    }, 0);
    const pendingOrdersCount = orderItems.filter((item) => item.order.status === "PENDING" || item.order.status === "PROCESSING").length;
    const completedOrdersCount = orderItems.filter((item) => item.order.status === "DELIVERED" || item.order.status === "COMPLETED").length;
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
        : 0;
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const currentYear = new Date().getFullYear();
    const monthlySalesMap = {};
    months.forEach((m) => {
        monthlySalesMap[m] = { revenue: 0, orders: 0 };
    });
    orderItems.forEach((item) => {
        var _a;
        const d = new Date(item.order.createdAt);
        if (d.getFullYear() === currentYear) {
            const monthName = months[d.getMonth()];
            const price = Number(item.price || ((_a = item.product) === null || _a === void 0 ? void 0 : _a.price) || 0);
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
});
exports.VendorServices = {
    getProductsFromDB,
    getOrderHistoryFromDB,
    updateOrderStatusIntoDB,
    getVendorDashboardStatsFromDB,
};
