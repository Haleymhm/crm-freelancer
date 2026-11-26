import * as z from "zod"

const dateTimeSchema = z
    .string()
    .trim()
    .max(64)
    .refine((value) => !Number.isNaN(Date.parse(value)), "Fecha u hora inválida")

export const interactionSchema = z.object({
    type: z.enum(["EMAIL", "LLAMADA", "REUNION", "NOTA", "WHATSAPP"]),
    subject: z.string().trim().max(200).optional().or(z.literal("")).nullable(),
    notes: z.string().trim().max(5000).optional().or(z.literal("")).nullable(),
    clientId: z.string().trim().max(100).nullable().optional().or(z.literal("none")).or(z.literal("")),
    dealId: z.string().trim().max(100).nullable().optional().or(z.literal("none")).or(z.literal("")),
    interactionDate: dateTimeSchema.optional().or(z.literal("")),
})

export type InteractionFormData = z.infer<typeof interactionSchema>
