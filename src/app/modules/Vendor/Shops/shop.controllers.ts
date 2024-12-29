import httpStatus from "http-status";
import { ShopServices } from "./shop.services";
import catchAsync from "../../../../shared/catchAsync";
import sendResponse from "../../../../shared/sendResponse";

const createShop = catchAsync(async (req, res) => {
  const result = await ShopServices.createShopIntoDB(req);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Shop Registration Completed successfuly!",
    data: result,
  });
});

const getMyShop = catchAsync(async (req, res) => {
  const u_email = req.user.email;

  const result = await ShopServices.getMyShopFromDB(u_email);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Shop Fetched Completed successfuly!",
    data: result,
  });
});

const updateShop = catchAsync(async (req, res) => {
  const result = await ShopServices.updateShopIntoDB(req);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Shop Updated Completed successfuly!",
    data: result,
  });
});

const getSingleShop = catchAsync(async (req, res) => {
  const id = req.params.s_id;

  const result = await ShopServices.getSingleShopFromDB(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Shop Fetched Completed successfuly!",
    data: result,
  });
});

const getProductsByShop = catchAsync(async (req, res) => {
  const { s_id } = req.params;

  const result = await ShopServices.getProductsByShopFromDB(s_id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Products fetched Completed successfuly!",
    data: result,
  });
});

const followShop = catchAsync(async (req, res) => {
  const result = await ShopServices.followShop(req);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Followed Successfully!",
  });
});

const unfollowShop = catchAsync(async (req, res) => {
  const result = await ShopServices.unfollowShop(req);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "UnFollowed Successfully!",
  });
});

const getFollowers = catchAsync(async (req, res) => {
  const { s_id } = req.params;
  const result = await ShopServices.getFollowers(s_id as string);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Follower retrieved Successfully!",
    data: result,
  });
});
export const ShopControllers = {
  createShop,
  getMyShop,
  updateShop,
  getSingleShop,
  getProductsByShop,
  followShop,
  unfollowShop,
  getFollowers,
};
