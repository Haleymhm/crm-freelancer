import * as z from "zod"

export const contactSchema = z.object({
    firstName: z.string().min(1, "El nombre es requerido"),
    lastName: z.string().min(1, "El apellido es requerido"),
    email: z.string().email("Correo inválido").optional().or(z.literal("")),
    phone: z.string().optional().or(z.literal("")),
    position: z.string().optional().or(z.literal("")),
    companyId: z.string().optional().or(z.literal("none")).or(z.literal("")),
})

export type ContactFormData = z.infer<typeof contactSchema>
