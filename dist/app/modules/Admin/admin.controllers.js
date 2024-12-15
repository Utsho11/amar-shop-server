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
exports.AdminControllers = void 0;
const catchAsync_1 = __importDefault(require("../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../shared/sendResponse"));
const admin_services_1 = require("./admin.services");
const suspendUser = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield admin_services_1.AdminServices.suspendUserFromDB(req);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "User suspended successfully",
    });
}));
const deleteUser = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield admin_services_1.AdminServices.deleteUserFromDB(req.params.u_id);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "User deleted successfully",
    });
}));
const getAllShops = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield admin_services_1.AdminServices.getAllShopsFromDB();
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "Shop retrieved successfully",
        data: result,
    });
}));
const blockShop = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield admin_services_1.AdminServices.blockShopIntoDB(req.params.shop_id);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "Shop blocked successfully",
    });
}));
const getAllTransactions = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield admin_services_1.AdminServices.getAllTransactionsFromDB();
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "Shop blocked successfully",
        data: result,
    });
}));
const createCoupon = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield admin_services_1.AdminServices.createCouponFromDB(req);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "Coupon created successfully",
        data: result,
    });
}));
const checkCoupon = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { code } = req.body;
    const result = yield admin_services_1.AdminServices.checkCouponFromDB(code);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        message: "Coupon Checked successfully",
        data: result,
    });
}));
exports.AdminControllers = {
    suspendUser,
    deleteUser,
    getAllShops,
    blockShop,
    getAllTransactions,
    createCoupon,
    checkCoupon,
};
