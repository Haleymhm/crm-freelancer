import * as z from "zod"

export const loginSchema = z.object({
    email: z.string().trim().toLowerCase().email("Debe ser un correo electrónico válido").max(254),
    password: z.string().min(1, "La contraseña es requerida").max(128),
})

export type LoginFormData = z.infer<typeof loginSchema>

export const registerSchema = z.object({
    name: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres").max(100),
    email: z.string().trim().toLowerCase().email("Debe ser un correo electrónico válido").max(254),
    password: z.string().min(12, "La contraseña debe tener al menos 12 caracteres").max(128),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
})

export type RegisterFormData = z.infer<typeof registerSchema>
