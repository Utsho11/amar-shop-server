import { Request } from "express";
import { IFile } from "../../interfaces/file";
import bcrypt from "bcrypt";
import prisma from "../../../shared/prisma";
import { jwtHelpers } from "../../helpers/jwtHelpers";
import config from "../../../config";
import { Secret } from "jsonwebtoken";
import { UserStatus } from "@prisma/client";

interface IUserPayload {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: "ADMIN" | "VENDOR" | "CUSTOMER";
  image?: string;
}

const createUser = async (req: Request) => {
  try {
    const file = req.file as IFile | undefined;
    const { name, email, password, phone, role } = req.body;

    // Validate required fields
    if (!name || !email || !password || !role) {
      throw new Error("Missing required fields.");
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Prepare user payload
    const userPayload: IUserPayload = {
      name,
      email,
      password: hashedPassword,
      phone,
      role,
      image: file?.path, // Include image if uploaded
    };

    // Create user in the database
    const user = await prisma.user.create({
      data: userPayload,
    });

    // Generate tokens
    const accessToken = jwtHelpers.generateToken(
      { id: user.id, email: user.email, role: user.role }, // Secure token payload
      config.access_secret as Secret,
      config.jwt_access_expires_in as string
    );

    const refreshToken = jwtHelpers.generateToken(
      { id: user.id, email: user.email, role: user.role },
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
