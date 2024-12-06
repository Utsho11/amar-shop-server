import { Request } from "express";
import prisma from "../../../shared/prisma";
import httpStatus from "http-status";
import { IAuthUser } from "../../interfaces/common";
import { UserRole, UserStatus } from "@prisma/client";
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
    if (user?.role === UserRole.ADMIN) {
      const profileInfo = await prisma.admin.update({
        where: { email: userInfo.email },
        data: payload,
      });
      return { ...profileInfo };
    }
    if (user?.role === UserRole.CUSTOMER) {
      const profileInfo = await prisma.customer.update({
        where: { email: userInfo.email },
        data: payload,
      });
      return { ...profileInfo };
    }
    if (user?.role === UserRole.VENDOR) {
      const profileInfo = await prisma.vendor.update({
        where: { email: userInfo.email },
        data: payload,
      });
      return { ...profileInfo };
    }
  } catch (error) {
    throw new Error("Failed to update user!!!");
  }
};

const getMyProfileFromDB = async (user: IAuthUser) => {
  const userInfo = await prisma.user.findUniqueOrThrow({
    where: {
      email: user?.email,
      status: UserStatus.ACTIVE,
    },
    select: {
      id: true,
      email: true,
      needPasswordChange: true,
      role: true,
      status: true,
    },
  });

  let profileInfo;

  if (userInfo.role === UserRole.CUSTOMER) {
    profileInfo = await prisma.customer.findUnique({
      where: {
        email: userInfo.email,
      },
    });
  } else if (userInfo.role === UserRole.ADMIN) {
    profileInfo = await prisma.admin.findUnique({
      where: {
        email: userInfo.email,
      },
    });
  } else if (userInfo.role === UserRole.VENDOR) {
    profileInfo = await prisma.vendor.findUnique({
      where: {
        email: userInfo.email,
      },
    });
  }

  return { ...userInfo, ...profileInfo };
};

export const UserServices = {
  getAllUsersFromDB,
  updateUserIntoDB,
  getMyProfileFromDB,
};
