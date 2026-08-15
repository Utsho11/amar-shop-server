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
const createProductIntoDB = (req) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const imgUrls = req.files;
        const { files } = imgUrls;
        // console.log(files);
        const payload = req.body;
        payload.imageUrl =
            files && files.length > 0 ? files.map((file) => file.path) : [];
        const u_email = req.user.email;
        const isCategoryExist = yield prisma_1.default.category.findFirstOrThrow({
            where: {
                id: payload.categoryId,
                isDeleted: false,
            },
        });
        const shopId = yield prisma_1.default.shop.findFirst({
            where: {
                vendorEmail: u_email,
                isDeleted: false,
            },
        });
        if (!isCategoryExist) {
            throw new Error("Category not found");
        }
        if (!shopId) {
            throw new Error("Shop not found");
        }
        payload.shopId = shopId.id;
        payload.discount = Number(payload.discount);
        payload.inventoryCount = Number(payload.inventoryCount);
        console.log(payload);
        const result = yield prisma_1.default.product.create({ data: payload });
        return result;
    }
    catch (error) {
        console.error("Error creating product:", error);
        throw new Error("Product creation failed. Please try again.");
    }
});
const updateProductIntoDB = (req) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const payload = req.body;
        const file = req.file;
        if (payload.discount !== undefined) {
            payload.discount = Number(payload.discount);
        }
        if (payload.inventoryCount !== undefined) {
            payload.inventoryCount = Number(payload.inventoryCount);
        }
        if (file) {
            payload.imageUrl = [file.path];
        }
        const isProductExist = yield prisma_1.default.product.findFirst({
            where: {
                id: payload.id,
                isDeleted: false,
            },
        });
        if (!isProductExist) {
            throw new Error("Product not found");
        }
        const result = yield prisma_1.default.product.update({
            where: {
                id: payload.id,
            },
            data: payload,
        });
        return result;
    }
    catch (error) {
        throw new Error("Product update failed. Please try again.");
    }
});
const deleteProductFromDB = (product_id) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const isProductExist = yield prisma_1.default.product.findFirstOrThrow({
            where: {
                id: product_id,
                isDeleted: false,
            },
        });
        if (!isProductExist) {
            throw new Error("Product not found");
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
        throw new Error("Product deletion is failed. Please try again.");
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
            },
            skip: (pageNumber - 1) * pageLimit,
            take: pageLimit,
            orderBy,
        });
        const totalProducts = yield prisma_1.default.product.count({ where });
        const hasMore = pageNumber * pageLimit < totalProducts;
        return {
            products,
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
const duplicateProductFromDB = (p_id) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const existingProduct = yield prisma_1.default.product.findUnique({
            where: { id: p_id },
        });
        if (!existingProduct) {
            throw new Error(`Product with ID ${p_id} not found`);
        }
        // Remove unique fields or modify them
        const { id } = existingProduct, productData = __rest(existingProduct, ["id"]);
        // Create a duplicate product
        const duplicatedProduct = yield prisma_1.default.product.create({
            data: Object.assign(Object.assign({}, productData), { name: `${existingProduct.name} (Copy)` }),
        });
        // console.log("Duplicated Product:", duplicatedProduct);
        return duplicatedProduct;
    }
    catch (error) {
        throw new Error("Duplicated Product Error!!!");
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
    });
    // console.log(results);
    return results;
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
