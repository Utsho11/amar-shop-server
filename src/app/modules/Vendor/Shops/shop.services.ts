import { Request } from "express";
import { IFile } from "../../../interfaces/file";
import prisma from "../../../../shared/prisma";
import AppError from "../../../errors/AppError";
import httpStatus from "http-status";
import { UserRole } from "@prisma/client";

interface IShopPayload {
  name: string;
  vendorEmail: string;
  description: string;
  logoUrl?: string;
}

const createShopIntoDB = async (req: Request) => {
  try {
    const file = req.file as IFile | undefined;
    const { name, description } = req.body;

    // Validate required fields
    if (!name || !description) {
      throw new AppError(httpStatus.BAD_REQUEST, "Missing required fields.");
    }

    const u_email = req.user.email;

    const existingShop = await prisma.shop.findFirst({
      where: {
        vendorEmail: u_email,
        isDeleted: false,
      },
    });

    if (existingShop) {
      throw new AppError(httpStatus.CONFLICT, "You already have an active registered shop!");
    }

    // Prepare user payload
    const shopPayload: IShopPayload = {
      name,
      vendorEmail: u_email,
      description,
      logoUrl: file?.path,
    };

    const result = await prisma.shop.create({
      data: shopPayload,
    });

    return result;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error("Error creating Shop:", error);
    throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, "Shop creation failed. Please try again.");
  }
};

const getMyShopFromDB = async (vendorEmail: string) => {
  try {
    console.log("Fetching shop for vendor email:", vendorEmail);

    const shop = await prisma.shop.findMany({
      where: {
        vendorEmail: vendorEmail,
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

    if (!shop) {
      console.warn(`No shop found for vendor email: ${vendorEmail}`);
    }

    return shop;
  } catch (error) {
    console.error(
      `Error fetching shop for vendor email: ${vendorEmail}`,
      error
    );
    throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, "Failed to fetch shop. Please try again later.");
  }
};

const updateShopIntoDB = async (req: Request) => {
  try {
    const payload = req.body;
    const file = req.file as IFile | undefined;
    const user = req.user;

    if (!payload.id) {
      throw new AppError(httpStatus.BAD_REQUEST, "Shop ID is required for update.");
    }

    if (file) {
      payload.logoUrl = file?.path;
    }

    const isShopExist = await prisma.shop.findFirst({
      where: {
        id: payload.id,
        isDeleted: false,
      },
    });

    if (!isShopExist) {
      throw new AppError(httpStatus.NOT_FOUND, "Shop not found");
    }

    // Enforce tenant ownership: only the shop vendor or an admin can update
    if (user.role !== UserRole.ADMIN && isShopExist.vendorEmail !== user.email) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "You do not have permission to update this shop!"
      );
    }

    // Build sanitized update data to prevent schema injection or unknown fields
    const validUpdateData: { name?: string; description?: string; logoUrl?: string } = {};
    if (typeof payload.name === "string" && payload.name.trim()) {
      validUpdateData.name = payload.name.trim();
    }
    if (typeof payload.description === "string") {
      validUpdateData.description = payload.description.trim();
    }
    if (file?.path) {
      validUpdateData.logoUrl = file.path;
    } else if (typeof payload.logoUrl === "string" && payload.logoUrl.trim()) {
      validUpdateData.logoUrl = payload.logoUrl.trim();
    } else if (typeof payload.imageUrl === "string" && payload.imageUrl.trim()) {
      validUpdateData.logoUrl = payload.imageUrl.trim();
    }

    const result = await prisma.shop.update({
      where: {
        id: payload.id,
      },
      data: validUpdateData,
    });

    return result;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    console.error("Failed to update shop:", error);
    throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, "Failed to update shop. Please try again later.");
  }
};
const getSingleShopFromDB = async (shopId: string) => {
  const result = await prisma.shop.findFirst({
    where: {
      id: shopId,
      isDeleted: false, // Additional filter
    },
    select: {
      id: true,
      vendorEmail: true,
      name: true,
      logoUrl: true,
      description: true,
    },
  });

  if (!result) {
    throw new Error("Shop not found or it has been deleted.");
  }

  return result;
};

const getProductsByShopFromDB = async (shopId: string) => {
  const products = await prisma.product.findMany({
    where: {
      shopId: shopId,
      isDeleted: false,
    },
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
      discount: true,
      inventoryCount: true,
      imageUrl: true,
    },
  });

  return products;
};

const followShop = async (req: Request) => {
  const u_email = req.user.email;
  const { s_id } = req.params;

  const result = await prisma.follow.create({
    data: {
      customerEmail: u_email,
      shopId: s_id,
    },
  });
};

const unfollowShop = async (req: Request) => {
  const u_email = req.user.email;
  const { s_id } = req.params;

  console.log("deleted", s_id);

  const review = await prisma.follow.findFirst({
    where: {
      customerEmail: u_email,
      shopId: s_id,
    },
  });

  const result = await prisma.follow.delete({
    where: {
      id: review?.id,
    },
  });
};

const getFollowers = async (shopId: string) => {
  const result = await prisma.follow.findMany({
    where: {
      shopId: shopId,
    },
  });

  return result;
};

export const ShopServices = {
  createShopIntoDB,
  getMyShopFromDB,
  updateShopIntoDB,
  getSingleShopFromDB,
  getProductsByShopFromDB,
  followShop,
  unfollowShop,
  getFollowers,
};
