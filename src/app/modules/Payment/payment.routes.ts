import express from "express";
import { PaymentController } from "./payment.controllers";

const router = express.Router();

router.post("/confirmation", PaymentController.confirmationController);
router.get("/confirmation", PaymentController.confirmationController);
router.post("/ipn", PaymentController.confirmationController);

export const PaymentRoutes = router;
