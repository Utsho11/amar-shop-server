import express from "express";
import { UserControllers } from "./user.controllers";
import { fileUploader } from "../../helpers/fileUploader";
import { parseBody } from "../../middlewares/bodyParser";
import { UserValidation } from "./user.validation";
import validateRequest from "../../middlewares/validateRequest";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";

const router = express.Router();

router.patch(
  "/update-user",
  auth(UserRole.ADMIN, UserRole.CUSTOMER, UserRole.VENDOR),
  fileUploader.single("file"),
  validateRequest(UserValidation.updateUserSchema),
  parseBody,
  UserControllers.updateMyProfie
);

router.get("/", auth(UserRole.ADMIN), UserControllers.getAllUser);

export const UserRoutes = router;
