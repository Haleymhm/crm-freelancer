import * as z from "zod"

export const interactionSchema = z.object({
    type: z.enum(["EMAIL", "LLAMADA", "REUNION", "NOTA", "WHATSAPP"]),
    subject: z.string().optional().or(z.literal("")),
    notes: z.string().optional().or(z.literal("")),
    contactId: z.string().nullable().optional().or(z.literal("none")).or(z.literal("")),
    companyId: z.string().nullable().optional().or(z.literal("none")).or(z.literal("")),
    dealId: z.string().nullable().optional().or(z.literal("none")).or(z.literal("")),
    interactionDate: z.string().optional().or(z.literal("")),
})

export type InteractionFormData = z.infer<typeof interactionSchema>
