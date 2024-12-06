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
const createProductIntoDB = (payload, images) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { files } = images;
        payload.imageUrls = files.map((image) => image.path);
        const isCategoryExist = yield prisma_1.default.category.findFirstOrThrow({
            where: {
                id: payload.categoryId,
                isDeleted: false,
            },
        });
        const isShopExist = yield prisma_1.default.shop.findFirstOrThrow({
            where: {
                id: payload.shopId,
                isDeleted: false,
            },
        });
        if (!isCategoryExist) {
            throw new Error("Category not found");
        }
        if (!isShopExist) {
            throw new Error("Shop not found");
        }
        const result = yield prisma_1.default.product.create({ data: payload });
        return result;
    }
    catch (error) {
        console.error("Error creating product:", error);
        throw new Error("Product creation failed. Please try again.");
    }
});
const updateProductIntoDB = (p_id, req) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const images = req.files;
        const { files } = images;
        const payload = req.body;
        if (files.length > 0) {
            payload.imageUrls = files.map((image) => image.path);
        }
        const isProductExist = yield prisma_1.default.product.findFirstOrThrow({
            where: {
                id: p_id,
                isDeleted: false,
            },
        });
        if (!isProductExist) {
            throw new Error("Product not found");
        }
        const result = yield prisma_1.default.product.update({
            where: {
                id: p_id,
            },
            data: payload,
        });
        return result;
    }
    catch (error) {
        throw new Error("Product update is failed. Please try again.");
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
const getAllProductsFromDB = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const products = yield prisma_1.default.product.findMany({
            where: {
                isDeleted: false,
            },
        });
        return products;
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
        console.log("Duplicated Product:", duplicatedProduct);
        return duplicatedProduct;
    }
    catch (error) {
        throw new Error("Duplicated Product Error!!!");
    }
});
exports.ProductServices = {
    createProductIntoDB,
    deleteProductFromDB,
    getAllProductsFromDB,
    getSingleProductFromDB,
    updateProductIntoDB,
    duplicateProductFromDB,
};
