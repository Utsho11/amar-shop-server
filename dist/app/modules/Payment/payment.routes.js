"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentRoutes = void 0;
const express_1 = __importDefault(require("express"));
const payment_controllers_1 = require("./payment.controllers");
const router = express_1.default.Router();
router.post("/confirmation", payment_controllers_1.PaymentController.confirmationController);
exports.PaymentRoutes = router;
