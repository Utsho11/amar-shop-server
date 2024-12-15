"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductRoutes = void 0;
const express_1 = __importDefault(require("express"));
const product_controllers_1 = require("./product.controllers");
const router = express_1.default.Router();
router.get("/", product_controllers_1.ProductControllers.getAllProducts);
router.get("/flashSaleProducts", product_controllers_1.ProductControllers.getFlashSaleProducts);
router.get("/:p_id", product_controllers_1.ProductControllers.getSingleProduct);
router.get("/review/:p_id", product_controllers_1.ProductControllers.getReviews);
exports.ProductRoutes = router;
