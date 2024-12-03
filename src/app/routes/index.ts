import express from "express";
import { UserRoutes } from "../modules/User/user.routes";
import { AuthRoutes } from "../modules/Auth/auth.routes";
import { ShopRoutes } from "../modules/Shops/shop.routes";
import { CategoryRoutes } from "../modules/Category/category.routes";

const router = express.Router();

const moduleRoutes = [
  {
    path: "/auth",
    route: AuthRoutes,
  },
  {
    path: "/user",
    route: UserRoutes,
  },
  {
    path: "/shop",
    route: ShopRoutes,
  },
  {
    path: "/category",
    route: CategoryRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
