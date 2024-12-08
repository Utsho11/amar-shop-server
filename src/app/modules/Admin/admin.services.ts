import { Request } from "express";
import prisma from "../../../shared/prisma";
import { UserStatus } from "@prisma/client";
import AppError from "../../errors/AppError";
import httpStatus from "http-status";

const suspendUserFromDB = async (req: Request) => {
  try {
    const { user_id } = req.params;
    const isExistUser = await prisma.user.findUnique({
      where: {
        id: user_id,
        isDeleted: false,
      },
    });
    if (!isExistUser) {
      throw new AppError(httpStatus.NOT_FOUND, "User not found");
    }

    let status;

    if (isExistUser.status === UserStatus.BLOCKED) {
      status = UserStatus.ACTIVE;
    } else {
      status = UserStatus.BLOCKED;
    }

    await prisma.user.update({
      where: {
        id: user_id,
      },
      data: {
        status: status,
      },
    });
  } catch (error) {
    throw new Error("Failed to suspend user!!!");
  }
};

const deleteUserFromDB = async (id: string) => {
  try {
    const isExistUser = await prisma.user.findUnique({
      where: {
        id: id,
        isDeleted: false,
      },
    });

    if (!isExistUser) {
      throw new AppError(httpStatus.NOT_FOUND, "User not found");
    }

    await prisma.user.update({
      where: {
        id: id,
      },
      data: {
        isDeleted: true,
      },
    });
    if (isExistUser.role === "VENDOR") {
      await prisma.vendor.update({
        where: {
          email: isExistUser.email,
        },
        data: {
          isDeleted: true,
        },
      });
    }
    if (isExistUser.role === "ADMIN") {
      await prisma.admin.update({
        where: {
          email: isExistUser.email,
        },
        data: {
          isDeleted: true,
        },
      });
    }
    if (isExistUser.role === "CUSTOMER") {
      await prisma.customer.update({
        where: {
          email: isExistUser.email,
        },
        data: {
          isDeleted: true,
        },
      });
    }
  } catch (error) {
    throw new Error("Failed to delete user!!!");
  }
};

export const AdminServices = {
  suspendUserFromDB,
  deleteUserFromDB,
};
