/* eslint-disable no-console */

import { UserRole } from "@prisma/client";
import prisma from "../shared/prisma";
import config from "../config";
import bcrypt from "bcrypt";

interface IUserPayload {
  name: string;
  email: string;
  phone: string;
}

export const seed = async () => {
  try {
    // Check if the admin exists
    const admin = await prisma.user.findUnique({
      where: {
        email: config.admin_email!,
      },
    });

    if (!admin) {
      const plainPass = config.admin_pass!;
      const hashedPassword = await bcrypt.hash(plainPass, 12);

      console.log("Seeding started...");

      // Perform transaction
      await prisma.$transaction(async (transactionClient) => {
        // Create the User record
        const createdUser = await transactionClient.user.create({
          data: {
            email: config.admin_email!,
            password: hashedPassword,
            role: UserRole.ADMIN,
          },
        });

        // Create the Admin record and link it to the User
        await transactionClient.admin.create({
          data: {
            name: "Utsho",
            email: createdUser.email, // Linking Admin to User via email
            phone: "01727362718",
          },
        });
      });

      console.log("Admin created successfully...");
      console.log("Seeding completed...");
    } else {
      console.log("Admin already exists. Seeding skipped.");
    }
  } catch (error) {
    console.error("Error in seeding", error);
  }
};
