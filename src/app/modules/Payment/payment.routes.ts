import express from "express";
import { PaymentController } from "./payment.controllers";

const router = express.Router();

router.post("/confirmation", PaymentController.confirmationController);

export const PaymentRoutes = router;
