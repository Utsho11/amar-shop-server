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

const getAllShopsFromDB = async () => {
  try {
    const shops = await prisma.shop.findMany({
      where: {
        isDeleted: false,
      },
      select: {
        id: true,
        vendorEmail: true,
        name: true,
        logoUrl: true,
        description: true,
        isBlacklisted: true,
      },
    });
    return shops;
  } catch (error) {
    throw new Error("Failed to fetch shops!!!");
  }
};

const blockShopIntoDB = async (shop_id: string) => {
  try {
    const isShopExists = await prisma.shop.findUnique({
      where: {
        id: shop_id,
        isDeleted: false,
      },
    });
    if (!isShopExists) {
      throw new AppError(httpStatus.NOT_FOUND, "Shop not found");
    }

    let status;

    if (isShopExists.isBlacklisted === false) {
      status = true;
    } else {
      status = false;
    }

    await prisma.shop.update({
      where: {
        id: shop_id,
      },
      data: {
        isBlacklisted: status,
      },
    });
  } catch (error) {
    throw new Error("Failed to block shop!!!");
  }
};

const getAllTransactionsFromDB = async () => {
  const result = await prisma.transaction.findMany({
    select: {
      orderId: true,
      transactionId: true,
      amount: true,
      paymentStatus: true,
    },
  });

  return result;
};

const createCouponFromDB = async (req: Request) => {
  const payload = req.body;
  payload.discount = Number(payload.discount);

  const data = {
    code: payload.code,
    discountPercent: payload.discount,
  };

  const result = await prisma.coupon.create({
    data: data,
  });

  return result;
};

const checkCouponFromDB = async (code: string) => {
  console.log(code);

  const result = await prisma.coupon.findUniqueOrThrow({
    where: { code },
    select: {
      discountPercent: true,
    },
  });

  // Check if a coupon was found
  if (result) {
    console.log(result);
    return result.discountPercent;
  } else {
    console.log("Coupon not found.");
    return null; // Return null if no coupon is found
  }
};

export const AdminServices = {
  suspendUserFromDB,
  deleteUserFromDB,
  getAllShopsFromDB,
  blockShopIntoDB,
  getAllTransactionsFromDB,
  createCouponFromDB,
  checkCouponFromDB,
};
