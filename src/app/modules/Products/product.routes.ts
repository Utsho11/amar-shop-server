import express from "express";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";
import { fileUploader } from "../../helpers/fileUploader";
import { parseBody } from "../../middlewares/bodyParser";

const router = express.Router();

router.post(
  "/create-shop",
  auth(UserRole.VENDOR),
  fileUploader.single("file"),
  parseBody
);

export const ShopRoutes = router;
