import catchAsync from "../../../shared/catchAsync";
import { PaymentService } from "./payment.services";

const confirmationController = catchAsync(async (req, res) => {
  const transactionId = (req.query.transactionId || req.body.tran_id) as string;
  const status = (req.query.status || req.body.status) as string;
  const valId = (req.body.val_id || req.query.val_id) as string | undefined;

  const result = await PaymentService.confirmationService(
    transactionId,
    status,
    valId
  );

  res.setHeader("Content-Type", "text/html");
  res.status(200).send(result.html);
});

export const PaymentController = {
  confirmationController,
};
