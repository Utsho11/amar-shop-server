import { Request } from "express";
import { IFile } from "../../../interfaces/file";
import prisma from "../../../../shared/prisma";

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
      throw new Error("Missing required fields.");
    }

    const u_email = req.user.email;

    // Prepare user payload
    const shopPayload: IShopPayload = {
      name,
      vendorEmail: u_email,
      description,
      logoUrl: file?.path,
    };

    // Create user in the database
    const result = await prisma.shop.create({
      data: shopPayload,
    });

    return result;
  } catch (error) {
    console.error("Error creating Shop:", error);
    throw new Error("Shop creation failed. Please try again.");
  }
};

const getMyShopFromDB = async (u_id: string) => {
  try {
    const result = await prisma.shop.findFirstOrThrow({
      where: {
        vendorEmail: u_id,
        isDeleted: false,
      },
    });

    return result;
  } catch (error) {
    console.error("Error fetching Shop:", error);
    throw new Error("Shop fetched failed. Please try again.");
  }
};

export const ShopServices = {
  createShopIntoDB,
  getMyShopFromDB,
};
