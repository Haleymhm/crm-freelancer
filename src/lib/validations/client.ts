import * as z from "zod"

const httpUrlSchema = z
    .string()
    .trim()
    .max(2048, "La URL es demasiado larga")
    .url("Debe ser una URL válida")
    .refine((value) => {
        try {
            const { protocol } = new URL(value)
            return protocol === "http:" || protocol === "https:"
        } catch {
            return false
        }
    }, "Solo se permiten URLs http/https")

export const clientSchema = z.object({
    type: z.enum(["PERSONA", "EMPRESA"]),
    name: z.string().trim().min(1, "El nombre es requerido").max(200),
    taxId: z.string().trim().max(50).optional().or(z.literal("")),
    email: z.string().trim().toLowerCase().email("Correo inválido").max(254).optional().or(z.literal("")),
    phone: z.string().trim().max(50).optional().or(z.literal("")),
    contactName: z.string().trim().max(200).optional().or(z.literal("")),
    website: httpUrlSchema.optional().or(z.literal("")),
    address: z.string().trim().max(500).optional().or(z.literal("")),
    notes: z.string().trim().max(5000).optional().or(z.literal("")),
})

export type ClientFormData = z.infer<typeof clientSchema>
