import * as z from "zod"

const isoDateSchema = z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido (YYYY-MM-DD)")
    .refine((value) => !Number.isNaN(Date.parse(value)), "Fecha inválida")

export const quoteItemSchema = z.object({
    description: z.string().trim().min(1, "La descripción es requerida").max(500),
    quantity: z.number().finite().positive("La cantidad debe ser mayor a 0").max(1_000_000),
    unitPrice: z.number().finite().positive("El precio debe ser mayor a 0").max(99_999_999.99),
    total: z.number().finite().nonnegative(),
})

export const createQuoteSchema = z.object({
    dealId: z.string().trim().min(1, "Debes seleccionar un deal").max(100),
    items: z.array(quoteItemSchema).min(1, "Agrega al menos un ítem").max(50, "Máximo 50 ítems"),
    taxRate: z.number().finite().min(0).max(100).optional().default(16),
    validUntil: isoDateSchema.optional().or(z.literal("")),
    notes: z.string().trim().max(5000).optional().or(z.literal("")),
})

export const updateQuoteSchema = createQuoteSchema.partial()

export type QuoteItem = z.infer<typeof quoteItemSchema>
export type CreateQuoteData = z.infer<typeof createQuoteSchema>
export type UpdateQuoteData = z.infer<typeof updateQuoteSchema>
