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

const getMyShopFromDB = async (vendorEmail: string) => {
  try {
    console.log("Fetching shop for vendor email:", vendorEmail);

    const shop = await prisma.shop.findMany({
      where: {
        vendorEmail: vendorEmail,
        isDeleted: false,
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
    throw new Error("Failed to fetch shop. Please try again later.");
  }
};

export const ShopServices = {
  createShopIntoDB,
  getMyShopFromDB,
};
