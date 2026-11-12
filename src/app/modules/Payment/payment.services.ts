import { OrderStatus, PaymentStatus } from "@prisma/client";
import prisma from "../../../shared/prisma";
import {
  verifyPayment,
  verifyPaymentByTransactionId,
} from "../../../utils/payment.utils";
import config from "../../../config";

const confirmationService = async (
  transactionId: string,
  status: string,
  valId?: string
) => {
  const clientUrl = config.client_base_url || "https://amar-shop-client.vercel.app";
  const normalizedStatus = (status || "").toLowerCase();
  const targetSuccessUrl = `${clientUrl}/customerDashboard/myOrder?payment=success&tran_id=${transactionId || ""}`;
  const targetFailedUrl = `${clientUrl}/checkout?payment=failed&tran_id=${transactionId || ""}`;

  if (!transactionId) {
    return {
      isSuccess: false,
      redirectUrl: targetFailedUrl,
      html: generateRedirectHtml(
        "Payment Failed",
        "Transaction ID is missing. Redirecting to checkout...",
        targetFailedUrl,
        "N/A",
        false
      ),
    };
  }

  // 1. Fetch existing transaction record with its parent order
  const existingTrnx = await prisma.transaction.findUnique({
    where: { transactionId },
    include: { order: true },
  });

  if (!existingTrnx) {
    return {
      isSuccess: false,
      redirectUrl: targetFailedUrl,
      html: generateRedirectHtml(
        "Payment Failed",
        "Transaction record not found in system. Redirecting to checkout...",
        targetFailedUrl,
        transactionId,
        false
      ),
    };
  }

  // 2. Idempotency Guard: If transaction is already marked PAID, return success without re-processing inventory
  if (existingTrnx.paymentStatus === PaymentStatus.PAID) {
    return {
      isSuccess: true,
      redirectUrl: targetSuccessUrl,
      html: generateRedirectHtml(
        "Payment Already Verified",
        "Your payment has already been verified. Redirecting you to your orders...",
        targetSuccessUrl,
        transactionId,
        true
      ),
    };
  }

  let isPaymentSuccessful = false;

  // 3. Cryptographic/Server-to-Server Gateway Verification
  if (
    normalizedStatus === "success" ||
    normalizedStatus === "valid" ||
    normalizedStatus === "validated"
  ) {
    try {
      let verificationResponse: any = null;

      if (valId) {
        verificationResponse = await verifyPayment(valId);
      } else {
        verificationResponse = await verifyPaymentByTransactionId(transactionId);
      }

      const isValidStatus =
        verificationResponse?.status === "VALID" ||
        verificationResponse?.status === "VALIDATED" ||
        verificationResponse?.element?.[0]?.status === "VALID" ||
        verificationResponse?.element?.[0]?.status === "VALIDATED";

      if (isValidStatus) {
        // Enforce transaction ID match
        const returnedTranId =
          verificationResponse?.tran_id ||
          verificationResponse?.element?.[0]?.tran_id;

        if (returnedTranId && returnedTranId !== transactionId) {
          console.error(
            `[Security Violation] Transaction ID mismatch! Expected: ${transactionId}, Got: ${returnedTranId}`
          );
          isPaymentSuccessful = false;
        } else {
          // Enforce amount match (prevent parameter tampering on payment gateway)
          const returnedAmount = parseFloat(
            verificationResponse?.amount ||
              verificationResponse?.currency_amount ||
              verificationResponse?.element?.[0]?.amount ||
              "0"
          );
          const expectedAmount = Number(existingTrnx.amount);

          if (returnedAmount > 0 && Math.abs(returnedAmount - expectedAmount) > 1.0) {
            console.error(
              `[Security Violation] Payment amount mismatch! Expected: ${expectedAmount}, Got: ${returnedAmount}`
            );
            isPaymentSuccessful = false;
          } else {
            isPaymentSuccessful = true;
          }
        }
      } else {
        console.warn(
          "[Payment Failed] Gateway returned unverified status:",
          verificationResponse
        );
        isPaymentSuccessful = false;
      }
    } catch (err) {
      console.error("[Payment Error] Gateway verification request failed:", err);
      isPaymentSuccessful = false;
    }
  }

  try {
    if (isPaymentSuccessful) {
      await prisma.$transaction(async (tx) => {
        await tx.transaction.update({
          where: { transactionId },
          data: { paymentStatus: PaymentStatus.PAID },
        });

        await tx.order.update({
          where: { id: existingTrnx.orderId },
          data: {
            status: OrderStatus.COMPLETED,
            paymentStatus: PaymentStatus.PAID,
          },
        });

        const orderItems = await tx.orderItem.findMany({
          where: { orderId: existingTrnx.orderId },
        });

        for (const item of orderItems) {
          const updateResult = await tx.product.updateMany({
            where: {
              id: item.productId,
              inventoryCount: { gte: item.quantity },
            },
            data: {
              inventoryCount: {
                decrement: item.quantity,
              },
            },
          });

          if (updateResult.count === 0) {
            console.warn(
              `[Inventory Depletion] Product ID ${item.productId} had insufficient stock during fulfillment for Order ${existingTrnx.orderId}.`
            );
          }
        }
      });

      return {
        isSuccess: true,
        redirectUrl: targetSuccessUrl,
        html: generateRedirectHtml(
          "Payment Successful!",
          "Your payment has been verified. Redirecting you to your orders...",
          targetSuccessUrl,
          transactionId,
          true
        ),
      };
    } else {
      await prisma.$transaction(async (tx) => {
        await tx.transaction.update({
          where: { transactionId },
          data: { paymentStatus: PaymentStatus.FAILED },
        });

        await tx.order.update({
          where: { id: existingTrnx.orderId },
          data: {
            status: OrderStatus.CANCELLED,
            paymentStatus: PaymentStatus.FAILED,
          },
        });
      });

      return {
        isSuccess: false,
        redirectUrl: targetFailedUrl,
        html: generateRedirectHtml(
          "Payment Failed or Cancelled",
          "Your transaction could not be verified or completed. Redirecting to checkout...",
          targetFailedUrl,
          transactionId,
          false
        ),
      };
    }
  } catch (error) {
    console.error("Error in confirmationService:", error);
    return {
      isSuccess: isPaymentSuccessful,
      redirectUrl: isPaymentSuccessful ? targetSuccessUrl : targetFailedUrl,
      html: generateRedirectHtml(
        isPaymentSuccessful ? "Payment Completed" : "Payment Incomplete",
        "Redirecting to Amar Shop...",
        isPaymentSuccessful ? targetSuccessUrl : targetFailedUrl,
        transactionId,
        isPaymentSuccessful
      ),
    };
  }
};

function generateRedirectHtml(
  title: string,
  message: string,
  targetUrl: string,
  transactionId: string,
  isSuccess: boolean
): string {
  const icon = isSuccess ? "✓" : "✕";
  const iconColor = isSuccess ? "#2e7d32" : "#c62828";
  const iconBg = isSuccess ? "#e8f5e9" : "#ffebee";

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="refresh" content="1;url=${targetUrl}" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title} - Amar Shop</title>
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
        background-color: ${iconBg};
        color: ${iconColor};
        border-radius: 50%;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 32px;
        margin-bottom: 20px;
      }
      h1 {
        color: ${iconColor};
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
      <div class="icon">${icon}</div>
      <h1>${title}</h1>
      <p>${message}</p>
      <div class="badge">Trx ID: ${transactionId}</div>
      <div>
        <a href="${targetUrl}" class="btn">Click here if not redirected automatically</a>
      </div>
    </div>
  </body>
</html>`;
}

export const PaymentService = {
  confirmationService,
};

