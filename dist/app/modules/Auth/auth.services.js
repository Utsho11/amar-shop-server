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
        const { password, role } = req.body;
        const { name, email, phone } = req.body.user;
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
        // Create user in the database
        // const user = await prisma.user.create({
        //   data: userPayload,
        // });
        const user = yield prisma_1.default.$transaction((transactionClient) => __awaiter(void 0, void 0, void 0, function* () {
            yield transactionClient.user.create({
                data: userData,
            });
            if (userData.role === client_1.UserRole.ADMIN) {
                const createdAdminData = yield transactionClient.admin.create({
                    data: userPayload,
                });
                return createdAdminData;
            }
            if (userData.role === client_1.UserRole.CUSTOMER) {
                const createdCustomerData = yield transactionClient.customer.create({
                    data: userPayload,
                });
                return createdCustomerData;
            }
            if (userData.role === client_1.UserRole.VENDOR) {
                const createdCustomerData = yield transactionClient.vendor.create({
                    data: userPayload,
                });
                return createdCustomerData;
            }
        }));
        if (!user) {
            throw new Error("User creation failed. Please try again.");
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
        console.error("Error creating user:", error);
        throw new Error("User creation failed. Please try again.");
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
    const userData = yield prisma_1.default.user.findUniqueOrThrow({
        where: {
            email: payload.email,
            status: client_1.UserStatus.ACTIVE,
        },
    });
    const resetPassToken = jwtHelpers_1.jwtHelpers.generateToken({ email: userData.email, role: userData.role }, config_1.default.reset_pass_secret, config_1.default.reset_pass_secret_expire_in);
    //console.log(resetPassToken)
    const resetPassLink = config_1.default.reset_pass_link + `?userId=${userData.id}&token=${resetPassToken}`;
    yield (0, emailSender_1.default)(userData.email, `
      <div>
          <p>Dear User,</p>
          <p>Your password reset link 
              <a href=${resetPassLink}>
                  <button>
                      Reset Password
                  </button>
              </a>
          </p>

      </div>
      `);
    //console.log(resetPassLink)
});
const resetPassword = (token, payload) => __awaiter(void 0, void 0, void 0, function* () {
    // console.log({ token, payload });
    const userData = yield prisma_1.default.user.findUniqueOrThrow({
        where: {
            id: payload.userId,
            status: client_1.UserStatus.ACTIVE,
        },
    });
    // console.log(userData);
    const isValidToken = jwtHelpers_1.jwtHelpers.verifyToken(token, config_1.default.reset_pass_secret);
    if (!isValidToken) {
        throw new AppError_1.default(http_status_1.default.FORBIDDEN, "Forbidden!");
    }
    // hash password
    const password = yield bcrypt_1.default.hash(payload.password, 12);
    // update into database
    yield prisma_1.default.user.update({
        where: {
            id: payload.userId,
        },
        data: {
            password,
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
