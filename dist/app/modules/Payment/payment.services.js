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
const config_1 = __importDefault(require("../../../config"));
const confirmationService = (transactionId, status, valId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    if (!transactionId) {
        throw new Error("Transaction ID is required.");
    }
    let isPaymentSuccessful = false;
    const normalizedStatus = (status || "").toLowerCase();
    if (normalizedStatus === "success" ||
        normalizedStatus === "valid" ||
        normalizedStatus === "validated") {
        try {
            if (valId) {
                const response = yield (0, payment_utils_1.verifyPayment)(valId);
                if (response &&
                    (response.status === "VALID" ||
                        response.status === "VALIDATED" ||
                        response.status === "SUCCESS")) {
                    isPaymentSuccessful = true;
                }
            }
            else {
                const response = yield (0, payment_utils_1.verifyPaymentByTransactionId)(transactionId);
                if (response &&
                    (response.status === "VALID" ||
                        response.status === "VALIDATED" ||
                        response.status === "SUCCESS" ||
                        ((_b = (_a = response.element) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.status) === "VALID")) {
                    isPaymentSuccessful = true;
                }
                else {
                    isPaymentSuccessful = false;
                }
            }
        }
        catch (err) {
            console.warn("Payment verification error in sandbox:", err);
            console.error(err);
            isPaymentSuccessful = false;
        }
    }
    const clientUrl = config_1.default.client_base_url || "http://localhost:5173";
    if (isPaymentSuccessful) {
        let trnxFound = true;
        yield prisma_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            const existingTrnx = yield tx.transaction.findUnique({
                where: { transactionId },
            });
            if (!existingTrnx) {
                trnxFound = false;
                return;
            }
            const wasAlreadyPaid = existingTrnx.paymentStatus === client_1.PaymentStatus.PAID;
            yield tx.transaction.update({
                where: { transactionId },
                data: { paymentStatus: client_1.PaymentStatus.PAID },
            });
            yield tx.order.update({
                where: { id: existingTrnx.orderId },
                data: {
                    status: client_1.OrderStatus.COMPLETED,
                    paymentStatus: client_1.PaymentStatus.PAID,
                },
            });
            // Atomically decrement inventory count once only
            if (!wasAlreadyPaid) {
                const orderItems = yield tx.orderItem.findMany({
                    where: { orderId: existingTrnx.orderId },
                });
                for (const item of orderItems) {
                    yield tx.product.update({
                        where: { id: item.productId },
                        data: {
                            inventoryCount: {
                                decrement: item.quantity,
                            },
                        },
                    });
                }
            }
        }));
        const targetUrl = `${clientUrl}/customerDashboard/myOrder?payment=success&tran_id=${transactionId}`;
        const failedUrl = `${clientUrl}/checkout?payment=failed&tran_id=${transactionId}`;
        if (!trnxFound) {
            const html = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta http-equiv="refresh" content="1;url=${failedUrl}" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Payment Failed - Amar Shop</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              background-color: #f9f5f0;
              color: #3d352f;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              padding: 20px;
              box-sizing: border-box;
            }
            .card {
              background: #ffffff;
              border-radius: 24px;
              padding: 40px;
              max-width: 500px;
              width: 100%;
              text-align: center;
              box-shadow: 0 10px 30px rgba(0,0,0,0.06);
              border: 1px solid #e8ded2;
            }
            .icon {
              width: 64px;
              height: 64px;
              background-color: #ffebee;
              color: #c62828;
              border-radius: 50%;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              font-size: 32px;
              margin-bottom: 20px;
            }
            h1 {
              color: #c62828;
              margin: 0 0 10px 0;
              font-size: 24px;
            }
            p {
              color: #6b5e57;
              line-height: 1.6;
              margin: 10px 0 20px 0;
            }
            .badge {
              display: inline-block;
              background: #f4ede4;
              padding: 6px 14px;
              border-radius: 20px;
              font-family: monospace;
              font-size: 14px;
              margin-bottom: 24px;
            }
            .btn {
              display: inline-block;
              background-color: #a66b55;
              color: #ffffff;
              text-decoration: none;
              padding: 12px 28px;
              border-radius: 30px;
              font-weight: 600;
              font-size: 15px;
            }
          </style>
          <script>
            try {
              if (window.top && window.top !== window) {
                window.top.location.href = "${failedUrl}";
              } else {
                window.location.replace("${failedUrl}");
              }
            } catch (e) {
              window.location.replace("${failedUrl}");
            }
          </script>
        </head>
        <body>
          <div class="card">
            <div class="icon">✕</div>
            <h1>Payment Failed or Cancelled</h1>
            <p>Your transaction could not be completed. Redirecting to checkout...</p>
            <div class="badge">Trx ID: ${transactionId}</div>
            <div>
              <a href="${failedUrl}" class="btn">Click here if not redirected automatically</a>
            </div>
          </div>
        </body>
      </html>
    `;
            return {
                isSuccess: false,
                redirectUrl: failedUrl,
                html,
            };
        }
        const html = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta http-equiv="refresh" content="1;url=${targetUrl}" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Payment Successful - Amar Shop</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              background-color: #f9f5f0;
              color: #3d352f;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              padding: 20px;
              box-sizing: border-box;
            }
            .card {
              background: #ffffff;
              border-radius: 24px;
              padding: 40px;
              max-width: 500px;
              width: 100%;
              text-align: center;
              box-shadow: 0 10px 30px rgba(0,0,0,0.06);
              border: 1px solid #e8ded2;
            }
            .icon {
              width: 64px;
              height: 64px;
              background-color: #e8f5e9;
              color: #2e7d32;
              border-radius: 50%;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              font-size: 32px;
              margin-bottom: 20px;
            }
            h1 {
              color: #2e7d32;
              margin: 0 0 10px 0;
              font-size: 24px;
            }
            p {
              color: #6b5e57;
              line-height: 1.6;
              margin: 10px 0 20px 0;
            }
            .badge {
              display: inline-block;
              background: #f4ede4;
              padding: 6px 14px;
              border-radius: 20px;
              font-family: monospace;
              font-size: 14px;
              margin-bottom: 24px;
            }
            .btn {
              display: inline-block;
              background-color: #a66b55;
              color: #ffffff;
              text-decoration: none;
              padding: 12px 28px;
              border-radius: 30px;
              font-weight: 600;
              font-size: 15px;
            }
          </style>
          <script>
            try {
              if (window.top && window.top !== window) {
                window.top.location.href = "${targetUrl}";
              } else {
                window.location.replace("${targetUrl}");
              }
            } catch (e) {
              window.location.replace("${targetUrl}");
            }
          </script>
        </head>
        <body>
          <div class="card">
            <div class="icon">✓</div>
            <h1>Payment Successful!</h1>
            <p>Your payment has been verified. Redirecting you to your orders...</p>
            <div class="badge">Trx ID: ${transactionId}</div>
            <div>
              <a href="${targetUrl}" class="btn">Click here if not redirected automatically</a>
            </div>
          </div>
        </body>
      </html>
    `;
        return {
            isSuccess: true,
            redirectUrl: targetUrl,
            html,
        };
    }
    else {
        yield prisma_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            const trnxData = yield tx.transaction.update({
                where: { transactionId },
                data: { paymentStatus: client_1.PaymentStatus.FAILED },
            });
            yield tx.order.update({
                where: { id: trnxData.orderId },
                data: {
                    status: client_1.OrderStatus.CANCELLED,
                    paymentStatus: client_1.PaymentStatus.FAILED,
                },
            });
        }));
        const targetUrl = `${clientUrl}/checkout?payment=failed&tran_id=${transactionId}`;
        const html = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta http-equiv="refresh" content="1;url=${targetUrl}" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Payment Failed - Amar Shop</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              background-color: #f9f5f0;
              color: #3d352f;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              padding: 20px;
              box-sizing: border-box;
            }
            .card {
              background: #ffffff;
              border-radius: 24px;
              padding: 40px;
              max-width: 500px;
              width: 100%;
              text-align: center;
              box-shadow: 0 10px 30px rgba(0,0,0,0.06);
              border: 1px solid #e8ded2;
            }
            .icon {
              width: 64px;
              height: 64px;
              background-color: #ffebee;
              color: #c62828;
              border-radius: 50%;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              font-size: 32px;
              margin-bottom: 20px;
            }
            h1 {
              color: #c62828;
              margin: 0 0 10px 0;
              font-size: 24px;
            }
            p {
              color: #6b5e57;
              line-height: 1.6;
              margin: 10px 0 20px 0;
            }
            .badge {
              display: inline-block;
              background: #f4ede4;
              padding: 6px 14px;
              border-radius: 20px;
              font-family: monospace;
              font-size: 14px;
              margin-bottom: 24px;
            }
            .btn {
              display: inline-block;
              background-color: #a66b55;
              color: #ffffff;
              text-decoration: none;
              padding: 12px 28px;
              border-radius: 30px;
              font-weight: 600;
              font-size: 15px;
            }
          </style>
          <script>
            try {
              if (window.top && window.top !== window) {
                window.top.location.href = "${targetUrl}";
              } else {
                window.location.replace("${targetUrl}");
              }
            } catch (e) {
              window.location.replace("${targetUrl}");
            }
          </script>
        </head>
        <body>
          <div class="card">
            <div class="icon">✕</div>
            <h1>Payment Failed or Cancelled</h1>
            <p>Your transaction could not be completed. Redirecting to checkout...</p>
            <div class="badge">Trx ID: ${transactionId}</div>
            <div>
              <a href="${targetUrl}" class="btn">Click here if not redirected automatically</a>
            </div>
          </div>
        </body>
      </html>
    `;
        return {
            isSuccess: false,
            redirectUrl: targetUrl,
            html,
        };
    }
});
exports.PaymentService = {
    confirmationService,
};
