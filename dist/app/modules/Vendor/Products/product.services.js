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
exports.ProductServices = void 0;
const prisma_1 = __importDefault(require("../../../../shared/prisma"));
const AppError_1 = __importDefault(require("../../../errors/AppError"));
const http_status_1 = __importDefault(require("http-status"));
const client_1 = require("@prisma/client");
const createProductIntoDB = (req) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const imgUrls = req.files;
        const { files } = (imgUrls || {});
        const payload = req.body;
        payload.imageUrl =
            files && files.length > 0 ? files.map((file) => file.path) : [];
        const u_email = req.user.email;
        const isCategoryExist = yield prisma_1.default.category.findFirst({
            where: {
                id: payload.categoryId,
                isDeleted: false,
            },
        });
        if (!isCategoryExist) {
            throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Category not found");
        }
        const shop = yield prisma_1.default.shop.findFirst({
            where: {
                vendorEmail: u_email,
                isDeleted: false,
            },
        });
        if (!shop) {
            throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Shop not found. Please create an active shop first.");
        }
        if (shop.isBlacklisted) {
            throw new AppError_1.default(http_status_1.default.FORBIDDEN, "Your shop is blacklisted. You cannot create products.");
        }
        // Strictly enforce shopId from verified vendor shop
        payload.shopId = shop.id;
        payload.price = Number(payload.price);
        payload.discount = Number(payload.discount || 0);
        payload.inventoryCount = Number(payload.inventoryCount || 0);
        const result = yield prisma_1.default.product.create({ data: payload });
        return result;
    }
    catch (error) {
        if (error instanceof AppError_1.default) {
            throw error;
        }
        console.error("Error creating product:", error);
        throw new AppError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, "Product creation failed. Please try again.");
    }
});
const updateProductIntoDB = (req) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const payload = req.body;
        const file = req.file;
        const user = req.user;
        if (!payload.id) {
            throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "Product ID is required for update.");
        }
        const isProductExist = yield prisma_1.default.product.findFirst({
            where: {
                id: payload.id,
                isDeleted: false,
            },
            include: {
                shop: true,
            },
        });
        if (!isProductExist) {
            throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Product not found");
        }
        // Enforce tenant ownership: only product's shop owner or admin can update
        if (user.role !== client_1.UserRole.ADMIN && ((_a = isProductExist.shop) === null || _a === void 0 ? void 0 : _a.vendorEmail) !== user.email) {
            throw new AppError_1.default(http_status_1.default.FORBIDDEN, "You do not have permission to update products from another shop!");
        }
        if (payload.price !== undefined) {
            payload.price = Number(payload.price);
        }
        if (payload.discount !== undefined) {
            payload.discount = Number(payload.discount);
        }
        if (payload.inventoryCount !== undefined) {
            payload.inventoryCount = Number(payload.inventoryCount);
        }
        if (file) {
            payload.imageUrl = [file.path];
        }
        // Never allow tampering with system or relation fields
        delete payload.id;
        delete payload.shopId;
        delete payload.shop;
        delete payload.Review;
        delete payload.OrderItem;
        delete payload.averageRating;
        delete payload.reviewCount;
        delete payload.createdAt;
        delete payload.updatedAt;
        delete payload.isDeleted;
        const result = yield prisma_1.default.product.update({
            where: {
                id: isProductExist.id,
            },
            data: payload,
        });
        return result;
    }
    catch (error) {
        if (error instanceof AppError_1.default) {
            throw error;
        }
        console.error("Error updating product:", error);
        throw new AppError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, "Product update failed. Please try again.");
    }
});
const deleteProductFromDB = (product_id, user) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const isProductExist = yield prisma_1.default.product.findFirst({
            where: {
                id: product_id,
                isDeleted: false,
            },
            include: {
                shop: true,
            },
        });
        if (!isProductExist) {
            throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Product not found");
        }
        // Enforce tenant ownership: only product's shop owner or admin can delete
        if (user.role !== client_1.UserRole.ADMIN && ((_a = isProductExist.shop) === null || _a === void 0 ? void 0 : _a.vendorEmail) !== user.email) {
            throw new AppError_1.default(http_status_1.default.FORBIDDEN, "You do not have permission to delete products from another shop!");
        }
        const result = yield prisma_1.default.product.update({
            where: {
                id: product_id,
            },
            data: {
                isDeleted: true,
            },
        });
        return result;
    }
    catch (error) {
        if (error instanceof AppError_1.default) {
            throw error;
        }
        console.error("Error deleting product:", error);
        throw new AppError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, "Product deletion failed. Please try again.");
    }
});
const getAllProductsFromDB = (req) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { page = 1, limit = 8, category, keyword, sortByPrice, sortBy, minPrice, maxPrice, inStock, } = req.query;
        const pageNumber = Number(page) || 1;
        const pageLimit = Number(limit) || 8;
        const where = {
            isDeleted: false,
        };
        // Apply category filter dynamically (supports name or ID)
        if (category && category !== "all" && category !== "All") {
            where.OR = [
                { category: { name: { equals: category.toString(), mode: "insensitive" } } },
                { categoryId: category.toString() },
            ];
        }
        // Apply keyword search filter dynamically
        if (keyword && keyword.toString().trim()) {
            const kw = keyword.toString().trim();
            where.AND = where.AND || [];
            where.AND.push({
                OR: [
                    { name: { contains: kw, mode: "insensitive" } },
                    { description: { contains: kw, mode: "insensitive" } },
                    { category: { name: { contains: kw, mode: "insensitive" } } },
                ],
            });
        }
        // Price range filters
        if (minPrice !== undefined || maxPrice !== undefined) {
            where.price = {};
            if (minPrice !== undefined && minPrice !== "") {
                where.price.gte = Number(minPrice);
            }
            if (maxPrice !== undefined && maxPrice !== "") {
                where.price.lte = Number(maxPrice);
            }
        }
        // In stock filter
        if (inStock === "true" || inStock === "1") {
            where.inventoryCount = { gt: 0 };
        }
        // Sort order
        let orderBy = { createdAt: "desc" };
        const sortParam = sortBy || sortByPrice;
        if (sortParam) {
            const s = sortParam.toString();
            if (s === "lowToHigh" || s === "priceAsc") {
                orderBy = { price: "asc" };
            }
            else if (s === "highToLow" || s === "priceDesc") {
                orderBy = { price: "desc" };
            }
            else if (s === "discount") {
                orderBy = { discount: "desc" };
            }
            else if (s === "newest") {
                orderBy = { createdAt: "desc" };
            }
        }
        // Fetch products from database with sorting
        const products = yield prisma_1.default.product.findMany({
            where,
            select: {
                id: true,
                name: true,
                description: true,
                price: true,
                discount: true,
                inventoryCount: true,
                imageUrl: true,
                shop: { select: { id: true, name: true } },
                category: { select: { id: true, name: true } },
                Review: { select: { rating: true } },
            },
            skip: (pageNumber - 1) * pageLimit,
            take: pageLimit,
            orderBy,
        });
        const formattedProducts = products.map((p) => {
            const reviewList = p.Review || [];
            const reviewCount = reviewList.length;
            const totalRating = reviewList.reduce((acc, r) => acc + (r.rating || 0), 0);
            const averageRating = reviewCount > 0 ? Math.round((totalRating / reviewCount) * 10) / 10 : 0;
            const { Review } = p, rest = __rest(p, ["Review"]);
            return Object.assign(Object.assign({}, rest), { reviewCount,
                averageRating });
        });
        const totalProducts = yield prisma_1.default.product.count({ where });
        const hasMore = pageNumber * pageLimit < totalProducts;
        return {
            products: formattedProducts,
            totalProducts,
            hasMore,
        };
    }
    catch (error) {
        throw new Error("Error fetching products: " + error);
    }
});
const getSingleProductFromDB = (p_id) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const product = yield prisma_1.default.product.findFirstOrThrow({
            where: {
                id: p_id,
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
                shop: { select: { id: true, name: true } },
                category: { select: { name: true } },
            },
        });
        return product;
    }
    catch (error) {
        throw new Error("Error fetching products: " + error);
    }
});
const duplicateProductFromDB = (p_id, user) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const existingProduct = yield prisma_1.default.product.findUnique({
            where: { id: p_id },
            include: { shop: true },
        });
        if (!existingProduct || existingProduct.isDeleted) {
            throw new AppError_1.default(http_status_1.default.NOT_FOUND, `Product with ID ${p_id} not found`);
        }
        // Enforce tenant ownership: only product's shop owner or admin can duplicate
        if (user.role !== client_1.UserRole.ADMIN && ((_a = existingProduct.shop) === null || _a === void 0 ? void 0 : _a.vendorEmail) !== user.email) {
            throw new AppError_1.default(http_status_1.default.FORBIDDEN, "You do not have permission to duplicate products from another shop!");
        }
        // Remove unique and timestamp fields
        const _b = existingProduct, { id, createdAt, updatedAt, shop } = _b, productData = __rest(_b, ["id", "createdAt", "updatedAt", "shop"]);
        const duplicatedProduct = yield prisma_1.default.product.create({
            data: Object.assign(Object.assign({}, productData), { shopId: existingProduct.shopId, name: `${existingProduct.name} (Copy)` }),
        });
        return duplicatedProduct;
    }
    catch (error) {
        if (error instanceof AppError_1.default) {
            throw error;
        }
        console.error("Error duplicating product:", error);
        throw new AppError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, "Duplicating product failed.");
    }
});
const getFlashSaleProductsFromDB = () => __awaiter(void 0, void 0, void 0, function* () {
    const results = yield prisma_1.default.product.findMany({
        where: {
            discount: {
                gt: 0,
            },
            isDeleted: false,
        },
        include: {
            shop: { select: { id: true, name: true } },
            category: { select: { id: true, name: true } },
            Review: { select: { rating: true } },
        },
    });
    return results.map((p) => {
        const reviewList = p.Review || [];
        const reviewCount = reviewList.length;
        const totalRating = reviewList.reduce((acc, r) => acc + (r.rating || 0), 0);
        const averageRating = reviewCount > 0 ? Math.round((totalRating / reviewCount) * 10) / 10 : 0;
        const { Review } = p, rest = __rest(p, ["Review"]);
        return Object.assign(Object.assign({}, rest), { reviewCount,
            averageRating });
    });
});
const getReviewsFromDB = (p_id_1, ...args_1) => __awaiter(void 0, [p_id_1, ...args_1], void 0, function* (p_id, page = 1, limit = 50) {
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 50;
    const result = yield prisma_1.default.review.findMany({
        where: {
            productId: p_id,
        },
        include: {
            customer: {
                select: {
                    name: true,
                    image: true,
                },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
    });
    const simplifiedReviews = result.map((review) => {
        var _a, _b;
        return ({
            id: review.id,
            rating: review.rating,
            comment: review.comment,
            createdAt: review.createdAt,
            username: ((_a = review.customer) === null || _a === void 0 ? void 0 : _a.name) || "Anonymous",
            image: ((_b = review.customer) === null || _b === void 0 ? void 0 : _b.image) || null,
        });
    });
    return simplifiedReviews;
});
const getRecommendedProductsFromDB = (p_id_1, ...args_1) => __awaiter(void 0, [p_id_1, ...args_1], void 0, function* (p_id, limit = 6) {
    try {
        const currentProduct = yield prisma_1.default.product.findUnique({
            where: { id: p_id },
            select: { categoryId: true, price: true, id: true },
        });
        if (!currentProduct) {
            return yield prisma_1.default.product.findMany({
                where: { isDeleted: false },
                take: limit,
                orderBy: { discount: "desc" },
                include: {
                    shop: { select: { id: true, name: true } },
                    category: { select: { name: true } },
                },
            });
        }
        const priceNum = Number(currentProduct.price);
        const minPrice = priceNum * 0.5;
        const maxPrice = priceNum * 1.5;
        let recommendations = yield prisma_1.default.product.findMany({
            where: {
                id: { not: p_id },
                categoryId: currentProduct.categoryId,
                isDeleted: false,
                price: {
                    gte: minPrice,
                    lte: maxPrice,
                },
            },
            take: limit,
            orderBy: {
                discount: "desc",
            },
            include: {
                shop: { select: { id: true, name: true } },
                category: { select: { name: true } },
            },
        });
        if (recommendations.length < limit) {
            const existingIds = [p_id, ...recommendations.map((r) => r.id)];
            const additional = yield prisma_1.default.product.findMany({
                where: {
                    id: { notIn: existingIds },
                    categoryId: currentProduct.categoryId,
                    isDeleted: false,
                },
                take: limit - recommendations.length,
                orderBy: {
                    discount: "desc",
                },
                include: {
                    shop: { select: { id: true, name: true } },
                    category: { select: { name: true } },
                },
            });
            recommendations = [...recommendations, ...additional];
        }
        if (recommendations.length < limit) {
            const existingIds = [p_id, ...recommendations.map((r) => r.id)];
            const fillers = yield prisma_1.default.product.findMany({
                where: {
                    id: { notIn: existingIds },
                    isDeleted: false,
                },
                take: limit - recommendations.length,
                orderBy: {
                    discount: "desc",
                },
                include: {
                    shop: { select: { id: true, name: true } },
                    category: { select: { name: true } },
                },
            });
            recommendations = [...recommendations, ...fillers];
        }
        return recommendations;
    }
    catch (error) {
        console.error("Error fetching recommendations:", error);
        return [];
    }
});
exports.ProductServices = {
    createProductIntoDB,
    deleteProductFromDB,
    getAllProductsFromDB,
    getSingleProductFromDB,
    updateProductIntoDB,
    duplicateProductFromDB,
    getFlashSaleProductsFromDB,
    getReviewsFromDB,
    getRecommendedProductsFromDB,
};
