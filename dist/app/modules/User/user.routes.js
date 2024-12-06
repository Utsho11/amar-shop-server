"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRoutes = void 0;
const express_1 = __importDefault(require("express"));
const user_controllers_1 = require("./user.controllers");
const bodyParser_1 = require("../../middlewares/bodyParser");
const user_validation_1 = require("./user.validation");
const validateRequest_1 = __importDefault(require("../../middlewares/validateRequest"));
const auth_1 = __importDefault(require("../../middlewares/auth"));
const client_1 = require("@prisma/client");
const multer_config_1 = require("../../../config/multer.config");
const router = express_1.default.Router();
router.patch("/update-user", (0, auth_1.default)(client_1.UserRole.ADMIN, client_1.UserRole.CUSTOMER, client_1.UserRole.VENDOR), multer_config_1.fileUploader.single("file"), (0, validateRequest_1.default)(user_validation_1.UserValidation.updateUserSchema), bodyParser_1.parseBody, user_controllers_1.UserControllers.updateMyProfie);
router.get("/", (0, auth_1.default)(client_1.UserRole.ADMIN), user_controllers_1.UserControllers.getAllUser);
exports.UserRoutes = router;
