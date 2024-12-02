import { z } from "zod";

const createUserSchema = z.object({
  body: z.object({
    name: z.string({
      required_error: "Name is required!",
    }),
    email: z
      .string({
        required_error: "Email is required!",
      })
      .email("Invalid email format"),
    password: z.string({
      required_error: "Password is required",
    }),
    phone: z
      .string()
      .optional()
      .refine(
        (value) => !value || /^\+?[1-9]\d{1,14}$/.test(value),
        "Invalid phone number format"
      ),
    role: z.enum(["ADMIN", "VENDOR", "CUSTOMER"], {
      required_error: "Role is required!",
    }),
  }),
});

export const UserValidation = { createUserSchema };
