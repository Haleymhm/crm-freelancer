import * as z from "zod"

export const companySchema = z.object({
    name: z.string().min(1, "El nombre de la empresa es requerido"),
    email: z.string().email("Correo inválido").optional().or(z.literal("")),
    phone: z.string().optional().or(z.literal("")),
    website: z.string().url("Debe ser una URL válida").optional().or(z.literal("")),
    address: z.string().optional().or(z.literal("")),
})

export type CompanyFormData = z.infer<typeof companySchema>
