import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createQuoteSchema } from "@/lib/validations/quote"
import { isSameOrigin } from "@/lib/http/same-origin"

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

/**
 * Genera el próximo número de cotización para el usuario.
 * Formato: COT-YYYY-NNN (ej: COT-2026-001)
 */
async function generateQuoteNumber(userId: string): Promise<string> {
    const year = new Date().getFullYear()
    const prefix = `COT-${year}-`

    return await prisma.$transaction(async (tx) => {
        for (let attempt = 0; attempt < 10; attempt++) {
            const lastQuote = await tx.quote.findFirst({
                where: {
                    deal: { userId },
                    quoteNumber: { startsWith: prefix },
                },
                orderBy: { quoteNumber: "desc" },
            })

            const sequence = lastQuote
                ? parseInt(lastQuote.quoteNumber.split("-")[2], 10) + 1
                : 1

            const candidate = `${prefix}${String(sequence).padStart(3, "0")}`

            const exists = await tx.quote.findUnique({
                where: { quoteNumber: candidate },
                select: { id: true },
            })

            if (!exists) return candidate
        }

        throw new Error("No se pudo generar número de cotización único")
    })
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

        const validStatuses = ["BORRADOR", "ENVIADA", "ACEPTADA", "RECHAZADA"] as const
        type QuoteStatus = (typeof validStatuses)[number]

        const statusFilter =
            status && validStatuses.includes(status as QuoteStatus)
                ? (status as QuoteStatus)
                : null

        const quotes = await prisma.quote.findMany({
            where: {
                deal: { userId: session.user.id },
                ...(dealId && { dealId }),
                ...(statusFilter && { status: statusFilter }),
            },
            select: quoteSelect,
            orderBy: { createdAt: "desc" },
        })

        return NextResponse.json(quotes, { headers: noStoreHeaders })
    } catch (error) {
        console.error("Error fetching quotes:", error)
        return NextResponse.json({ error: "Error al obtener cotizaciones" }, { status: 500 })
    }
}

// POST /api/cotizaciones — Crea una nueva cotización
export async function POST(request: NextRequest) {
    if (!isSameOrigin(request)) {
        return NextResponse.json({ error: "Origen no permitido" }, { status: 403 })
    }

    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const parsed = createQuoteSchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
        return NextResponse.json(
            { error: "Datos inválidos", details: parsed.error.flatten() },
            { status: 400 }
        )
    }

    const { dealId, items, taxRate, validUntil, notes } = parsed.data

    const deal = await prisma.deal.findFirst({
        where: { id: dealId, userId: session.user.id },
        select: { id: true },
    })
    if (!deal) {
        return NextResponse.json({ error: "Deal no encontrado" }, { status: 404 })
    }

    const { subtotal, tax, total } = calculateTotals(items, taxRate ?? 16)
    const processedItems = items.map((item) => ({
        ...item,
        total: item.quantity * item.unitPrice,
    }))

    const maxRetries = 3
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const quoteNumber = await generateQuoteNumber(session.user.id)

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
                select: quoteSelect,
            })

            return NextResponse.json(quote, { status: 201 })
        } catch (error) {
            const prismaError = error as { code?: string }
            if (prismaError.code === "P2002" && attempt < maxRetries - 1) {
                continue
            }
            console.error("Error creating quote:", error)
            return NextResponse.json({ error: "Error al crear cotización" }, { status: 500 })
        }
    }

    return NextResponse.json({ error: "Error al crear cotización" }, { status: 500 })
}
