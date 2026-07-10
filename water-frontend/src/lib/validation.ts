import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
})
export type LoginFormValues = z.infer<typeof loginSchema>

export const registerAdminSchema = z.object({
  fullName: z.string().min(2, "Enter your name"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "At least 8 characters"),
  communityName: z.string().min(2, "Enter a community name"),
})
export type RegisterAdminFormValues = z.infer<typeof registerAdminSchema>

export const registerResidentSchema = z.object({
  fullName: z.string().min(2, "Enter your name"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "At least 8 characters"),
  flatNumber: z.string().min(1, "Enter your flat number"),
})
export type RegisterResidentFormValues = z.infer<typeof registerResidentSchema>