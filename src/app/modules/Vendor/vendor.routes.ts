import express from "express";
import auth from "../../middlewares/auth";
import { fileUploader } from "../../helpers/fileUploader";
import { UserRole } from "@prisma/client";
import { parseBody } from "../../middlewares/bodyParser";
import { ShopControllers } from "./Shops/shop.controllers";
import { ProductControllers } from "./Products/product.controllers";

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
  fileUploader.fields([{ name: "files" }]),
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
  fileUploader.fields([{ name: "files" }]),
  parseBody,
  ProductControllers.updateProduct
);

router.delete(
  "/delete-product/:p_id",
  auth(UserRole.VENDOR),
  ProductControllers.deleteProduct
);

export const VendorRoutes = router;
