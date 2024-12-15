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

const addReview = catchAsync(async (req, res) => {
  const result = await CustomerServices.addReviewIntoDB(req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Review posted successfully",
    data: result,
  });
});

const getItemForReview = catchAsync(async (req, res) => {
  const result = await CustomerServices.getItemForReviewFromDB(req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "OrderItems fetched successfully",
    data: result,
  });
});

const getMyOrderHistory = catchAsync(async (req, res) => {
  const result = await CustomerServices.getMyOrderHistoryFromDB(req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "OrderItems fetched successfully",
    data: result,
  });
});
export const CustomerControllers = {
  createOrder,
  getItemForReview,
  addReview,
  getMyOrderHistory,
};
