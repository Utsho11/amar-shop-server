"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryRoutes = void 0;
const express_1 = __importDefault(require("express"));
const category_controllers_1 = require("./category.controllers");
const router = express_1.default.Router();
router.get("/", category_controllers_1.CategoryControllers.getAllCategories);
exports.CategoryRoutes = router;
