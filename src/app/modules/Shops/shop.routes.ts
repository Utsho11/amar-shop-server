import express from "express";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";
import { ShopControllers } from "./shop.controllers";
import { fileUploader } from "../../helpers/fileUploader";
import { parseBody } from "../../middlewares/bodyParser";

const router = express.Router();

router.post(
  "/create-shop",
  auth(UserRole.VENDOR),
  fileUploader.single("file"),
  parseBody,
  ShopControllers.createShop
);

export const ShopRoutes = router;
