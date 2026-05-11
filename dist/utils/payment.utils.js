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
    const payload = new URLSearchParams();
    payload.append("store_id", "mycom68879f5a838b7");
    payload.append("store_passwd", "mycom68879f5a838b7@ssl");
    payload.append("total_amount", String(customerData.totalAmount));
    payload.append("currency", "BDT");
    payload.append("tran_id", customerData.transactionId);
    payload.append("success_url", `https://amar-shop-server-gules.vercel.app/api/payment/confirmation?transactionId=${customerData.transactionId}&status=success`);
    payload.append("fail_url", `https://amar-shop-server-gules.vercel.app/api/payment/confirmation?transactionId=${customerData.transactionId}&status=failed`);
    payload.append("cancel_url", "https://amar-shop-client.vercel.app/payment-cancel");
    payload.append("ipn_url", "https://amar-shop-server-gules.vercel.app/api/payment/ipn");
    payload.append("cus_name", customerData.name);
    payload.append("cus_email", customerData.email);
    payload.append("cus_phone", customerData.phone);
    payload.append("cus_add1", "N/A");
    payload.append("cus_city", "Dhaka");
    payload.append("cus_postcode", "1000");
    payload.append("cus_country", "Bangladesh");
    payload.append("shipping_method", "NO");
    payload.append("product_name", "AmarShop Order");
    payload.append("product_category", "Ecommerce");
    payload.append("product_profile", "general");
    payload.append("type", "json");
    const response = yield axios_1.default.post(config_1.default.payment_url, payload, {
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
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
