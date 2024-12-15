"use strict";
/* eslint-disable no-console */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seed = void 0;
const client_1 = require("@prisma/client");
const prisma_1 = __importDefault(require("../shared/prisma"));
const config_1 = __importDefault(require("../config"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const seed = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Check if the admin exists
        const admin = yield prisma_1.default.user.findUnique({
            where: {
                email: config_1.default.admin_email,
            },
        });
        if (!admin) {
            const plainPass = config_1.default.admin_pass;
            const hashedPassword = yield bcrypt_1.default.hash(plainPass, 12);
            console.log("Seeding started...");
            // Perform transaction
            yield prisma_1.default.$transaction((transactionClient) => __awaiter(void 0, void 0, void 0, function* () {
                // Create the User record
                const createdUser = yield transactionClient.user.create({
                    data: {
                        email: config_1.default.admin_email,
                        password: hashedPassword,
                        role: client_1.UserRole.ADMIN,
                    },
                });
                // Create the Admin record and link it to the User
                yield transactionClient.admin.create({
                    data: {
                        name: "Utsho",
                        email: createdUser.email, // Linking Admin to User via email
                        phone: "01727362718",
                        image: "https://tinyurl.com/2s4brkam",
                    },
                });
            }));
            console.log("Admin created successfully...");
            console.log("Seeding completed...");
        }
        else {
            console.log("Admin already exists. Seeding skipped.");
        }
    }
    catch (error) {
        console.error("Error in seeding", error);
    }
});
exports.seed = seed;
