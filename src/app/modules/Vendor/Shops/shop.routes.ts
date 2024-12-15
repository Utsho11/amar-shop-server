import express from "express";
import { ShopControllers } from "./shop.controllers";
import auth from "../../../middlewares/auth";
import { UserRole } from "@prisma/client";

const router = express.Router();

router.get("/:s_id", ShopControllers.getSingleShop);
router.get("/products/:s_id", ShopControllers.getProductsByShop);
router.post(
  "/follow/:s_id",
  auth(UserRole.CUSTOMER),
  ShopControllers.followShop
);
router.delete(
  "/unfollow/:s_id",
  auth(UserRole.CUSTOMER),
  ShopControllers.unfollowShop
);

router.get("/followers/:s_id", ShopControllers.getFollowers);

export const ShopRoutes = router;
