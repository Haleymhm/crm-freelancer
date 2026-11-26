import * as z from "zod"

export const dealStageSchema = z.enum([
    "PROSPECTO",
    "CONTACTADO",
    "PROPUESTA_ENVIADA",
    "NEGOCIACION",
    "CERRADO_GANADO",
    "CERRADO_PERDIDO",
])

const isoDateSchema = z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido (YYYY-MM-DD)")

export const createDealSchema = z
    .object({
        title: z.string().trim().min(1, "El título es requerido").max(200),
        description: z.string().trim().max(5000).optional().or(z.literal("")).nullable(),
        value: z.coerce
            .number()
            .finite("El valor debe ser numérico")
            .nonnegative("El valor debe ser mayor o igual a 0")
            .max(99_999_999.99, "El valor excede el máximo permitido"),
        stage: dealStageSchema,
        clientId: z
            .union([z.string().trim().min(1).max(100), z.literal("none"), z.literal(""), z.null()])
            .optional(),
        expectedCloseDate: isoDateSchema.optional().or(z.literal("")).nullable(),
    })
    .strict()

export const dealSchema = createDealSchema
export const updateDealSchema = createDealSchema.partial().strict()

export type DealFormData = z.infer<typeof createDealSchema>
