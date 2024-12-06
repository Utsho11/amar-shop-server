import express from "express";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";
import { AdminControllers } from "./admin.controllers";
import { fileUploader } from "../../../config/multer.config";
import { parseBody } from "../../middlewares/bodyParser";
import { CategoryControllers } from "./Category/category.controllers";
import { UserControllers } from "../User/user.controllers";

const router = express.Router();

router.get("/users", auth(UserRole.ADMIN), UserControllers.getAllUser);

router.post(
  "/create-category",
  auth(UserRole.ADMIN),
  fileUploader.single("file"),
  parseBody,
  CategoryControllers.createCategory
);

router.patch(
  "/edit-category/:category_id",
  auth(UserRole.ADMIN),
  fileUploader.single("file"),
  parseBody,
  CategoryControllers.updateCategory
);
router.delete(
  "/delete-category/:category_id",
  auth(UserRole.ADMIN),
  CategoryControllers.deleteCategory
);

router.patch(
  "/suspend-user/:user_id",
  auth(UserRole.ADMIN),
  AdminControllers.suspendUser
);

export const AdminRoutes = router;
