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
exports.ShopControllers = void 0;
const http_status_1 = __importDefault(require("http-status"));
const shop_services_1 = require("./shop.services");
const catchAsync_1 = __importDefault(require("../../../../shared/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../../shared/sendResponse"));
const createShop = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield shop_services_1.ShopServices.createShopIntoDB(req);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Shop Registration Completed successfuly!",
        data: result,
    });
}));
const getMyShop = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const u_email = req.user.email;
    const result = yield shop_services_1.ShopServices.getMyShopFromDB(u_email);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Shop Fetched Completed successfuly!",
        data: result,
    });
}));
const updateShop = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield shop_services_1.ShopServices.updateShopIntoDB(req);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Shop Updated Completed successfuly!",
        data: result,
    });
}));
const getSingleShop = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const s_id = req.params.id;
    const result = yield shop_services_1.ShopServices.getSingleShopFromDB(s_id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Shop Fetched Completed successfuly!",
        data: result,
    });
}));
const getProductsByShop = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { s_id } = req.params;
    const result = yield shop_services_1.ShopServices.getProductsByShopFromDB(s_id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Products fetched Completed successfuly!",
        data: result,
    });
}));
const followShop = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield shop_services_1.ShopServices.followShop(req);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Followed Successfully!",
    });
}));
const unfollowShop = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield shop_services_1.ShopServices.unfollowShop(req);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "UnFollowed Successfully!",
    });
}));
const getFollowers = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { s_id } = req.params;
    const result = yield shop_services_1.ShopServices.getFollowers(s_id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "Follower retrieved Successfully!",
        data: result,
    });
}));
exports.ShopControllers = {
    createShop,
    getMyShop,
    updateShop,
    getSingleShop,
    getProductsByShop,
    followShop,
    unfollowShop,
    getFollowers,
};
