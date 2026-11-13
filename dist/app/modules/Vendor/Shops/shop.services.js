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
exports.ShopServices = void 0;
const prisma_1 = __importDefault(require("../../../../shared/prisma"));
const AppError_1 = __importDefault(require("../../../errors/AppError"));
const http_status_1 = __importDefault(require("http-status"));
const client_1 = require("@prisma/client");
const createShopIntoDB = (req) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const file = req.file;
        const { name, description } = req.body;
        // Validate required fields
        if (!name || !description) {
            throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Missing required fields.");
        }
        const u_email = req.user.email;
        const existingShop = yield prisma_1.default.shop.findFirst({
            where: {
                vendorEmail: u_email,
                isDeleted: false,
            },
        });
        if (existingShop) {
            throw new AppError_1.default(http_status_1.default.CONFLICT, "You already have an active registered shop!");
        }
        // Prepare user payload
        const shopPayload = {
            name,
            vendorEmail: u_email,
            description,
            logoUrl: file === null || file === void 0 ? void 0 : file.path,
        };
        const result = yield prisma_1.default.shop.create({
            data: shopPayload,
        });
        return result;
    }
    catch (error) {
        if (error instanceof AppError_1.default) {
            throw error;
        }
        console.error("Error creating Shop:", error);
        throw new AppError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, "Shop creation failed. Please try again.");
    }
});
const getMyShopFromDB = (vendorEmail) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("Fetching shop for vendor email:", vendorEmail);
        const shop = yield prisma_1.default.shop.findMany({
            where: {
                vendorEmail: vendorEmail,
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
        if (!shop) {
            console.warn(`No shop found for vendor email: ${vendorEmail}`);
        }
        return shop;
    }
    catch (error) {
        console.error(`Error fetching shop for vendor email: ${vendorEmail}`, error);
        throw new AppError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, "Failed to fetch shop. Please try again later.");
    }
});
const updateShopIntoDB = (req) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const payload = req.body;
        const file = req.file;
        const user = req.user;
        if (!payload.id) {
            throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Shop ID is required for update.");
        }
        if (file) {
            payload.logoUrl = file === null || file === void 0 ? void 0 : file.path;
        }
        const isShopExist = yield prisma_1.default.shop.findFirst({
            where: {
                id: payload.id,
                isDeleted: false,
            },
        });
        if (!isShopExist) {
            throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Shop not found");
        }
        // Enforce tenant ownership: only the shop vendor or an admin can update
        if (user.role !== client_1.UserRole.ADMIN && isShopExist.vendorEmail !== user.email) {
            throw new AppError_1.default(http_status_1.default.FORBIDDEN, "You do not have permission to update this shop!");
        }
        // Build sanitized update data to prevent schema injection or unknown fields
        const validUpdateData = {};
        if (typeof payload.name === "string" && payload.name.trim()) {
            validUpdateData.name = payload.name.trim();
        }
        if (typeof payload.description === "string") {
            validUpdateData.description = payload.description.trim();
        }
        if (file === null || file === void 0 ? void 0 : file.path) {
            validUpdateData.logoUrl = file.path;
        }
        else if (typeof payload.logoUrl === "string" && payload.logoUrl.trim()) {
            validUpdateData.logoUrl = payload.logoUrl.trim();
        }
        else if (typeof payload.imageUrl === "string" && payload.imageUrl.trim()) {
            validUpdateData.logoUrl = payload.imageUrl.trim();
        }
        const result = yield prisma_1.default.shop.update({
            where: {
                id: payload.id,
            },
            data: validUpdateData,
        });
        return result;
    }
    catch (error) {
        if (error instanceof AppError_1.default) {
            throw error;
        }
        console.error("Failed to update shop:", error);
        throw new AppError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, "Failed to update shop. Please try again later.");
    }
});
const getSingleShopFromDB = (shopId) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield prisma_1.default.shop.findFirst({
        where: {
            id: shopId,
            isDeleted: false, // Additional filter
        },
        select: {
            id: true,
            vendorEmail: true,
            name: true,
            logoUrl: true,
            description: true,
        },
    });
    if (!result) {
        throw new Error("Shop not found or it has been deleted.");
    }
    return result;
});
const getProductsByShopFromDB = (shopId) => __awaiter(void 0, void 0, void 0, function* () {
    const products = yield prisma_1.default.product.findMany({
        where: {
            shopId: shopId,
            isDeleted: false,
        },
        select: {
            id: true,
            name: true,
            description: true,
            price: true,
            discount: true,
            inventoryCount: true,
            imageUrl: true,
        },
    });
    return products;
});
const followShop = (req) => __awaiter(void 0, void 0, void 0, function* () {
    const u_email = req.user.email;
    const { s_id } = req.params;
    const result = yield prisma_1.default.follow.create({
        data: {
            customerEmail: u_email,
            shopId: s_id,
        },
    });
});
const unfollowShop = (req) => __awaiter(void 0, void 0, void 0, function* () {
    const u_email = req.user.email;
    const { s_id } = req.params;
    console.log("deleted", s_id);
    const review = yield prisma_1.default.follow.findFirst({
        where: {
            customerEmail: u_email,
            shopId: s_id,
        },
    });
    const result = yield prisma_1.default.follow.delete({
        where: {
            id: review === null || review === void 0 ? void 0 : review.id,
        },
    });
});
const getFollowers = (shopId) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield prisma_1.default.follow.findMany({
        where: {
            shopId: shopId,
        },
    });
    return result;
});
exports.ShopServices = {
    createShopIntoDB,
    getMyShopFromDB,
    updateShopIntoDB,
    getSingleShopFromDB,
    getProductsByShopFromDB,
    followShop,
    unfollowShop,
    getFollowers,
};
