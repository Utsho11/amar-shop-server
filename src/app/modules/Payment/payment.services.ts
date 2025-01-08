import { OrderStatus, PaymentStatus } from "@prisma/client";
import prisma from "../../../shared/prisma";
import { verifyPayment } from "../../../utils/payment.utils";
import { readFileSync } from "fs";
import { join, resolve } from "path";

const confirmationService = async (transactionId: string, status: string) => {
  if (!transactionId) {
    console.error("Transaction ID is undefined");
    throw new Error("Transaction ID is required.");
  }

  // console.log("Processing Transaction ID:", transactionId);

  const response = await verifyPayment(transactionId);
  // console.log("Payment Verification Response:", response);

  const successFilePath = resolve(
    __dirname,
    "../../../../public/confirmation.html"
  );
  const failedFilePath = resolve(__dirname, "../../../../public/failed.html");

  const updateTransactionAndOrder = async (
    paymentStatus: PaymentStatus,
    orderStatus: OrderStatus
  ) => {
    const trnxData = await prisma.transaction.update({
      where: { transactionId },
      data: { paymentStatus },
    });

    await prisma.order.update({
      where: { id: trnxData.orderId },
      data: {
        status: orderStatus,
        paymentStatus,
      },
    });

    return trnxData;
  };

  if (
    status === "success" &&
    response &&
    response.pay_status === "Successful"
  ) {
    console.log("Payment Successful");
    await updateTransactionAndOrder(PaymentStatus.PAID, OrderStatus.COMPLETED);
    return readFileSync(successFilePath, "utf-8");
  }
  if (status === "failed") {
    console.log("Payment Failed");
    await updateTransactionAndOrder(
      PaymentStatus.FAILED,
      OrderStatus.CANCELLED
    );
    return readFileSync(failedFilePath, "utf-8");
  }
};

export const PaymentService = {
  confirmationService,
};
