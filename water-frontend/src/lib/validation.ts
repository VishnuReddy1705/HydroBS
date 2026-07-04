import { z } from "zod";

/* ===========================
   Login
=========================== */

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

/* ===========================
   Register Community Admin
=========================== */

export const registerAdminSchema = z.object({
  fullName: z
    .string()
    .min(2, "Enter your full name"),

  email: z
    .string()
    .email("Enter a valid email"),

  password: z
    .string()
    .min(8, "Password must contain at least 8 characters"),

  communityName: z
    .string()
    .min(2, "Enter your community name"),
});

export type RegisterAdminFormValues =
  z.infer<typeof registerAdminSchema>;

/* ===========================
   Register Resident
=========================== */

export const registerResidentSchema = z.object({
  fullName: z
    .string()
    .min(2, "Enter your full name"),

  email: z
    .string()
    .email("Enter a valid email"),

  password: z
    .string()
    .min(8, "Password must contain at least 8 characters"),
});

export type RegisterResidentFormValues =
  z.infer<typeof registerResidentSchema>;