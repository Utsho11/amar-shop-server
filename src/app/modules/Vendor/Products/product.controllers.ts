import catchAsync from "../../../../shared/catchAsync";
import sendResponse from "../../../../shared/sendResponse";
import httpStatus from "http-status";
import { ProductServices } from "./product.services";
import AppError from "../../../errors/AppError";
import { IImageFiles } from "../../../interfaces/file";

const createProduct = catchAsync(async (req, res) => {
  const result = await ProductServices.createProductIntoDB(req);

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
  const result = await ProductServices.getAllProductsFromDB(req);
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

const updateProduct = catchAsync(async (req, res) => {
  const result = await ProductServices.updateProductIntoDB(req);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Product updated successfuly!",
    data: result,
  });
});

const duplicateProduct = catchAsync(async (req, res) => {
  const result = await ProductServices.duplicateProductFromDB(req.params.p_id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Product duplicated successfuly!",
    data: result,
  });
});

const getFlashSaleProducts = catchAsync(async (req, res) => {
  const result = await ProductServices.getFlashSaleProductsFromDB();

  // console.log(result);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Product fetched successfuly!",
    data: result,
  });
});

const getReviews = catchAsync(async (req, res) => {
  const { p_id } = req.params;

  const result = await ProductServices.getReviewsFromDB(p_id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Product fetched successfuly!",
    data: result,
  });
});
export const ProductControllers = {
  createProduct,
  deleteProduct,
  getAllProducts,
  getSingleProduct,
  updateProduct,
  duplicateProduct,
  getFlashSaleProducts,
  getReviews,
};
