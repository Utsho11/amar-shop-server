import catchAsync from "../../shared/catchAsync";
import AppError from "../errors/AppError";

export const parseBody = catchAsync(async (req, res, next) => {
  if (!req.body.data && !req.user) {
    throw new AppError(400, "Please provide data in the body under data key");
  }
  console.log(req.body.data);

  if (req.body.data) req.body = JSON.parse(req.body.data);
  next();
});
