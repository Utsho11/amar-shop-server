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
exports.verifyPayment = exports.initiatePayment = void 0;
const axios_1 = __importDefault(require("axios"));
const config_1 = __importDefault(require("../config"));
const initiatePayment = (customerData) => __awaiter(void 0, void 0, void 0, function* () {
    const response = yield axios_1.default.post(config_1.default.payment_url, {
        store_id: config_1.default.store_id,
        signature_key: config_1.default.signature_key,
        tran_id: customerData.transactionId,
        success_url: `http://localhost:5000/api/payment/confirmation?transactionId=${customerData.transactionId}&status=success`,
        fail_url: `http://localhost:5000/api/payment/confirmation?transactionId=${customerData.transactionId}&status=failed`,
        cancel_url: "http://localhost:5173/",
        amount: customerData.totalAmount,
        cus_name: customerData.name,
        cus_email: customerData.email,
        cus_phone: customerData.phone,
        currency: "BDT",
        desc: "Merchant Registration Payment",
        cus_add1: "N/A",
        cus_add2: "N/A",
        cus_city: "Dhaka",
        cus_state: "Dhaka",
        cus_postcode: "N/A",
        cus_country: "Bangladesh",
        type: "json",
    });
    return response.data;
});
exports.initiatePayment = initiatePayment;
const verifyPayment = (tnxId) => __awaiter(void 0, void 0, void 0, function* () {
    const response = yield axios_1.default.get(config_1.default.search_url, {
        params: {
            request_id: tnxId,
            store_id: config_1.default.store_id,
            signature_key: config_1.default.signature_key,
            type: "json",
        },
    });
    return response.data;
});
exports.verifyPayment = verifyPayment;
