import * as z from "zod"

const isoDateSchema = z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido (YYYY-MM-DD)")
    .refine((value) => !Number.isNaN(Date.parse(value)), "Fecha inválida")

export const invoiceItemSchema = z.object({
    description: z.string().trim().min(1, "La descripción es requerida").max(500),
    quantity: z.number().finite().positive("La cantidad debe ser mayor a 0").max(1_000_000),
    unitPrice: z.number().finite().positive("El precio unitario debe ser mayor a 0").max(99_999_999.99),
    total: z.number().finite().nonnegative(),
})

export const createInvoiceSchema = z.object({
    dealId: z.string().trim().min(1, "Debes seleccionar un deal").max(100),
    quoteId: z.string().trim().max(100).nullable().optional().or(z.literal("")),
    items: z.array(invoiceItemSchema).min(1, "Agrega al menos un ítem").max(50, "Máximo 50 ítems"),
    taxRate: z.number().finite().min(0).max(100).optional().default(16),
    dueDate: isoDateSchema,
    notes: z.string().trim().max(5000).optional().or(z.literal("")),
    status: z.enum(["PENDIENTE", "PAGADA", "VENCIDA", "CANCELADA"]).optional().default("PENDIENTE"),
})

export const updateInvoiceSchema = createInvoiceSchema.partial()

export type InvoiceItem = z.infer<typeof invoiceItemSchema>
export type CreateInvoiceData = z.infer<typeof createInvoiceSchema>
export type UpdateInvoiceData = z.infer<typeof updateInvoiceSchema>
