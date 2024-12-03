import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import httpStatus from "http-status";
import { ShopServices } from "./shop.services";

const createShop = catchAsync(async (req, res) => {
  const result = await ShopServices.createShopIntoDB(req);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Shop Registration Completed successfuly!",
    data: result,
  });
});

export const ShopControllers = {
  createShop,
};
