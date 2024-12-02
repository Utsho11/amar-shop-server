import express from "express";
import { UserControllers } from "./user.controllers";
import { fileUploader } from "../../helpers/fileUploader";
import { parseBody } from "../../middlewares/bodyParser";
import { UserValidation } from "./user.validation";
import validateRequest from "../../middlewares/validateRequest";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";

const router = express.Router();

router.get("/", UserControllers.getAllUser);

router.patch(
  "/update-user",
  auth(UserRole.ADMIN, UserRole.CUSTOMER, UserRole.VENDOR),
  fileUploader.single("file"),
  validateRequest(UserValidation.updateUserSchema),
  parseBody,
  UserControllers.updateMyProfie
);

export const UserRoutes = router;
