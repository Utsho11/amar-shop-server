import express from "express";
import { ProductControllers } from "./product.controllers";

const router = express.Router();

router.get("/", ProductControllers.getAllProducts);
router.get("/:p_id", ProductControllers.getSingleProduct);

export const ProductRoutes = router;
