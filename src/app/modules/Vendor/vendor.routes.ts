import express from "express";
import auth from "../../middlewares/auth";
import { fileUploader } from "../../helpers/fileUploader";
import { UserRole } from "@prisma/client";
import { parseBody } from "../../middlewares/bodyParser";
import { ShopControllers } from "./Shops/shop.controllers";

const router = express.Router();

router.post(
  "/create-shop",
  auth(UserRole.VENDOR),
  fileUploader.single("file"),
  parseBody,
  ShopControllers.createShop
);
export const VendorRoutes = router;
