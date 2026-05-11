import express from "express";
import { ProductControllers } from "./product.controllers";

const router = express.Router();

router.get("/", ProductControllers.getAllProducts);
router.get("/flashSaleProducts", ProductControllers.getFlashSaleProducts);
router.get("/:p_id", ProductControllers.getSingleProduct);
router.get("/review/:p_id", ProductControllers.getReviews);

export const ProductRoutes = router;
