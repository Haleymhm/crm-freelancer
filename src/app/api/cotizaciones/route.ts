import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createQuoteSchema } from "@/lib/validations/quote"
import { z } from "zod"

/**
 * Genera el próximo número de cotización para el usuario.
 * Formato: COT-YYYY-NNN (ej: COT-2026-001)
 */
async function generateQuoteNumber(userId: string): Promise<string> {
    const year = new Date().getFullYear()
    const prefix = `COT-${year}-`

    // Cuenta las cotizaciones de este año para el usuario
    const count = await prisma.quote.count({
        where: {
            deal: { userId },
            quoteNumber: { startsWith: prefix },
        },
    })

    const sequence = String(count + 1).padStart(3, "0")
    return `${prefix}${sequence}`
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

// GET /api/cotizaciones — Lista cotizaciones del usuario autenticado
export async function GET(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const dealId = searchParams.get("dealId")
        const status = searchParams.get("status")

        const quotes = await prisma.quote.findMany({
            where: {
                deal: { userId: session.user.id },
                ...(dealId && { dealId }),
                ...(status && { status: status as any }),
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
            orderBy: { createdAt: "desc" },
        })

        return NextResponse.json(quotes)
    } catch (error) {
        console.error("Error fetching quotes:", error)
        return NextResponse.json({ error: "Error al obtener cotizaciones" }, { status: 500 })
    }
}

// POST /api/cotizaciones — Crea una nueva cotización
export async function POST(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 })
        }

        const body = await request.json()
        const validatedData = createQuoteSchema.parse(body)
        const { dealId, items, taxRate, validUntil, notes } = validatedData

        // Verificar que el deal pertenece al usuario
        const deal = await prisma.deal.findFirst({
            where: { id: dealId, userId: session.user.id },
        })
        if (!deal) {
            return NextResponse.json({ error: "Deal no encontrado" }, { status: 404 })
        }

        // Calcular totales en servidor
        const { subtotal, tax, total } = calculateTotals(items, taxRate ?? 16)

        // Generar número de cotización
        const quoteNumber = await generateQuoteNumber(session.user.id)

        // Preparar ítems con total calculado
        const processedItems = items.map((item) => ({
            ...item,
            total: item.quantity * item.unitPrice,
        }))

        const quote = await prisma.quote.create({
            data: {
                dealId,
                quoteNumber,
                items: processedItems,
                subtotal,
                tax,
                total,
                validUntil: validUntil ? new Date(`${validUntil}T12:00:00Z`) : null,
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

        return NextResponse.json(quote, { status: 201 })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Datos inválidos", details: error.errors }, { status: 400 })
        }
        console.error("Error creating quote:", error)
        return NextResponse.json({ error: "Error al crear cotización" }, { status: 500 })
    }
}
