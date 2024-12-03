import { Request } from "express";
import { IFile } from "../../interfaces/file";
import prisma from "../../../shared/prisma";
import AppError from "../../errors/AppError";
import httpStatus from "http-status";

interface ICategoryPayload {
  name: string;
  description?: string;
  logoUrl?: string;
}

const createCategoryIntoDB = async (req: Request) => {
  try {
    const file = req.file as IFile | undefined;
    const { name, description } = req.body;

    // Validate required fields
    if (!name) {
      throw new Error("Missing required fields.");
    }

    const u_email = req.user.email;

    // Prepare user payload
    const categoryPayload: ICategoryPayload = {
      name,
      description,
      logoUrl: file?.path,
    };

    // Create user in the database
    const user = await prisma.category.create({
      data: categoryPayload,
    });
  } catch (error) {
    console.error("Error creating Category:", error);
    throw new Error("Category creation failed. Please try again.");
  }
};

const updateCategoryIntoDB = async (category_id: string, req: Request) => {
  try {
    const isExistCategory = await prisma.category.findFirstOrThrow({
      where: {
        id: category_id,
        isDeleted: false,
      },
    });

    if (!isExistCategory) {
      throw new AppError(httpStatus.NOT_FOUND, "Category not found");
    }
    let updatedCategory = req.body;
    const file = req.file as IFile | undefined;
    if (file) {
      updatedCategory.logoUrl = file.path;
    }
    const result = await prisma.category.update({
      where: {
        id: category_id,
      },
      data: updatedCategory,
    });

    return result;
  } catch (error) {
    console.error("Error editing Category:", error);
    throw new Error("Category updation failed. Please try again.");
  }
};

const deleteCategoryFromDB = async (category_id: string) => {
  try {
    const isExistCategory = await prisma.category.findFirstOrThrow({
      where: {
        id: category_id,
        isDeleted: false,
      },
    });

    if (!isExistCategory) {
      throw new AppError(httpStatus.NOT_FOUND, "Category not found");
    }

    await prisma.category.update({
      where: {
        id: category_id,
      },
      data: {
        isDeleted: true,
      },
    });
  } catch (error) {
    console.error("Error deleting Category:", error);
    throw new Error("Category deletion failed. Please try again.");
  }
};

export const CategoryServices = {
  createCategoryIntoDB,
  updateCategoryIntoDB,
  deleteCategoryFromDB,
};
