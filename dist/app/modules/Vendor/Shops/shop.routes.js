"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShopRoutes = void 0;
const express_1 = __importDefault(require("express"));
const shop_controllers_1 = require("./shop.controllers");
const auth_1 = __importDefault(require("../../../middlewares/auth"));
const client_1 = require("@prisma/client");
const router = express_1.default.Router();
router.get("/:s_id", shop_controllers_1.ShopControllers.getSingleShop);
router.get("/products/:s_id", shop_controllers_1.ShopControllers.getProductsByShop);
router.post("/follow/:s_id", (0, auth_1.default)(client_1.UserRole.CUSTOMER), shop_controllers_1.ShopControllers.followShop);
router.delete("/unfollow/:s_id", (0, auth_1.default)(client_1.UserRole.CUSTOMER), shop_controllers_1.ShopControllers.unfollowShop);
router.get("/followers/:s_id", shop_controllers_1.ShopControllers.getFollowers);
exports.ShopRoutes = router;
