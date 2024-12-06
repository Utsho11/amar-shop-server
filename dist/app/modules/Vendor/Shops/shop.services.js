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
const createShopIntoDB = (req) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const file = req.file;
        const { name, description } = req.body;
        // Validate required fields
        if (!name || !description) {
            throw new Error("Missing required fields.");
        }
        const u_email = req.user.email;
        // Prepare user payload
        const shopPayload = {
            name,
            vendorEmail: u_email,
            description,
            logoUrl: file === null || file === void 0 ? void 0 : file.path,
        };
        // Create user in the database
        const result = yield prisma_1.default.shop.create({
            data: shopPayload,
        });
        return result;
    }
    catch (error) {
        console.error("Error creating Shop:", error);
        throw new Error("Shop creation failed. Please try again.");
    }
});
exports.ShopServices = {
    createShopIntoDB,
};
