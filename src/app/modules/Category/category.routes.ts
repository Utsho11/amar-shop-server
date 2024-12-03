import express from "express";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";
import { fileUploader } from "../../helpers/fileUploader";
import { parseBody } from "../../middlewares/bodyParser";
import { CategoryControllers } from "./category.controllers";

const router = express.Router();

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

export const CategoryRoutes = router;
