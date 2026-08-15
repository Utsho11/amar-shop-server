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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerServices = void 0;
const prisma_1 = __importDefault(require("../../../shared/prisma"));
const client_1 = require("@prisma/client");
const payment_utils_1 = require("../../../utils/payment.utils");
const createOrderIntoDB = (req) => __awaiter(void 0, void 0, void 0, function* () {
    const payload = req.body;
    const { OrderItem, couponCode } = payload, rest = __rest(payload, ["OrderItem", "couponCode"]);
    const orderItemPayload = (OrderItem === null || OrderItem === void 0 ? void 0 : OrderItem.data) || [];
    const customerEmail = req.user.email;
    if (!orderItemPayload.length) {
        throw new Error("Cannot place an order with empty items.");
    }
    const customerDetails = yield prisma_1.default.customer.findUnique({
        where: {
            email: customerEmail,
        },
    });
    if (!customerDetails) {
        throw new Error("Customer profile not found.");
    }
    // Pre-validate stock and calculate secure server-side price
    let calculatedSubtotal = 0;
    const verifiedItems = [];
    for (const item of orderItemPayload) {
        const product = yield prisma_1.default.product.findUnique({
            where: { id: item.productId, isDeleted: false },
        });
        if (!product) {
            throw new Error(`Product not found or unavailable.`);
        }
        if (product.inventoryCount < item.quantity) {
            throw new Error(`Insufficient stock for "${product.name}". Available: ${product.inventoryCount}`);
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
        const coupon = yield prisma_1.default.coupon.findUnique({
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
        paymentStatus: client_1.PaymentStatus.PENDING,
        status: client_1.OrderStatus.PENDING,
        shippingAddress: payload.shippingAddress || rest.shippingAddress || null,
        shippingCity: payload.shippingCity || rest.shippingCity || null,
        shippingZipCode: payload.shippingZipCode || rest.shippingZipCode || null,
        shippingPhone: payload.shippingPhone || rest.shippingPhone || customerDetails.phone || null,
    };
    const transactionResult = yield prisma_1.default.$transaction((transactionClient) => __awaiter(void 0, void 0, void 0, function* () {
        const orderData = yield transactionClient.order.create({
            data: orderDataPayload,
        });
        yield Promise.all(verifiedItems.map((orderItem) => __awaiter(void 0, void 0, void 0, function* () {
            return transactionClient.orderItem.create({
                data: {
                    orderId: orderData.id,
                    productId: orderItem.productId,
                    quantity: orderItem.quantity,
                    price: orderItem.price,
                },
            });
        })));
        const tranxData = {
            orderId: orderData.id,
            transactionId: transactionId,
            amount: orderData.totalAmount,
            paymentStatus: client_1.PaymentStatus.PENDING,
        };
        yield transactionClient.transaction.create({
            data: tranxData,
        });
        const customerData = {
            name: customerDetails.name,
            email: customerDetails.email,
            totalAmount: finalAmount,
            transactionId: transactionId,
            phone: orderDataPayload.shippingPhone || "01700000000",
        };
        return { customerData: customerData };
    }));
    const paymentResponse = yield (0, payment_utils_1.initiatePayment)(transactionResult.customerData);
    return paymentResponse;
});
const getItemForReviewFromDB = (req) => __awaiter(void 0, void 0, void 0, function* () {
    const cus_email = req.user.email;
    const result = yield prisma_1.default.orderItem.findMany({
        where: {
            isReviewed: false,
            order: {
                customerEmail: cus_email,
                paymentStatus: client_1.PaymentStatus.PAID,
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
});
const addReviewIntoDB = (req) => __awaiter(void 0, void 0, void 0, function* () {
    const payload = req.body;
    const cus_email = req.user.email;
    const reviewData = {
        productId: payload.productId,
        customerEmail: cus_email,
        rating: Number(payload.rating),
        comment: payload.comment,
    };
    const result = yield prisma_1.default.review.create({
        data: reviewData,
    });
    if (result.id) {
        if (payload.orderItemId) {
            yield prisma_1.default.orderItem.update({
                where: { id: payload.orderItemId },
                data: { isReviewed: true },
            });
        }
        else {
            yield prisma_1.default.orderItem.updateMany({
                where: {
                    productId: payload.productId,
                    order: {
                        customerEmail: cus_email,
                        paymentStatus: client_1.PaymentStatus.PAID,
                    },
                },
                data: {
                    isReviewed: true,
                },
            });
        }
    }
    return "Review added successfully";
});
const getMyOrderHistoryFromDB = (req) => __awaiter(void 0, void 0, void 0, function* () {
    const cus_email = req.user.email;
    const orders = yield prisma_1.default.orderItem.findMany({
        where: {
            order: {
                customerEmail: cus_email,
                paymentStatus: client_1.PaymentStatus.PAID,
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
    const structuredOrders = orders.map((item) => {
        var _a;
        return ({
            id: item.id,
            orderId: item.order.id,
            quantity: item.quantity,
            productName: item.product.name,
            productPrice: item.price || item.product.price,
            productImage: item.product.imageUrl,
            transactionId: ((_a = item.order.Transaction[0]) === null || _a === void 0 ? void 0 : _a.transactionId) || null,
            orderStatus: item.order.status,
            createdAt: item.order.createdAt,
            shippingAddress: item.order.shippingAddress,
            shippingCity: item.order.shippingCity,
        });
    });
    return structuredOrders;
});
const toggleWishlistIntoDB = (req) => __awaiter(void 0, void 0, void 0, function* () {
    const { productId } = req.body;
    const customerEmail = req.user.email;
    if (!productId) {
        throw new Error("Product ID is required.");
    }
    const existing = yield prisma_1.default.wishlist.findUnique({
        where: {
            customerEmail_productId: {
                customerEmail,
                productId,
            },
        },
    });
    if (existing) {
        yield prisma_1.default.wishlist.delete({
            where: {
                id: existing.id,
            },
        });
        return { isWishlisted: false, message: "Product removed from wishlist." };
    }
    else {
        yield prisma_1.default.wishlist.create({
            data: {
                customerEmail,
                productId,
            },
        });
        return { isWishlisted: true, message: "Product added to wishlist." };
    }
});
const getMyWishlistFromDB = (req) => __awaiter(void 0, void 0, void 0, function* () {
    const customerEmail = req.user.email;
    const wishlist = yield prisma_1.default.wishlist.findMany({
        where: {
            customerEmail,
            product: {
                isDeleted: false,
            },
        },
        include: {
            product: {
                include: {
                    category: { select: { name: true } },
                    shop: { select: { id: true, name: true } },
                },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    });
    return wishlist.map((item) => item.product);
});
const getCustomerDashboardStatsFromDB = (req) => __awaiter(void 0, void 0, void 0, function* () {
    const customerEmail = req.user.email;
    const [orders, wishlistCount, reviewsGiven,] = yield Promise.all([
        prisma_1.default.order.findMany({
            where: {
                customerEmail,
                paymentStatus: "PAID",
            },
            include: {
                OrderItem: {
                    include: {
                        product: {
                            select: { name: true, imageUrl: true, price: true },
                        },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        }),
        prisma_1.default.wishlist.count({
            where: {
                customerEmail,
                product: { isDeleted: false },
            },
        }),
        prisma_1.default.review.count({
            where: { customerEmail },
        }),
    ]);
    const lifetimeSpend = orders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
    const totalOrders = orders.length;
    const inTransitOrders = orders.filter((o) => o.status === "PENDING" || o.status === "PROCESSING" || o.status === "SHIPPED");
    const inTransitOrdersCount = inTransitOrders.length;
    const activeDeliveries = inTransitOrders.slice(0, 3).map((o) => ({
        id: o.id,
        orderStatus: o.status,
        totalAmount: o.totalAmount,
        createdAt: o.createdAt,
        shippingAddress: o.shippingAddress,
        shippingCity: o.shippingCity,
        items: o.OrderItem.map((item) => {
            var _a;
            return ({
                productName: item.product.name,
                productImage: ((_a = item.product.imageUrl) === null || _a === void 0 ? void 0 : _a[0]) || "",
                quantity: item.quantity,
                price: item.price || item.product.price,
            });
        }),
    }));
    const recentOrders = orders.slice(0, 5).map((o) => ({
        id: o.id,
        orderStatus: o.status,
        totalAmount: o.totalAmount,
        createdAt: o.createdAt,
        shippingAddress: o.shippingAddress,
        shippingCity: o.shippingCity,
        itemCount: o.OrderItem.length,
        items: o.OrderItem.map((item) => {
            var _a;
            return ({
                productName: item.product.name,
                productImage: ((_a = item.product.imageUrl) === null || _a === void 0 ? void 0 : _a[0]) || "",
                quantity: item.quantity,
                price: item.price || item.product.price,
            });
        }),
    }));
    return {
        lifetimeSpend,
        totalOrders,
        inTransitOrdersCount,
        wishlistCount,
        reviewsGiven,
        activeDeliveries,
        recentOrders,
    };
});
exports.CustomerServices = {
    createOrderIntoDB,
    getItemForReviewFromDB,
    addReviewIntoDB,
    getMyOrderHistoryFromDB,
    toggleWishlistIntoDB,
    getMyWishlistFromDB,
    getCustomerDashboardStatsFromDB,
};
