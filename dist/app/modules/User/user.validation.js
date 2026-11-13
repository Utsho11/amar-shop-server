"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserValidation = void 0;
const zod_1 = require("zod");
const createUserSchema = zod_1.z.object({
    body: zod_1.z.object({
        password: zod_1.z.string({
            required_error: "Password is required",
        }),
        role: zod_1.z.enum(["CUSTOMER", "VENDOR"]).default("CUSTOMER"),
        user: zod_1.z.object({
            name: zod_1.z.string({
                required_error: "Name is required!",
            }),
            email: zod_1.z.string({
                required_error: "Email is required!",
            }).email("Invalid email address"),
            phone: zod_1.z.string({
                required_error: "Contact Number is required!",
            }),
        }),
    }),
});
const updateUserSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().optional(),
        email: zod_1.z.string().email("Invalid email address").optional(),
        password: zod_1.z.string().optional(),
        phone: zod_1.z.string().optional(),
    }),
});
exports.UserValidation = { createUserSchema, updateUserSchema };
