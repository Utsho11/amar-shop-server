import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { CustomerServices } from "./customer.services";

const createOrder = catchAsync(async (req, res) => {
  const result = await CustomerServices.createOrderIntoDB(req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Order created successfully",
    data: result,
  });
});

export const CustomerControllers = { createOrder };
