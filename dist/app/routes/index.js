"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const user_routes_1 = require("../modules/User/user.routes");
const auth_routes_1 = require("../modules/Auth/auth.routes");
const admin_routes_1 = require("../modules/Admin/admin.routes");
const vendor_routes_1 = require("../modules/Vendor/vendor.routes");
const product_routes_1 = require("../modules/Vendor/Products/product.routes");
const category_routes_1 = require("../modules/Admin/Category/category.routes");
const router = express_1.default.Router();
const moduleRoutes = [
    {
        path: "/auth",
        route: auth_routes_1.AuthRoutes,
    },
    {
        path: "/user",
        route: user_routes_1.UserRoutes,
    },
    {
        path: "/admin",
        route: admin_routes_1.AdminRoutes,
    },
    {
        path: "/vendor",
        route: vendor_routes_1.VendorRoutes,
    },
    {
        path: "/product",
        route: product_routes_1.ProductRoutes,
    },
    {
        path: "/category",
        route: category_routes_1.CategoryRoutes,
    },
];
moduleRoutes.forEach((route) => router.use(route.path, route.route));
exports.default = router;
