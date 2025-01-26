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
    const { OrderItem } = payload, rest = __rest(payload, ["OrderItem"]);
    const orderItemPayload = OrderItem.data;
    const customerEmail = req.user.email;
    const customerDetails = yield prisma_1.default.customer.findUnique({
        where: {
            email: customerEmail,
        },
    });
    const transactionId = `TNX-${Date.now()}`;
    const order = yield prisma_1.default.$transaction((transactionClient) => __awaiter(void 0, void 0, void 0, function* () {
        const orderData = yield transactionClient.order.create({
            data: rest,
        });
        // Ensure all order items are created properly
        yield Promise.all(orderItemPayload.map((orderItem) => __awaiter(void 0, void 0, void 0, function* () {
            return transactionClient.orderItem.create({
                data: Object.assign({ orderId: orderData.id }, orderItem),
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
            name: customerDetails === null || customerDetails === void 0 ? void 0 : customerDetails.name,
            email: customerDetails === null || customerDetails === void 0 ? void 0 : customerDetails.email,
            totalAmount: payload.totalAmount,
            transactionId: transactionId,
            phone: customerDetails === null || customerDetails === void 0 ? void 0 : customerDetails.phone,
        };
        const res = yield (0, payment_utils_1.initiatePayment)(customerData);
        return res; // Optionally return the created order
    }));
    return order;
});
const getItemForReviewFromDB = (req) => __awaiter(void 0, void 0, void 0, function* () {
    const cus_email = req.user.email;
    const result = yield prisma_1.default.orderItem.findMany({
        where: {
            isReviewed: false,
            order: {
                customerEmail: cus_email,
                status: client_1.OrderStatus.COMPLETED,
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
        yield prisma_1.default.orderItem.updateMany({
            where: {
                productId: payload.productId,
                order: {
                    customerEmail: cus_email,
                    status: client_1.OrderStatus.COMPLETED,
                },
            },
            data: {
                isReviewed: true,
            },
        });
    }
    return "Review added successfully";
});
const getMyOrderHistoryFromDB = (req) => __awaiter(void 0, void 0, void 0, function* () {
    const cus_email = req.user.email;
    const orders = yield prisma_1.default.orderItem.findMany({
        where: {
            order: {
                customerEmail: cus_email,
                status: client_1.OrderStatus.COMPLETED,
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
    const structuredOrders = orders.map((item) => {
        var _a;
        return ({
            quantity: item.quantity,
            productName: item.product.name,
            productPrice: item.product.price,
            productImage: item.product.imageUrl,
            transactionId: ((_a = item.order.Transaction[0]) === null || _a === void 0 ? void 0 : _a.transactionId) || null,
        });
    });
    console.log(structuredOrders);
    return structuredOrders;
});
exports.CustomerServices = {
    createOrderIntoDB,
    getItemForReviewFromDB,
    addReviewIntoDB,
    getMyOrderHistoryFromDB,
};
