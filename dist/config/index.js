"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.join(process.cwd(), ".env") });
exports.default = {
    env: process.env.NODE_ENV,
    port: process.env.PORT,
    cloudinary_cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    cloudinary_api_key: process.env.CLOUDINARY_API_KEY,
    cloudinary_api_secret: process.env.CLOUDINARY_API_SECRET,
    access_secret: process.env.ACCESS_SECRET,
    refresh_secret: process.env.REFRESH_SECRET,
    jwt_access_expires_in: process.env.ACCESS_SECRET_EXPIRE,
    jwt_refresh_expires_in: process.env.REFRESH_SECRET_EXPIRE,
    reset_pass_secret: process.env.RESET_PASS_SECRET,
    reset_pass_secret_expire_in: process.env.RESET_PASS_SECRET_EXPIRE_IN,
    reset_pass_link: process.env.RESET_PASS_LINK,
    sender_email: process.env.SENDER_EMAIL,
    sender_app_pass: process.env.SENDER_APP_PASS,
};
