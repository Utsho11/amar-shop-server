import { Request } from "express";
import { IFile } from "../../interfaces/file";
import prisma from "../../../shared/prisma";

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
    const user = await prisma.shop.create({
      data: shopPayload,
    });
  } catch (error) {
    console.error("Error creating Shop:", error);
    throw new Error("Shop creation failed. Please try again.");
  }
};

export const ShopServices = {
  createShopIntoDB,
};
