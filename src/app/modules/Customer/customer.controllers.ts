import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { CustomerServices } from "./customer.services";
import httpStatus from "http-status";

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
    message: "Order items fetched successfully",
    data: result,
  });
});

const toggleWishlist = catchAsync(async (req, res) => {
  const result = await CustomerServices.toggleWishlistIntoDB(req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: result.message,
    data: result,
  });
});

const getMyWishlist = catchAsync(async (req, res) => {
  const result = await CustomerServices.getMyWishlistFromDB(req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Wishlist fetched successfully",
    data: result,
  });
});

const getDashboardStats = catchAsync(async (req, res) => {
  const result = await CustomerServices.getCustomerDashboardStatsFromDB(req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Customer dashboard stats fetched successfully",
    data: result,
  });
});


const confirmCodOrder = catchAsync(async (req, res) => {
  const { orderId } = req.params;
  const result = await CustomerServices.confirmCodOrderIntoDB(orderId, req.user);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: result,
  });
});

export const CustomerControllers = {
  confirmCodOrder,
  createOrder,
  getItemForReview,
  addReview,
  getMyOrderHistory,
  toggleWishlist,
  getMyWishlist,
  getDashboardStats,
};
