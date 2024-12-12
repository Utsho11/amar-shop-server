import express from "express";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";
import { parseBody } from "../../middlewares/bodyParser";
import { ShopControllers } from "./Shops/shop.controllers";
import { ProductControllers } from "./Products/product.controllers";
import { fileUploader } from "../../../config/multer.config";
import { VendorControllers } from "./vendor.controllers";

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
  "/update-product",
  auth(UserRole.VENDOR),
  fileUploader.single("file"),
  parseBody,
  ProductControllers.updateProduct
);

router.patch(
  "/update-shop",
  auth(UserRole.VENDOR),
  fileUploader.single("file"),
  parseBody,
  ShopControllers.updateShop
);

router.delete(
  "/delete-product/:p_id",
  auth(UserRole.VENDOR),
  ProductControllers.deleteProduct
);

router.get(
  "/get-products",
  auth(UserRole.VENDOR),
  VendorControllers.getProducts
);

router.get("/get-my-shop", auth(UserRole.VENDOR), ShopControllers.getMyShop);

export const VendorRoutes = router;
