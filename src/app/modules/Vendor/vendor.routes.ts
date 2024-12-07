import express from "express";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";
import { parseBody } from "../../middlewares/bodyParser";
import { ShopControllers } from "./Shops/shop.controllers";
import { ProductControllers } from "./Products/product.controllers";
import { fileUploader } from "../../../config/multer.config";

const router = express.Router();

router.post(
  "/create-shop",
  auth(UserRole.VENDOR),
  fileUploader.single("file"),
  parseBody,
  ShopControllers.createShop
);

router.post(
  "/create-product",
  auth(UserRole.VENDOR),
  fileUploader.single("file"),
  parseBody,
  ProductControllers.createProduct
);

router.post(
  "/duplicate-product/:p_id",
  auth(UserRole.VENDOR),
  ProductControllers.duplicateProduct
);

router.patch(
  "/update-product/:p_id",
  auth(UserRole.VENDOR),
  fileUploader.single("file"),
  parseBody,
  ProductControllers.updateProduct
);

router.delete(
  "/delete-product/:p_id",
  auth(UserRole.VENDOR),
  ProductControllers.deleteProduct
);

router.get("/get-my-shop", auth(UserRole.VENDOR), ShopControllers.getMyShop);

export const VendorRoutes = router;
