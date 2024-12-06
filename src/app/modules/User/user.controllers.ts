import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { UserServices } from "./user.services";
import { IAuthUser } from "../../interfaces/common";

const getAllUser = catchAsync(async (req, res) => {
  const result = await UserServices.getAllUsersFromDB();
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Users retrieved successfully",
    data: result,
  });
});

const updateMyProfie = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;

  const result = await UserServices.updateUserIntoDB(user as IAuthUser, req);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "My profile updated!",
    data: result,
  });
});

const getMyProfile = catchAsync(async (req, res) => {
  const user = req.user;

  const result = await UserServices.getMyProfileFromDB(user as IAuthUser);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "My profile data fetched!",
    data: result,
  });
});

export const UserControllers = {
  getAllUser,
  updateMyProfie,
  getMyProfile,
};
