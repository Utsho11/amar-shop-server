import express from "express";
import { UserRoutes } from "../modules/User/user.routes";
import { AuthRoutes } from "../modules/Auth/auth.routes";
import { AdminRoutes } from "../modules/Admin/admin.routes";
import { VendorRoutes } from "../modules/Vendor/vendor.routes";

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
    path: "/admin",
    route: AdminRoutes,
  },
  {
    path: "/vendor",
    route: VendorRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
