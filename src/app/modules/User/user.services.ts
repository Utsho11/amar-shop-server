import { Request } from "express";
import prisma from "../../../shared/prisma";
import httpStatus from "http-status";
import { IAuthUser } from "../../interfaces/common";
import { UserStatus } from "@prisma/client";
import { IFile } from "../../interfaces/file";

const getAllUsersFromDB = async () => {
  try {
    const result = await prisma.user.findMany();
    return result;
  } catch (error) {
    throw new Error("Failed to fetch users!!!");
  }
};

const updateUserIntoDB = async (user: IAuthUser, req: Request) => {
  const userInfo = await prisma.user.findUniqueOrThrow({
    where: {
      email: user?.email,
      status: UserStatus.ACTIVE,
    },
  });

  const file = req.file as IFile | undefined;

  const payload = req.body;
  payload.image = file?.path;

  try {
    const profileInfo = await prisma.user.update({
      where: { email: userInfo.email, status: UserStatus.ACTIVE },
      data: payload,
    });
    return { ...profileInfo };
  } catch (error) {
    throw new Error("Failed to update user!!!");
  }
};

export const UserServices = {
  getAllUsersFromDB,
  updateUserIntoDB,
};
