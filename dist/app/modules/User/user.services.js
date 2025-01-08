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
// const getAllUsersFromDB = async () => {
//   try {
//     const result = await prisma.user.findMany({
//       select: {
//         id: true,
//         email: true,
//         role: true,
//         status: true,
//         isDeleted: true,
//       },
//     });
//     return result;
//   } catch (error) {
//     throw new Error("Failed to fetch users!!!");
//   }
// };
const getAllUsersFromDB = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield prisma_1.default.user.findMany({
            select: {
                id: true,
                email: true,
                role: true,
                status: true,
                isDeleted: true,
                Admin: {
                    select: {
                        image: true,
                        name: true,
                    },
                },
                Customer: {
                    select: {
                        image: true,
                        name: true,
                    },
                },
                Vendor: {
                    select: {
                        image: true,
                        name: true,
                    },
                },
            },
        });
        // Add a unified `image` field based on the user's role
        const usersWithImages = result.map((user) => {
            let image = null;
            let name = null;
            if (user.role === "ADMIN" && user.Admin) {
                image = user.Admin.image;
                name = user.Admin.name;
            }
            else if (user.role === "CUSTOMER" && user.Customer) {
                image = user.Customer.image;
                name = user.Customer.name;
            }
            else if (user.role === "VENDOR" && user.Vendor) {
                image = user.Vendor.image;
                name = user.Vendor.name;
            }
            return Object.assign(Object.assign({}, user), { image, name });
        });
        return usersWithImages;
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
const getMyProfileFromDB = (user) => __awaiter(void 0, void 0, void 0, function* () {
    const userInfo = yield prisma_1.default.user.findUniqueOrThrow({
        where: {
            email: user === null || user === void 0 ? void 0 : user.email,
            status: client_1.UserStatus.ACTIVE,
        },
        select: {
            id: true,
            email: true,
            needPasswordChange: true,
            role: true,
            status: true,
        },
    });
    let profileInfo;
    if (userInfo.role === client_1.UserRole.CUSTOMER) {
        profileInfo = yield prisma_1.default.customer.findUnique({
            where: {
                email: userInfo.email,
            },
        });
    }
    else if (userInfo.role === client_1.UserRole.ADMIN) {
        profileInfo = yield prisma_1.default.admin.findUnique({
            where: {
                email: userInfo.email,
            },
        });
    }
    else if (userInfo.role === client_1.UserRole.VENDOR) {
        profileInfo = yield prisma_1.default.vendor.findUnique({
            where: {
                email: userInfo.email,
            },
        });
    }
    return Object.assign(Object.assign({}, userInfo), profileInfo);
});
exports.UserServices = {
    getAllUsersFromDB,
    updateUserIntoDB,
    getMyProfileFromDB,
};
