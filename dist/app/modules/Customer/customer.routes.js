"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerRoutes = void 0;
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../../middlewares/auth"));
const client_1 = require("@prisma/client");
const customer_controllers_1 = require("./customer.controllers");
const router = express_1.default.Router();
router.post("/checkout", (0, auth_1.default)(client_1.UserRole.CUSTOMER), customer_controllers_1.CustomerControllers.createOrder);
router.post("/add-review", (0, auth_1.default)(client_1.UserRole.CUSTOMER), customer_controllers_1.CustomerControllers.addReview);
router.get("/orderItemForReview", (0, auth_1.default)(client_1.UserRole.CUSTOMER), customer_controllers_1.CustomerControllers.getItemForReview);
router.get("/myOrderHistory", (0, auth_1.default)(client_1.UserRole.CUSTOMER), customer_controllers_1.CustomerControllers.getMyOrderHistory);
exports.CustomerRoutes = router;
