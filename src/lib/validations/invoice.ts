import * as z from "zod"

export const invoiceItemSchema = z.object({
    description: z.string().min(1, "La descripción es requerida"),
    quantity: z.number().positive("La cantidad debe ser mayor a 0"),
    unitPrice: z.number().positive("El precio unitario debe ser mayor a 0"),
    total: z.number(),
})

export const createInvoiceSchema = z.object({
    dealId: z.string().min(1, "Debes seleccionar un deal"),
    quoteId: z.string().nullable().optional().or(z.literal("")),
    items: z.array(invoiceItemSchema).min(1, "Agrega al menos un ítem"),
    taxRate: z.number().min(0).max(100).optional().default(16),
    dueDate: z.string().min(1, "La fecha de vencimiento es requerida"),
    notes: z.string().optional().or(z.literal("")),
    status: z.enum(["PENDIENTE", "PAGADA", "VENCIDA", "CANCELADA"]).optional().default("PENDIENTE"),
})

export const updateInvoiceSchema = createInvoiceSchema.partial()

export type InvoiceItem = z.infer<typeof invoiceItemSchema>
export type CreateInvoiceData = z.infer<typeof createInvoiceSchema>
export type UpdateInvoiceData = z.infer<typeof updateInvoiceSchema>
