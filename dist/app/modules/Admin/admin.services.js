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
exports.AdminServices = void 0;
const prisma_1 = __importDefault(require("../../../shared/prisma"));
const client_1 = require("@prisma/client");
const AppError_1 = __importDefault(require("../../errors/AppError"));
const http_status_1 = __importDefault(require("http-status"));
const suspendUserFromDB = (req) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { user_id } = req.params;
        const isExistUser = yield prisma_1.default.user.findUnique({
            where: {
                id: user_id,
                isDeleted: false,
            },
        });
        if (!isExistUser) {
            throw new AppError_1.default(http_status_1.default.NOT_FOUND, "User not found");
        }
        let status;
        if (isExistUser.status === client_1.UserStatus.BLOCKED) {
            status = client_1.UserStatus.ACTIVE;
        }
        else {
            status = client_1.UserStatus.BLOCKED;
        }
        yield prisma_1.default.user.update({
            where: {
                id: user_id,
            },
            data: {
                status: status,
            },
        });
    }
    catch (error) {
        throw new Error("Failed to suspend user!!!");
    }
});
const deleteUserFromDB = (id) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const isExistUser = yield prisma_1.default.user.findUnique({
            where: {
                id: id,
                isDeleted: false,
            },
        });
        if (!isExistUser) {
            throw new AppError_1.default(http_status_1.default.NOT_FOUND, "User not found");
        }
        yield prisma_1.default.user.update({
            where: {
                id: id,
            },
            data: {
                isDeleted: true,
            },
        });
        if (isExistUser.role === "VENDOR") {
            yield prisma_1.default.vendor.update({
                where: {
                    email: isExistUser.email,
                },
                data: {
                    isDeleted: true,
                },
            });
        }
        if (isExistUser.role === "ADMIN") {
            yield prisma_1.default.admin.update({
                where: {
                    email: isExistUser.email,
                },
                data: {
                    isDeleted: true,
                },
            });
        }
        if (isExistUser.role === "CUSTOMER") {
            yield prisma_1.default.customer.update({
                where: {
                    email: isExistUser.email,
                },
                data: {
                    isDeleted: true,
                },
            });
        }
    }
    catch (error) {
        throw new Error("Failed to delete user!!!");
    }
});
const getAllShopsFromDB = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const shops = yield prisma_1.default.shop.findMany({
            where: {
                isDeleted: false,
            },
            select: {
                id: true,
                vendorEmail: true,
                name: true,
                logoUrl: true,
                description: true,
                isBlacklisted: true,
            },
        });
        return shops;
    }
    catch (error) {
        throw new Error("Failed to fetch shops!!!");
    }
});
const blockShopIntoDB = (shop_id) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const isShopExists = yield prisma_1.default.shop.findUnique({
            where: {
                id: shop_id,
                isDeleted: false,
            },
        });
        if (!isShopExists) {
            throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Shop not found");
        }
        let status;
        if (isShopExists.isBlacklisted === false) {
            status = true;
        }
        else {
            status = false;
        }
        yield prisma_1.default.shop.update({
            where: {
                id: shop_id,
            },
            data: {
                isBlacklisted: status,
            },
        });
    }
    catch (error) {
        throw new Error("Failed to block shop!!!");
    }
});
const getAllTransactionsFromDB = () => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield prisma_1.default.transaction.findMany({
        select: {
            orderId: true,
            transactionId: true,
            amount: true,
            paymentStatus: true,
            createdAt: true,
        },
    });
    return result;
});
const createCouponFromDB = (req) => __awaiter(void 0, void 0, void 0, function* () {
    const payload = req.body;
    payload.discount = Number(payload.discount);
    const data = {
        code: payload.code,
        discountPercent: payload.discount,
    };
    const result = yield prisma_1.default.coupon.create({
        data: data,
    });
    return result;
});
const checkCouponFromDB = (code) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(code);
    const result = yield prisma_1.default.coupon.findUniqueOrThrow({
        where: { code },
        select: {
            discountPercent: true,
        },
    });
    // Check if a coupon was found
    if (result) {
        // console.log(result);
        return result.discountPercent;
    }
    else {
        console.log("Coupon not found.");
        return null; // Return null if no coupon is found
    }
});
exports.AdminServices = {
    suspendUserFromDB,
    deleteUserFromDB,
    getAllShopsFromDB,
    blockShopIntoDB,
    getAllTransactionsFromDB,
    createCouponFromDB,
    checkCouponFromDB,
};
