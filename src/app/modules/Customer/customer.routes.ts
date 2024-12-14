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

export const CustomerRoutes = router;
