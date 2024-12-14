import { OrderStatus, PaymentStatus } from "@prisma/client";
import prisma from "../../../shared/prisma";
import { verifyPayment } from "../../../utils/payment.utils";
import { readFileSync } from "fs"; // Make sure fs is imported
import { join } from "path";

const confirmationService = async (transactionId: string) => {
  const response = await verifyPayment(transactionId);

  if (response && response.pay_status === "Successful") {
    const trnxData = await prisma.transaction.update({
      where: {
        transactionId,
      },
      data: {
        paymentStatus: PaymentStatus.PAID,
      },
    });

    const orderData = await prisma.order.update({
      where: {
        id: trnxData.orderId,
      },
      data: {
        status: OrderStatus.COMPLETED,
        paymentStatus: PaymentStatus.PAID,
      },
    });

    const successfilePath = join(
      __dirname,
      "../../../../public/confirmation.html"
    );
    const template = readFileSync(successfilePath, "utf-8");
    return template;
  } else {
    const failedFilePath = join(__dirname, "../../../../public/failed.html");
    const template = readFileSync(failedFilePath, "utf-8");
    return template;
  }
};

export const PaymentService = {
  confirmationService,
};
