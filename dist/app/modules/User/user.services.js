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
exports.UserServices = void 0;
const prisma_1 = __importDefault(require("../../../shared/prisma"));
const client_1 = require("@prisma/client");
const getAllUsersFromDB = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield prisma_1.default.user.findMany();
        return result;
    }
    catch (error) {
        throw new Error("Failed to fetch users!!!");
    }
});
const updateUserIntoDB = (user, req) => __awaiter(void 0, void 0, void 0, function* () {
    const userInfo = yield prisma_1.default.user.findUniqueOrThrow({
        where: {
            email: user === null || user === void 0 ? void 0 : user.email,
            status: client_1.UserStatus.ACTIVE,
        },
    });
    const file = req.file;
    const payload = req.body;
    payload.image = file === null || file === void 0 ? void 0 : file.path;
    try {
        if ((user === null || user === void 0 ? void 0 : user.role) === client_1.UserRole.ADMIN) {
            const profileInfo = yield prisma_1.default.admin.update({
                where: { email: userInfo.email },
                data: payload,
            });
            return Object.assign({}, profileInfo);
        }
        if ((user === null || user === void 0 ? void 0 : user.role) === client_1.UserRole.CUSTOMER) {
            const profileInfo = yield prisma_1.default.customer.update({
                where: { email: userInfo.email },
                data: payload,
            });
            return Object.assign({}, profileInfo);
        }
        if ((user === null || user === void 0 ? void 0 : user.role) === client_1.UserRole.VENDOR) {
            const profileInfo = yield prisma_1.default.vendor.update({
                where: { email: userInfo.email },
                data: payload,
            });
            return Object.assign({}, profileInfo);
        }
    }
    catch (error) {
        throw new Error("Failed to update user!!!");
    }
});
exports.UserServices = {
    getAllUsersFromDB,
    updateUserIntoDB,
};
