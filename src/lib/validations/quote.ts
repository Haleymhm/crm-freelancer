import * as z from "zod"

export const quoteItemSchema = z.object({
    description: z.string().min(1, "La descripción es requerida"),
    quantity: z.number().positive("La cantidad debe ser mayor a 0"),
    unitPrice: z.number().positive("El precio debe ser mayor a 0"),
    total: z.number(),
})

export const createQuoteSchema = z.object({
    dealId: z.string().min(1, "Debes seleccionar un deal"),
    items: z.array(quoteItemSchema).min(1, "Agrega al menos un ítem"),
    taxRate: z.number().min(0).max(100).optional().default(16),
    validUntil: z.string().optional().or(z.literal("")),
    notes: z.string().optional().or(z.literal("")),
})

export const updateQuoteSchema = createQuoteSchema.partial()

export type QuoteItem = z.infer<typeof quoteItemSchema>
export type CreateQuoteData = z.infer<typeof createQuoteSchema>
export type UpdateQuoteData = z.infer<typeof updateQuoteSchema>
