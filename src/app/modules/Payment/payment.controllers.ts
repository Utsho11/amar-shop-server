import catchAsync from "../../../shared/catchAsync";
import { PaymentService } from "./payment.services";

const confirmationController = catchAsync(async (req, res) => {
  const { transactionId, status } = req.query;
  const response = await PaymentService.confirmationService(
    transactionId as string,
    status as string
  );
  res.send(response);
});

export const PaymentController = {
  confirmationController,
};
