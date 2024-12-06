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
        const isExistUser = yield prisma_1.default.user.findFirstOrThrow({
            where: {
                id: user_id,
                isDeleted: false,
            },
        });
        if (!isExistUser) {
            throw new AppError_1.default(http_status_1.default.NOT_FOUND, "User not found");
        }
        yield prisma_1.default.user.update({
            where: {
                id: user_id,
            },
            data: {
                status: client_1.UserStatus.BLOCKED,
            },
        });
    }
    catch (error) {
        throw new Error("Failed to suspend user!!!");
    }
});
exports.AdminServices = {
    suspendUserFromDB,
};
