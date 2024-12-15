import express from "express";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";
import { CustomerControllers } from "./customer.controllers";

const router = express.Router();

router.post(
  "/checkout",
  auth(UserRole.CUSTOMER),
  CustomerControllers.createOrder
);

router.post(
  "/add-review",
  auth(UserRole.CUSTOMER),
  CustomerControllers.addReview
);

router.get(
  "/orderItemForReview",
  auth(UserRole.CUSTOMER),
  CustomerControllers.getItemForReview
);

router.get(
  "/myOrderHistory",
  auth(UserRole.CUSTOMER),
  CustomerControllers.getMyOrderHistory
);

export const CustomerRoutes = router;
