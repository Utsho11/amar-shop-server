import express from "express";
import { fileUploader } from "../../helpers/fileUploader";
import { parseBody } from "../../middlewares/bodyParser";
import validateRequest from "../../middlewares/validateRequest";
import { UserValidation } from "../User/user.validation";
import { AuthControllers } from "./auth.controllers";

const router = express.Router();

router.post(
  "/register",
  fileUploader.single("file"),
  parseBody,
  validateRequest(UserValidation.createUserSchema),
  AuthControllers.registerUser
);

export const AuthRoutes = router;
