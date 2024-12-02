import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { AuthServices } from "./auth.services";

import httpStatus from "http-status";

const registerUser = catchAsync(async (req, res) => {
  const result = await AuthServices.createUser(req);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User Registration Completed successfuly!",
    data: result,
  });
});

export const AuthControllers = { registerUser };
