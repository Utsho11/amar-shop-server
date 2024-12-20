import catchAsync from "../../../../shared/catchAsync";
import sendResponse from "../../../../shared/sendResponse";
import httpStatus from "http-status";
import { CategoryServices } from "./category.services";
import { IAuthUser } from "../../../interfaces/common";
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

const updateCategory = catchAsync(async (req, res) => {
  const result = await CategoryServices.updateCategoryIntoDB(req);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Category edited successfully.",
    data: result,
  });
});

const getAllCategories = catchAsync(async (req, res) => {
  const result = await CategoryServices.getAllCategoriesFromDB();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Category retrieved successfully.",
    data: result,
  });
});

const deleteCategory = catchAsync(async (req, res) => {
  const { category_id } = req.params;

  const result = await CategoryServices.deleteCategoryFromDB(
    category_id as string
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Category deleted successfully.",
    data: result,
  });
});

export const CategoryControllers = {
  createCategory,
  updateCategory,
  deleteCategory,
  getAllCategories,
};
