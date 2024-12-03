import { Request } from "express";
import prisma from "../../../shared/prisma";
import { UserStatus } from "@prisma/client";
import AppError from "../../errors/AppError";
import httpStatus from "http-status";

const suspendUserFromDB = async (req: Request) => {
  try {
    const { user_id } = req.params;
    const isExistUser = await prisma.user.findFirstOrThrow({
      where: {
        id: user_id,
        isDeleted: false,
      },
    });
    if (!isExistUser) {
      throw new AppError(httpStatus.NOT_FOUND, "User not found");
    }

    await prisma.user.update({
      where: {
        id: user_id,
      },
      data: {
        status: UserStatus.BLOCKED,
      },
    });
  } catch (error) {
    throw new Error("Failed to suspend user!!!");
  }
};

export const AdminServices = {
  suspendUserFromDB,
};
