import express from "express";
import { fileUploader } from "../../helpers/fileUploader";
import { parseBody } from "../../middlewares/bodyParser";
import validateRequest from "../../middlewares/validateRequest";
import { UserValidation } from "../User/user.validation";
import { AuthControllers } from "./auth.controllers";
import { AuthValidation } from "./auth.validation";

const router = express.Router();

router.post(
  "/register",
  fileUploader.single("file"),
  parseBody,
  validateRequest(UserValidation.createUserSchema),
  AuthControllers.registerUser
);

router.post(
  "/login",
  validateRequest(AuthValidation.loginSchema),
  AuthControllers.loginUser
);

export const AuthRoutes = router;
