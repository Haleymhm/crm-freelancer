import * as z from "zod"

export const dealSchema = z.object({
    title: z.string().min(1, "El título es requerido"),
    description: z.string().optional().or(z.literal("")),
    value: z.coerce.number().min(0, "El valor debe ser mayor o igual a 0"),
    stage: z.enum(["PROSPECTO", "CONTACTADO", "PROPUESTA_ENVIADA", "NEGOCIACION", "CERRADO_GANADO", "CERRADO_PERDIDO"]),
    contactId: z.string().nullable().optional().or(z.literal("none")).or(z.literal("")),
    companyId: z.string().nullable().optional().or(z.literal("none")).or(z.literal("")),
    expectedCloseDate: z.string().optional().or(z.literal("")),
})

export type DealFormData = z.infer<typeof dealSchema>
