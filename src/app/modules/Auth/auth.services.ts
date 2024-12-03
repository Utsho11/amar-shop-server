import { Request } from "express";
import { IFile } from "../../interfaces/file";
import bcrypt from "bcrypt";
import prisma from "../../../shared/prisma";
import { jwtHelpers } from "../../helpers/jwtHelpers";
import config from "../../../config";
import { Secret } from "jsonwebtoken";
import { UserRole, UserStatus } from "@prisma/client";

interface IUserPayload {
  name: string;
  email: string;
  phone?: string;
  image?: string;
}

const createUser = async (req: Request) => {
  try {
    const file = req.file as IFile | undefined;
    const { password, role } = req.body;
    const { name, email, phone } = req.body.user;

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Prepare user payload

    const userData = {
      email: email,
      password: hashedPassword,
      role: role,
    };

    const userPayload: IUserPayload = {
      name,
      email,
      phone,
      image: file?.path, // Include image if uploaded
    };

    // Create user in the database
    // const user = await prisma.user.create({
    //   data: userPayload,
    // });

    const user = await prisma.$transaction(async (transactionClient) => {
      await transactionClient.user.create({
        data: userData,
      });

      if (userData.role === UserRole.ADMIN) {
        const createdAdminData = await transactionClient.admin.create({
          data: userPayload,
        });
        return createdAdminData;
      }
      if (userData.role === UserRole.CUSTOMER) {
        const createdCustomerData = await transactionClient.customer.create({
          data: userPayload,
        });
        return createdCustomerData;
      }
      if (userData.role === UserRole.VENDOR) {
        const createdCustomerData = await transactionClient.vendor.create({
          data: userPayload,
        });
        return createdCustomerData;
      }
    });

    if (!user) {
      throw new Error("User creation failed. Please try again.");
    }

    console.log(user);

    // Generate tokens
    const accessToken = jwtHelpers.generateToken(
      { id: user.id, email: user.email, role: userData.role }, // Secure token payload
      config.access_secret as Secret,
      config.jwt_access_expires_in as string
    );

    const refreshToken = jwtHelpers.generateToken(
      { id: user.id, email: user.email, role: userData.role },
      config.refresh_secret as Secret,
      config.jwt_refresh_expires_in as string
    );

    return {
      accessToken,
      refreshToken,
    };
  } catch (error) {
    console.error("Error creating user:", error);
    throw new Error("User creation failed. Please try again.");
  }
};

const loginUser = async (payload: { email: string; password: string }) => {
  const userData = await prisma.user.findUniqueOrThrow({
    where: {
      email: payload.email,
      status: UserStatus.ACTIVE,
    },
  });

  const isCorrectPassword: boolean = await bcrypt.compare(
    payload.password,
    userData.password
  );

  if (!isCorrectPassword) {
    throw new Error("Password incorrect!");
  }
  const accessToken = jwtHelpers.generateToken(
    {
      email: userData.email,
      role: userData.role,
    },
    config.access_secret as Secret,
    config.jwt_access_expires_in as string
  );

  const refreshToken = jwtHelpers.generateToken(
    {
      email: userData.email,
      role: userData.role,
    },
    config.refresh_secret as Secret,
    config.jwt_refresh_expires_in as string
  );

  return {
    accessToken,
    refreshToken,
  };
};

export const AuthServices = {
  createUser,
  loginUser,
};
