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
exports.AuthServices = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma_1 = __importDefault(require("../../../shared/prisma"));
const jwtHelpers_1 = require("../../helpers/jwtHelpers");
const config_1 = __importDefault(require("../../../config"));
const client_1 = require("@prisma/client");
const AppError_1 = __importDefault(require("../../errors/AppError"));
const http_status_1 = __importDefault(require("http-status"));
const emailSender_1 = __importDefault(require("./emailSender"));
const createUser = (req) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const file = req.file;
        const { password, role = client_1.UserRole.CUSTOMER } = req.body;
        const { name, email, phone } = req.body.user;
        // Disallow public registration of ADMIN role
        if (role === client_1.UserRole.ADMIN || (role !== client_1.UserRole.CUSTOMER && role !== client_1.UserRole.VENDOR)) {
            throw new AppError_1.default(http_status_1.default.FORBIDDEN, "Admin accounts cannot be registered publicly!");
        }
        // Check if user already exists
        const isUserExist = yield prisma_1.default.user.findUnique({
            where: {
                email: email,
            },
        });
        if (isUserExist) {
            throw new AppError_1.default(http_status_1.default.CONFLICT, "User with this email already exists!");
        }
        // Hash the password
        const hashedPassword = yield bcrypt_1.default.hash(password, 12);
        // Prepare user payload
        const userData = {
            email: email,
            password: hashedPassword,
            role: role,
        };
        const userPayload = {
            name,
            email,
            phone,
            image: file === null || file === void 0 ? void 0 : file.path, // Include image if uploaded
        };
        const user = yield prisma_1.default.$transaction((transactionClient) => __awaiter(void 0, void 0, void 0, function* () {
            yield transactionClient.user.create({
                data: userData,
            });
            if (userData.role === client_1.UserRole.CUSTOMER) {
                const createdCustomerData = yield transactionClient.customer.create({
                    data: userPayload,
                });
                return createdCustomerData;
            }
            if (userData.role === client_1.UserRole.VENDOR) {
                const createdVendorData = yield transactionClient.vendor.create({
                    data: userPayload,
                });
                return createdVendorData;
            }
        }));
        if (!user) {
            throw new AppError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, "User creation failed. Please try again.");
        }
        // Generate tokens
        const accessToken = jwtHelpers_1.jwtHelpers.generateToken({ id: user.id, email: user.email, role: userData.role }, // Secure token payload
        config_1.default.access_secret, config_1.default.jwt_access_expires_in);
        const refreshToken = jwtHelpers_1.jwtHelpers.generateToken({ id: user.id, email: user.email, role: userData.role }, config_1.default.refresh_secret, config_1.default.jwt_refresh_expires_in);
        return {
            accessToken,
            refreshToken,
        };
    }
    catch (error) {
        if (error instanceof AppError_1.default) {
            throw error;
        }
        console.error("Error creating user:", error);
        throw new AppError_1.default(http_status_1.default.INTERNAL_SERVER_ERROR, "User creation failed. Please try again.");
    }
});
const loginUser = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const userData = yield prisma_1.default.user.findUniqueOrThrow({
        where: {
            email: payload.email,
            status: client_1.UserStatus.ACTIVE,
        },
    });
    const isCorrectPassword = yield bcrypt_1.default.compare(payload.password, userData.password);
    if (!isCorrectPassword) {
        throw new Error("Password incorrect!");
    }
    const accessToken = jwtHelpers_1.jwtHelpers.generateToken({
        email: userData.email,
        role: userData.role,
    }, config_1.default.access_secret, config_1.default.jwt_access_expires_in);
    const refreshToken = jwtHelpers_1.jwtHelpers.generateToken({
        email: userData.email,
        role: userData.role,
    }, config_1.default.refresh_secret, config_1.default.jwt_refresh_expires_in);
    return {
        accessToken,
        refreshToken,
    };
});
const refreshToken = (token) => __awaiter(void 0, void 0, void 0, function* () {
    let decodedData;
    try {
        decodedData = jwtHelpers_1.jwtHelpers.verifyToken(token, config_1.default.refresh_secret);
    }
    catch (err) {
        throw new Error("You are not authorized!");
    }
    const userData = yield prisma_1.default.user.findUniqueOrThrow({
        where: {
            email: decodedData.email,
            status: client_1.UserStatus.ACTIVE,
        },
    });
    const accessToken = jwtHelpers_1.jwtHelpers.generateToken({
        email: userData.email,
        role: userData.role,
    }, config_1.default.access_secret, config_1.default.jwt_access_expires_in);
    return {
        accessToken,
        needPasswordChange: userData.needPasswordChange,
    };
});
const changePassword = (user, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const userData = yield prisma_1.default.user.findUniqueOrThrow({
        where: {
            email: user.email,
            status: client_1.UserStatus.ACTIVE,
        },
    });
    const isCorrectPassword = yield bcrypt_1.default.compare(payload.oldPassword, userData.password);
    if (!isCorrectPassword) {
        throw new Error("Password incorrect!");
    }
    const hashedPassword = yield bcrypt_1.default.hash(payload.newPassword, 12);
    yield prisma_1.default.user.update({
        where: {
            email: userData.email,
        },
        data: {
            password: hashedPassword,
            needPasswordChange: false,
        },
    });
    return {
        message: "Password changed successfully!",
    };
});
const forgotPassword = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const userData = yield prisma_1.default.user.findUnique({
        where: {
            email: payload.email,
            status: client_1.UserStatus.ACTIVE,
        },
    });
    if (!userData) {
        // Avoid user enumeration
        return;
    }
    const resetPassToken = jwtHelpers_1.jwtHelpers.generateToken({ id: userData.id, email: userData.email, role: userData.role }, config_1.default.reset_pass_secret, config_1.default.reset_pass_secret_expire_in);
    const resetPassLink = config_1.default.reset_pass_link + `?userId=${userData.id}&token=${resetPassToken}`;
    yield (0, emailSender_1.default)(userData.email, `
      <div>
          <p>Dear User,</p>
          <p>Your password reset link:
              <a href="${resetPassLink}">
                  <button>Reset Password</button>
              </a>
          </p>
          <p>This link is valid for a limited time. If you did not request this, please ignore this email.</p>
      </div>
      `);
});
const resetPassword = (token, payload) => __awaiter(void 0, void 0, void 0, function* () {
    if (!token) {
        throw new AppError_1.default(http_status_1.default.UNAUTHORIZED, "Reset token is required!");
    }
    if (!payload.password) {
        throw new AppError_1.default(http_status_1.default.BAD_REQUEST, "New password is required!");
    }
    const cleanToken = token.startsWith("Bearer ")
        ? token.slice(7).trim()
        : token.trim();
    let decodedToken;
    try {
        decodedToken = jwtHelpers_1.jwtHelpers.verifyToken(cleanToken, config_1.default.reset_pass_secret);
    }
    catch (err) {
        throw new AppError_1.default(http_status_1.default.FORBIDDEN, "Invalid or expired reset token!");
    }
    if (!decodedToken || !decodedToken.email) {
        throw new AppError_1.default(http_status_1.default.FORBIDDEN, "Invalid reset token claims!");
    }
    // Derive target user strictly by token email/id to prevent IDOR
    const userData = yield prisma_1.default.user.findUnique({
        where: {
            email: decodedToken.email,
            status: client_1.UserStatus.ACTIVE,
        },
    });
    if (!userData) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, "User associated with reset token not found!");
    }
    // Enforce that if payload.userId is provided, it must match the token's authenticated user
    if (payload.userId && payload.userId !== userData.id) {
        throw new AppError_1.default(http_status_1.default.FORBIDDEN, "Token does not match target user ID!");
    }
    // Hash new password
    const hashedPassword = yield bcrypt_1.default.hash(payload.password, 12);
    // Update password in database
    yield prisma_1.default.user.update({
        where: {
            id: userData.id,
        },
        data: {
            password: hashedPassword,
            needPasswordChange: false,
        },
    });
});
exports.AuthServices = {
    createUser,
    loginUser,
    refreshToken,
    changePassword,
    forgotPassword,
    resetPassword,
};
