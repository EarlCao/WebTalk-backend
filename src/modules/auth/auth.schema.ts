import { z } from "zod";

export const RegisterSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters.")
    .max(30, "Username must not exceed 30 characters.")
    .regex(/^[a-zA-Z0-9_.-]+$/, "Username may only contain letters, numbers, underscores, dots, and hyphens.")
    .trim(),
  email: z
    .string()
    .email("Invalid email address.")
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(64, "Password must not exceed 64 characters."),
});

export const LoginSchema = z.object({
  email: z
    .string()
    .email("Invalid email address.")
    .toLowerCase()
    .trim(),
  password: z.string().min(1, "Password is required."),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
