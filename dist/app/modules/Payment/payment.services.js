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
exports.PaymentService = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = __importDefault(require("../../../shared/prisma"));
const payment_utils_1 = require("../../../utils/payment.utils");
const fs_1 = require("fs");
const path_1 = require("path");
const confirmationService = (transactionId, status) => __awaiter(void 0, void 0, void 0, function* () {
    if (!transactionId) {
        console.error("Transaction ID is undefined");
        throw new Error("Transaction ID is required.");
    }
    // console.log("Processing Transaction ID:", transactionId);
    const response = yield (0, payment_utils_1.verifyPayment)(transactionId);
    // console.log("Payment Verification Response:", response);
    const successFilePath = (0, path_1.resolve)(__dirname, "../../../../public/confirmation.html");
    const failedFilePath = (0, path_1.resolve)(__dirname, "../../../../public/failed.html");
    const updateTransactionAndOrder = (paymentStatus, orderStatus) => __awaiter(void 0, void 0, void 0, function* () {
        const trnxData = yield prisma_1.default.transaction.update({
            where: { transactionId },
            data: { paymentStatus },
        });
        yield prisma_1.default.order.update({
            where: { id: trnxData.orderId },
            data: {
                status: orderStatus,
                paymentStatus,
            },
        });
        return trnxData;
    });
    if (status === "success" &&
        response &&
        response.pay_status === "Successful") {
        console.log("Payment Successful");
        yield updateTransactionAndOrder(client_1.PaymentStatus.PAID, client_1.OrderStatus.COMPLETED);
        return (0, fs_1.readFileSync)(successFilePath, "utf-8");
    }
    if (status === "failed") {
        console.log("Payment Failed");
        yield updateTransactionAndOrder(client_1.PaymentStatus.FAILED, client_1.OrderStatus.CANCELLED);
        return (0, fs_1.readFileSync)(failedFilePath, "utf-8");
    }
});
exports.PaymentService = {
    confirmationService,
};
