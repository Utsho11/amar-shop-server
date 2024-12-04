import catchAsync from "../../../../shared/catchAsync";
import sendResponse from "../../../../shared/sendResponse";
import httpStatus from "http-status";
import { ProductServices } from "./product.services";
import AppError from "../../../errors/AppError";
import { IImageFiles } from "../../../interfaces/file";

const createProduct = catchAsync(async (req, res) => {
  if (!req.files) {
    throw new AppError(400, "Please upload an image");
  }

  const result = await ProductServices.createProductIntoDB(
    req.body,
    req.files as IImageFiles
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "New Product added successfuly!",
    data: result,
  });
});

const deleteProduct = catchAsync(async (req, res) => {
  const { p_id } = req.params;

  const result = await ProductServices.deleteProductFromDB(p_id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Product deleted successfuly!",
    data: result,
  });
});

const getAllProducts = catchAsync(async (req, res) => {
  const result = await ProductServices.getAllProductsFromDB();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Product retrieved successfuly!",
    data: result,
  });
});

const getSingleProduct = catchAsync(async (req, res) => {
  const result = await ProductServices.getSingleProductFromDB(req.params.p_id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Product retrieved successfuly!",
    data: result,
  });
});

export const ProductControllers = {
  createProduct,
  deleteProduct,
  getAllProducts,
  getSingleProduct,
};
