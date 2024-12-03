import { z } from "zod";

const createUserSchema = z.object({
  body: z.object({
    password: z.string({
      required_error: "Password is required",
    }),
    role: z.enum(["ADMIN", "VENDOR", "CUSTOMER"]),
    user: z.object({
      name: z.string({
        required_error: "Name is required!",
      }),
      email: z.string({
        required_error: "Email is required!",
      }),
      phone: z.string({
        required_error: "Contact Number is required!",
      }),
    }),
  }),
});

const updateUserSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    email: z.string().optional(),
    password: z.string().optional(),
    phone: z.string().optional(),
    role: z.enum(["ADMIN", "VENDOR", "CUSTOMER"]).optional(),
  }),
});

export const UserValidation = { createUserSchema, updateUserSchema };
