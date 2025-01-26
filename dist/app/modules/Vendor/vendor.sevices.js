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
                                createdAt: true,
                            },
                        },
                    },
                },
            },
        });
        // Restructure the output
        const orderItems = rawOrderItems.map((item) => {
            var _a, _b;
            return ({
                quantity: item.quantity,
                productName: item.product.name,
                productImage: item.product.imageUrl,
                productPrice: item.product.price,
                transactionId: ((_a = item.order.Transaction[0]) === null || _a === void 0 ? void 0 : _a.transactionId) || null,
                createdAt: ((_b = item.order.Transaction[0]) === null || _b === void 0 ? void 0 : _b.createdAt) || null,
            });
        });
        // console.log(orderItems);
        return orderItems;
    }
    catch (error) {
        throw new Error("Error fetching order");
    }
});
exports.VendorServices = {
    getProductsFromDB,
    getOrderHistoryFromDB,
};
