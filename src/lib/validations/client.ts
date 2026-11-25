import * as z from "zod"

export const clientSchema = z.object({
    type: z.enum(["PERSONA", "EMPRESA"]),
    name: z.string().min(1, "El nombre es requerido"),
    taxId: z.string().optional().or(z.literal("")),
    email: z.string().email("Correo inválido").optional().or(z.literal("")),
    phone: z.string().optional().or(z.literal("")),
    contactName: z.string().optional().or(z.literal("")),
    website: z.string().url("Debe ser una URL válida").optional().or(z.literal("")),
    address: z.string().optional().or(z.literal("")),
    notes: z.string().optional().or(z.literal("")),
})

export type ClientFormData = z.infer<typeof clientSchema>
