import express from "express";
import { ProductControllers } from "./product.controllers";
import auth from "../../../middlewares/auth";
import { UserRole } from "@prisma/client";

const router = express.Router();

router.get(
  "/",
  auth(UserRole.ADMIN, UserRole.VENDOR),
  ProductControllers.getAllProducts
);
router.get("/:p_id", ProductControllers.getSingleProduct);

export const ProductRoutes = router;
