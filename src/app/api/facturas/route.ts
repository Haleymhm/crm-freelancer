import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createInvoiceSchema } from "@/lib/validations/invoice"
import { isSameOrigin } from "@/lib/http/same-origin"
import { readJsonBody } from "@/lib/http/request"
import { mutationLimiter } from "@/lib/rate-limit"

const noStoreHeaders = {
    "Cache-Control": "no-store, max-age=0",
    Vary: "Cookie",
}

const invoiceSelect = {
    id: true,
    dealId: true,
    quoteId: true,
    invoiceNumber: true,
    status: true,
    items: true,
    subtotal: true,
    tax: true,
    total: true,
    dueDate: true,
    paidAt: true,
    notes: true,
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

async function generateInvoiceNumber(userId: string): Promise<string> {
    const year = new Date().getFullYear()
    const prefix = `FAC-${year}-`

    return await prisma.$transaction(async (tx) => {
        for (let attempt = 0; attempt < 10; attempt++) {
            const lastInvoice = await tx.invoice.findFirst({
                where: {
                    deal: { userId },
                    invoiceNumber: { startsWith: prefix },
                },
                orderBy: { invoiceNumber: "desc" },
            })

            const sequence = lastInvoice
                ? parseInt(lastInvoice.invoiceNumber.split("-")[2], 10) + 1
                : 1

            const candidate = `${prefix}${String(sequence).padStart(3, "0")}`
            const exists = await tx.invoice.findUnique({
                where: { invoiceNumber: candidate },
                select: { id: true },
            })

            if (!exists) return candidate
        }

        throw new Error("No se pudo generar número de factura único")
    })
}

export async function GET() {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 })
        }

        const invoices = await prisma.invoice.findMany({
            where: { deal: { userId: session.user.id } },
            select: invoiceSelect,
            orderBy: { createdAt: "desc" },
        })

        return NextResponse.json(invoices, { headers: noStoreHeaders })
    } catch (error) {
        console.error("invoices_fetch_failed", error)
        return NextResponse.json({ error: "Error al obtener facturas" }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    if (!isSameOrigin(request)) {
        return NextResponse.json({ error: "Origen no permitido" }, { status: 403 })
    }

    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { success } = await mutationLimiter.limit(`inv:${session.user.id}`)
    if (!success) {
        return NextResponse.json({ error: "Demasiadas solicitudes" }, { status: 429 })
    }

    const bodyResult = await readJsonBody(request)
    if (!bodyResult.ok) return bodyResult.response

    const parsed = createInvoiceSchema.safeParse(bodyResult.data)
    if (!parsed.success) {
        return NextResponse.json(
            { error: "Datos inválidos", details: parsed.error.flatten() },
            { status: 400 }
        )
    }

    const { dealId, quoteId, items, taxRate, dueDate, notes, status } = parsed.data

    const deal = await prisma.deal.findFirst({
        where: { id: dealId, userId: session.user.id },
        select: { id: true },
    })
    if (!deal) {
        return NextResponse.json({ error: "Deal no encontrado" }, { status: 404 })
    }

    let verifiedQuoteId: string | null = null
    if (quoteId && quoteId !== "none") {
        const quote = await prisma.quote.findFirst({
            where: { id: quoteId, deal: { userId: session.user.id } },
            select: { id: true },
        })
        if (!quote) {
            return NextResponse.json({ error: "Cotización no encontrada" }, { status: 404 })
        }
        verifiedQuoteId = quote.id
    }

    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
    const tax = subtotal * ((taxRate ?? 16) / 100)
    const total = subtotal + tax
    const processedItems = items.map((item) => ({
        ...item,
        total: item.quantity * item.unitPrice,
    }))

    try {
        const invoiceNumber = await generateInvoiceNumber(session.user.id)
        const invoice = await prisma.invoice.create({
            data: {
                dealId: deal.id,
                quoteId: verifiedQuoteId,
                invoiceNumber,
                items: processedItems,
                subtotal,
                tax,
                total,
                status,
                dueDate: new Date(`${dueDate}T12:00:00Z`),
                paidAt: status === "PAGADA" ? new Date() : null,
                notes: notes || null,
            },
            select: invoiceSelect,
        })

        return NextResponse.json(invoice, { status: 201 })
    } catch (error) {
        console.error("invoice_create_failed", error)
        return NextResponse.json({ error: "Error al crear factura" }, { status: 500 })
    }
}
