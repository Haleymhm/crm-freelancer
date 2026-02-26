import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { updateQuoteSchema } from "@/lib/validations/quote"
import { z } from "zod"
import type { DealStage } from "@prisma/client"

type QuoteItem = {
    description: string
    quantity: number
    unitPrice: number
    total?: number
}

const validStatuses = ["BORRADOR", "ENVIADA", "ACEPTADA", "RECHAZADA"] as const
type QuoteStatus = (typeof validStatuses)[number]

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
            include: {
                deal: {
                    select: {
                        id: true,
                        title: true,
                        contact: { select: { firstName: true, lastName: true } },
                        company: { select: { name: true } },
                    },
                },
            },
        })

        if (!quote) {
            return NextResponse.json({ error: "Cotización no encontrada" }, { status: 404 })
        }

        return NextResponse.json(quote)
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

        const body = await request.json()
        const validatedData = updateQuoteSchema.parse(body)
        const { items, taxRate, validUntil, notes } = validatedData

        const itemsToUpdate = items ?? (existing.items as QuoteItem[])
        const rateToUse = taxRate ?? 16
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
                validUntil: validUntil ? new Date(validUntil) : null,
                notes: notes || null,
            },
            include: {
                deal: {
                    select: {
                        id: true,
                        title: true,
                        contact: { select: { firstName: true, lastName: true } },
                        company: { select: { name: true } },
                    },
                },
            },
        })

        return NextResponse.json(updated)
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Datos inválidos", details: error.errors }, { status: 400 })
        }
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
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 })
        }

        const { id } = await params
        const { status } = (await request.json()) as { status: string }

        if (!validStatuses.includes(status as QuoteStatus)) {
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
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
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
