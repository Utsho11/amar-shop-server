import { z } from "zod";

const createUserSchema = z.object({
  body: z.object({
    password: z.string({
      required_error: "Password is required",
    }),
    role: z.enum(["CUSTOMER", "VENDOR"]).default("CUSTOMER"),
    user: z.object({
      name: z.string({
        required_error: "Name is required!",
      }),
      email: z.string({
        required_error: "Email is required!",
      }).email("Invalid email address"),
      phone: z.string({
        required_error: "Contact Number is required!",
      }),
    }),
  }),
});

const updateUserSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    email: z.string().email("Invalid email address").optional(),
    password: z.string().optional(),
    phone: z.string().optional(),
  }),
});

export const UserValidation = { createUserSchema, updateUserSchema };
