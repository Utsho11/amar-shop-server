import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { AdminServices } from "./admin.services";

const suspendUser = catchAsync(async (req, res) => {
  const result = await AdminServices.suspendUserFromDB(req);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User suspended successfully",
  });
});

const deleteUser = catchAsync(async (req, res) => {
  const result = await AdminServices.deleteUserFromDB(req.params.u_id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User deleted successfully",
  });
});

export const AdminControllers = {
  suspendUser,
  deleteUser,
};
