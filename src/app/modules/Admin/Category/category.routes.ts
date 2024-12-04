import express from "express";
import { CategoryControllers } from "./category.controllers";

const router = express.Router();

router.get("/", CategoryControllers.getAllCategories);

export const CategoryRoutes = router;
