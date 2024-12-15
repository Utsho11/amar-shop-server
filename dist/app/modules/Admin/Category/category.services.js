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
exports.CategoryServices = void 0;
const prisma_1 = __importDefault(require("../../../../shared/prisma"));
const AppError_1 = __importDefault(require("../../../errors/AppError"));
const http_status_1 = __importDefault(require("http-status"));
const createCategoryIntoDB = (req) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const file = req.file;
        const { name, description } = req.body;
        // Validate required fields
        if (!name) {
            throw new Error("Missing required fields.");
        }
        const u_email = req.user.email;
        // Prepare user payload
        const categoryPayload = {
            name,
            description,
            logoUrl: file === null || file === void 0 ? void 0 : file.path,
        };
        // Create user in the database
        const user = yield prisma_1.default.category.create({
            data: categoryPayload,
        });
    }
    catch (error) {
        console.error("Error creating Category:", error);
        throw new Error("Category creation failed. Please try again.");
    }
});
const updateCategoryIntoDB = (req) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const payload = req.body;
        const isExistCategory = yield prisma_1.default.category.findFirstOrThrow({
            where: {
                id: payload.id,
                isDeleted: false,
            },
        });
        if (!isExistCategory) {
            throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Category not found");
        }
        let updatedCategory = req.body;
        const file = req.file;
        if (file) {
            updatedCategory.logoUrl = file.path;
        }
        const result = yield prisma_1.default.category.update({
            where: {
                id: payload.id,
            },
            data: updatedCategory,
        });
        return result;
    }
    catch (error) {
        console.error("Error editing Category:", error);
        throw new Error("Category updation failed. Please try again.");
    }
});
const deleteCategoryFromDB = (category_id) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const isExistCategory = yield prisma_1.default.category.findFirstOrThrow({
            where: {
                id: category_id,
                isDeleted: false,
            },
        });
        if (!isExistCategory) {
            throw new AppError_1.default(http_status_1.default.NOT_FOUND, "Category not found");
        }
        const result = yield prisma_1.default.category.update({
            where: {
                id: category_id,
            },
            data: {
                isDeleted: true,
            },
        });
        return result;
    }
    catch (error) {
        console.error("Error deleting Category:", error);
        throw new Error("Category deletion failed. Please try again.");
    }
});
const getAllCategoriesFromDB = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const results = yield prisma_1.default.category.findMany({
            select: {
                id: true,
                name: true,
                logoUrl: true,
                description: true,
                isDeleted: true,
            },
        });
        return results;
    }
    catch (error) {
        throw new Error("Error fetching all categories");
    }
});
exports.CategoryServices = {
    createCategoryIntoDB,
    updateCategoryIntoDB,
    deleteCategoryFromDB,
    getAllCategoriesFromDB,
};
