import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import httpStatus from "http-status";
import { CategoryServices } from "./category.services";
import { IAuthUser } from "../../interfaces/common";
import { Request, Response } from "express";

const createCategory = catchAsync(async (req, res) => {
  const result = await CategoryServices.createCategoryIntoDB(req);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Category added successfuly!",
    data: result,
  });
});

const updateCategory = catchAsync(async (req: Request, res: Response) => {
  const { category_id } = req.params;

  const result = await CategoryServices.updateCategoryIntoDB(
    category_id as string,
    req
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Category edited successfully.",
    data: result,
  });
});

const deleteCategory = catchAsync(async (req, res) => {
  const { category_id } = req.params;

  await CategoryServices.deleteCategoryFromDB(category_id as string);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Category deleted successfully.",
  });
});
export const CategoryControllers = {
  createCategory,
  updateCategory,
  deleteCategory,
};
