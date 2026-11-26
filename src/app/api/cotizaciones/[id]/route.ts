import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { updateQuoteSchema } from "@/lib/validations/quote"
import { isSameOrigin } from "@/lib/http/same-origin"
import type { DealStage } from "@prisma/client"

type QuoteItem = {
    description: string
    quantity: number
    unitPrice: number
    total?: number
}

const noStoreHeaders = {
    "Cache-Control": "no-store, max-age=0",
    Vary: "Cookie",
}

const quoteSelect = {
    id: true,
    dealId: true,
    quoteNumber: true,
    status: true,
    items: true,
    subtotal: true,
    tax: true,
    total: true,
    validUntil: true,
    notes: true,
    sentAt: true,
    createdAt: true,
    updatedAt: true,
    deal: {
        select: {
            id: true,
            title: true,
            client: { select: { name: true, type: true } },
        },
    },
}

const validStatuses = ["BORRADOR", "ENVIADA", "ACEPTADA", "RECHAZADA"] as const
type QuoteStatus = (typeof validStatuses)[number]

const allowedTransitions: Record<QuoteStatus, readonly QuoteStatus[]> = {
    BORRADOR: ["ENVIADA", "RECHAZADA"],
    ENVIADA: ["ACEPTADA", "RECHAZADA"],
    ACEPTADA: [],
    RECHAZADA: [],
}

/**
 * Calcula los totales de la cotización en el servidor.
 */
function calculateTotals(
    items: { quantity: number; unitPrice: number }[],
    taxRate: number
) {
    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
    const tax = subtotal * (taxRate / 100)
    const total = subtotal + tax
    return { subtotal, tax, total }
}

// GET /api/cotizaciones/[id] — Obtiene el detalle de una cotización
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 })
        }

        const { id } = await params

        const quote = await prisma.quote.findFirst({
            where: { id, deal: { userId: session.user.id } },
            select: quoteSelect,
        })

        if (!quote) {
            return NextResponse.json({ error: "Cotización no encontrada" }, { status: 404 })
        }

        return NextResponse.json(quote, { headers: noStoreHeaders })
    } catch (error) {
        console.error("Error fetching quote:", error)
        return NextResponse.json({ error: "Error al obtener cotización" }, { status: 500 })
    }
}

// PUT /api/cotizaciones/[id] — Edita una cotización (solo en BORRADOR)
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        if (!isSameOrigin(request)) {
            return NextResponse.json({ error: "Origen no permitido" }, { status: 403 })
        }

        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 })
        }

        const { id } = await params

        const existing = await prisma.quote.findFirst({
            where: { id, deal: { userId: session.user.id } },
        })

        if (!existing) {
            return NextResponse.json({ error: "Cotización no encontrada" }, { status: 404 })
        }

        if (existing.status !== "BORRADOR") {
            return NextResponse.json(
                { error: "Solo se pueden editar cotizaciones en estado BORRADOR" },
                { status: 403 }
            )
        }

        const parsed = updateQuoteSchema.safeParse(await request.json().catch(() => null))
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Datos inválidos", details: parsed.error.flatten() },
                { status: 400 }
            )
        }

        const { items, taxRate, validUntil, notes } = parsed.data

        const itemsToUpdate = items ?? (existing.items as QuoteItem[])
        const existingSubtotal = Number(existing.subtotal)
        const existingTax = Number(existing.tax)
        const derivedTaxRate =
            existingSubtotal > 0 ? Math.round((existingTax / existingSubtotal) * 10000) / 100 : 16
        const rateToUse = taxRate ?? derivedTaxRate
        const { subtotal, tax, total } = calculateTotals(itemsToUpdate, rateToUse)

        const processedItems = itemsToUpdate.map((item) => ({
            ...item,
            total: item.quantity * item.unitPrice,
        }))

        const updated = await prisma.quote.update({
            where: { id },
            data: {
                items: processedItems,
                subtotal,
                tax,
                total,
                ...(validUntil !== undefined && {
                    validUntil: validUntil ? new Date(`${validUntil}T12:00:00Z`) : null,
                }),
                ...(notes !== undefined && {
                    notes: notes || null,
                }),
            },
            select: quoteSelect,
        })

        return NextResponse.json(updated)
    } catch (error) {
        console.error("Error updating quote:", error)
        return NextResponse.json({ error: "Error al actualizar cotización" }, { status: 500 })
    }
}

