import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import httpStatus from "http-status";
import { VendorServices } from "./vendor.sevices";

const getProducts = catchAsync(async (req, res) => {
  const result = await VendorServices.getProductsFromDB(req);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Product retrieved successfuly!",
    data: result,
  });
});
const getOrderHistory = catchAsync(async (req, res) => {
  const result = await VendorServices.getOrderHistoryFromDB(req);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Product retrieved successfuly!",
    data: result,
  });
});

const updateOrderStatus = catchAsync(async (req, res) => {
  const result = await VendorServices.updateOrderStatusIntoDB(req);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Order status updated successfully!",
    data: result,
  });
});

export const VendorControllers = {
  getProducts,
  getOrderHistory,
  updateOrderStatus,
};
