import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createDealSchema } from "@/lib/validations/deal"
import { isSameOrigin } from "@/lib/http/same-origin"

const noStoreHeaders = {
    "Cache-Control": "no-store, max-age=0",
    Vary: "Cookie",
}

export async function GET() {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 })
        }

        const deals = await prisma.deal.findMany({
            where: { userId: session.user.id },
            select: {
                id: true,
                title: true,
                description: true,
                value: true,
                stage: true,
                clientId: true,
                expectedCloseDate: true,
                closedAt: true,
                createdAt: true,
                updatedAt: true,
                client: { select: { id: true, name: true, type: true } },
                quotes: {
                    select: {
                        id: true,
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
                    },
                    orderBy: { createdAt: "desc" },
                },
            },
            orderBy: { createdAt: "desc" },
        })

        return NextResponse.json(deals, { headers: noStoreHeaders })
    } catch (error) {
        console.error("deals_fetch_failed", error)
        return NextResponse.json({ error: "Error al obtener deals" }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        if (!isSameOrigin(request)) {
            return NextResponse.json({ error: "Origen no permitido" }, { status: 403 })
        }

        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 })
        }

        const parsed = createDealSchema.safeParse(await request.json().catch(() => null))
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Datos inválidos", details: parsed.error.flatten() },
                { status: 400 }
            )
        }

        let clientId: string | null = null
        if (parsed.data.clientId && parsed.data.clientId !== "none") {
            const ownedClient = await prisma.client.findFirst({
                where: { id: parsed.data.clientId, userId: session.user.id },
                select: { id: true },
            })
            if (!ownedClient) {
                return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 })
            }
            clientId = ownedClient.id
        }

        const deal = await prisma.deal.create({
            data: {
                title: parsed.data.title,
                description: parsed.data.description || null,
                value: parsed.data.value,
                stage: parsed.data.stage,
                userId: session.user.id,
                clientId,
                expectedCloseDate: parsed.data.expectedCloseDate
                    ? new Date(`${parsed.data.expectedCloseDate}T12:00:00Z`)
                    : null,
                closedAt: parsed.data.stage.startsWith("CERRADO") ? new Date() : null,
            },
            select: {
                id: true,
                title: true,
                description: true,
                value: true,
                stage: true,
                clientId: true,
                expectedCloseDate: true,
                closedAt: true,
                createdAt: true,
            },
        })

        return NextResponse.json(deal, { status: 201 })
    } catch (error) {
        console.error("deal_create_failed", error)
        return NextResponse.json({ error: "Error al crear deal" }, { status: 500 })
    }
}
