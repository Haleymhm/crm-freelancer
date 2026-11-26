import * as z from "zod"

const dateTimeSchema = z
    .string()
    .trim()
    .min(1, "La fecha de vencimiento es requerida")
    .max(64)
    .refine((value) => !Number.isNaN(Date.parse(value)), "Fecha u hora inválida")

export const createReminderSchema = z.object({
    dealId: z.string().trim().min(1, "Debes seleccionar un deal").max(100),
    message: z.string().trim().min(1, "El mensaje es requerido").max(1000),
    dueDate: dateTimeSchema,
    completed: z.boolean().optional().default(false),
})

export const updateReminderSchema = z.object({
    message: z.string().trim().min(1, "El mensaje es requerido").max(1000).optional(),
    dueDate: dateTimeSchema.optional(),
    completed: z.boolean().optional(),
    completedAt: z.string().trim().max(64).refine((v) => !v || !Number.isNaN(Date.parse(v)), "Fecha inválida").optional().or(z.literal("")),
})

export type CreateReminderData = z.infer<typeof createReminderSchema>
export type UpdateReminderData = z.infer<typeof updateReminderSchema>