// PATCH /api/cotizaciones/[id] — Cambia el estado de una cotización y sincroniza el Deal
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        if (!isSameOrigin(request)) {
            return NextResponse.json({ error: "Origen no permitido" }, { status: 403 })
        }

        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 })
        }

        const { id } = await params
        const body = (await request.json().catch(() => null)) as { status?: string } | null
        const status = body?.status

        if (!status || !validStatuses.includes(status as QuoteStatus)) {
            return NextResponse.json({ error: "Estado inválido" }, { status: 400 })
        }

        const nextStatus = status as QuoteStatus

        const existing = await prisma.quote.findFirst({
            where: { id, deal: { userId: session.user.id } },
            select: { id: true, dealId: true, status: true },
        })

        if (!existing) {
            return NextResponse.json({ error: "Cotización no encontrada" }, { status: 404 })
        }

        if (!allowedTransitions[existing.status as QuoteStatus].includes(nextStatus)) {
            return NextResponse.json(
                { error: "Transición de estado no permitida" },
                { status: 409 }
            )
        }

        /**
         * Mapa de sincronización: estado de cotización → etapa del deal.
         * ENVIADA   → el deal pasa a "Propuesta Enviada"
         * ACEPTADA  → el deal pasa a "Cerrado Ganado" (con fecha de cierre)
         */
        const dealStageMap: Partial<Record<QuoteStatus, { stage: DealStage; closedAt?: Date }>> = {
            ENVIADA: { stage: "PROPUESTA_ENVIADA" as DealStage },
            ACEPTADA: { stage: "CERRADO_GANADO" as DealStage, closedAt: new Date() },
        }

        // Actualización atómica: cotización + deal en una sola transacción
        const dealUpdate = dealStageMap[nextStatus] ?? null
        const [updatedQuote] = await prisma.$transaction([
            prisma.quote.update({
                where: { id },
                data: {
                    status: nextStatus,
                    ...(nextStatus === "ENVIADA" && { sentAt: new Date() }),
                },
                select: quoteSelect,
            }),
            ...(dealUpdate
                ? [
                    prisma.deal.update({
                        where: { id: existing.dealId },
                        data: {
                            stage: dealUpdate.stage,
                            ...(dealUpdate.closedAt && { closedAt: dealUpdate.closedAt }),
                        },
                    }),
                ]
                : []),
        ])

        return NextResponse.json(updatedQuote)
    } catch (error) {
        console.error("Error updating quote status:", error)
        return NextResponse.json({ error: "Error al actualizar estado" }, { status: 500 })
    }
}

// DELETE /api/cotizaciones/[id] — Elimina una cotización (solo en BORRADOR)
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        if (!isSameOrigin(request)) {
            return NextResponse.json({ error: "Origen no permitido" }, { status: 403 })
        }

        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 })
        }

        const { id } = await params

        const existing = await prisma.quote.findFirst({
            where: { id, deal: { userId: session.user.id } },
            select: { id: true, status: true },
        })

        if (!existing) {
            return NextResponse.json({ error: "Cotización no encontrada" }, { status: 404 })
        }

        if (existing.status !== "BORRADOR") {
            return NextResponse.json(
                { error: "Solo se pueden eliminar cotizaciones en estado BORRADOR" },
                { status: 403 }
            )
        }

        await prisma.quote.delete({ where: { id } })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error deleting quote:", error)
        return NextResponse.json({ error: "Error al eliminar cotización" }, { status: 500 })
    }
}
