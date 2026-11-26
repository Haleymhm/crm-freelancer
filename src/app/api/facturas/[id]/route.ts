import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { isSameOrigin } from "@/lib/http/same-origin"
import { readJsonBody } from "@/lib/http/request"
import { z } from "zod"

const invoiceStatusSchema = z.enum(["PENDIENTE", "PAGADA", "VENCIDA", "CANCELADA"])
type InvoiceStatus = z.infer<typeof invoiceStatusSchema>

const allowedTransitions: Record<InvoiceStatus, readonly InvoiceStatus[]> = {
    PENDIENTE: ["PAGADA", "VENCIDA", "CANCELADA"],
    VENCIDA: ["PAGADA", "CANCELADA"],
    PAGADA: [],
    CANCELADA: [],
}

const patchInvoiceSchema = z
    .object({
        status: invoiceStatusSchema,
        paidAt: z.string().optional(),
    })
    .strict()

const noStoreHeaders = {
    "Cache-Control": "no-store, max-age=0",
    Vary: "Cookie",
}

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
        const invoice = await prisma.invoice.findFirst({
            where: { id, deal: { userId: session.user.id } },
            select: {
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
            },
        })

        if (!invoice) {
            return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 })
        }

        return NextResponse.json(invoice, { headers: noStoreHeaders })
    } catch (error) {
        console.error("invoice_get_failed", error)
        return NextResponse.json({ error: "Error al obtener factura" }, { status: 500 })
    }
}

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
        const bodyResult = await readJsonBody(request)
        if (!bodyResult.ok) return bodyResult.response

        const parsed = patchInvoiceSchema.safeParse(bodyResult.data)
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Datos inválidos", details: parsed.error.flatten() },
                { status: 400 }
            )
        }

        const existing = await prisma.invoice.findFirst({
            where: { id, deal: { userId: session.user.id } },
            select: { id: true, status: true },
        })

        if (!existing) {
            return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 })
        }

        const nextStatus = parsed.data.status
        if (!allowedTransitions[existing.status as InvoiceStatus].includes(nextStatus)) {
            return NextResponse.json(
                { error: "Transición de estado no permitida" },
                { status: 409 }
            )
        }

        const updated = await prisma.invoice.update({
            where: { id },
            data: {
                status: nextStatus,
                paidAt: nextStatus === "PAGADA" ? new Date() : null,
            },
            select: {
                id: true,
                status: true,
                paidAt: true,
            },
        })

        return NextResponse.json(updated)
    } catch (error) {
        console.error("invoice_patch_failed", error)
        return NextResponse.json({ error: "Error al actualizar factura" }, { status: 500 })
    }
}

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
        const existing = await prisma.invoice.findFirst({
            where: { id, deal: { userId: session.user.id } },
            select: { id: true },
        })

        if (!existing) {
            return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 })
        }

        await prisma.invoice.delete({ where: { id } })
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("invoice_delete_failed", error)
        return NextResponse.json({ error: "Error al eliminar factura" }, { status: 500 })
    }
}
