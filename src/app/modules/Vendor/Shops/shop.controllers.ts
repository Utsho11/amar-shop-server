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

export const ShopControllers = {
  createShop,
  getMyShop,
};
