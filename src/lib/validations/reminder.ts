import * as z from "zod"

export const createReminderSchema = z.object({
    dealId: z.string().min(1, "Debes seleccionar un deal"),
    message: z.string().min(1, "El mensaje es requerido"),
    dueDate: z.string().min(1, "La fecha de vencimiento es requerida"),
    completed: z.boolean().optional().default(false),
})

export const updateReminderSchema = z.object({
    message: z.string().min(1, "El mensaje es requerido").optional(),
    dueDate: z.string().optional(),
    completed: z.boolean().optional(),
    completedAt: z.string().optional().or(z.literal("")),
})

export type CreateReminderData = z.infer<typeof createReminderSchema>
export type UpdateReminderData = z.infer<typeof updateReminderSchema>
