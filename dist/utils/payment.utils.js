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
exports.verifyPaymentByTransactionId = exports.verifyPayment = exports.initiatePayment = void 0;
const axios_1 = __importDefault(require("axios"));
const config_1 = __importDefault(require("../config"));
const initiatePayment = (customerData) => __awaiter(void 0, void 0, void 0, function* () {
    const payload = new URLSearchParams();
    payload.append("store_id", config_1.default.store_id || "testbox");
    payload.append("store_passwd", config_1.default.store_passwd || "qwerty");
    payload.append("total_amount", String(customerData.totalAmount));
    payload.append("currency", "BDT");
    payload.append("tran_id", customerData.transactionId);
    payload.append("success_url", `${config_1.default.server_base_url}/api/payment/confirmation?transactionId=${customerData.transactionId}&status=success`);
    payload.append("fail_url", `${config_1.default.server_base_url}/api/payment/confirmation?transactionId=${customerData.transactionId}&status=failed`);
    payload.append("cancel_url", `${config_1.default.server_base_url}/api/payment/confirmation?transactionId=${customerData.transactionId}&status=cancel`);
    payload.append("ipn_url", `${config_1.default.server_base_url}/api/payment/ipn`);
    payload.append("cus_name", customerData.name || "Customer");
    payload.append("cus_email", customerData.email);
    payload.append("cus_phone", customerData.phone || "01700000000");
    payload.append("cus_add1", "Dhaka");
    payload.append("cus_city", "Dhaka");
    payload.append("cus_postcode", "1000");
    payload.append("cus_country", "Bangladesh");
    payload.append("shipping_method", "NO");
    payload.append("product_name", "AmarShop Products");
    payload.append("product_category", "Ecommerce");
    payload.append("product_profile", "general");
    const response = yield axios_1.default.post(config_1.default.payment_url, payload, {
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
    });
    return response.data;
});
exports.initiatePayment = initiatePayment;
const verifyPayment = (valId) => __awaiter(void 0, void 0, void 0, function* () {
    const response = yield axios_1.default.get(config_1.default.search_url, {
        params: {
            val_id: valId,
            store_id: config_1.default.store_id || "testbox",
            store_passwd: config_1.default.store_passwd || "qwerty",
            format: "json",
        },
    });
    return response.data;
});
exports.verifyPayment = verifyPayment;
const verifyPaymentByTransactionId = (tranId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const isSandbox = (_a = config_1.default.payment_url) === null || _a === void 0 ? void 0 : _a.includes("sandbox");
    const baseUrl = isSandbox
        ? "https://sandbox.sslcommerz.com/validator/api/merchantTransIDvalidationAPI.php"
        : "https://securepay.sslcommerz.com/validator/api/merchantTransIDvalidationAPI.php";
    const response = yield axios_1.default.get(baseUrl, {
        params: {
            tran_id: tranId,
            store_id: config_1.default.store_id || "testbox",
            store_passwd: config_1.default.store_passwd || "qwerty",
            format: "json",
        },
    });
    return response.data;
});
exports.verifyPaymentByTransactionId = verifyPaymentByTransactionId;
