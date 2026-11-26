import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { interactionSchema } from "@/lib/validations/interaction"
import { isSameOrigin } from "@/lib/http/same-origin"
import { readJsonBody } from "@/lib/http/request"

const noStoreHeaders = {
    "Cache-Control": "no-store, max-age=0",
    Vary: "Cookie",
}

const interactionSelect = {
    id: true,
    type: true,
    subject: true,
    notes: true,
    clientId: true,
    dealId: true,
    interactionDate: true,
    createdAt: true,
    client: { select: { id: true, name: true, type: true } },
    deal: { select: { id: true, title: true } },
}

export async function GET() {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 })
        }

        const interactions = await prisma.interaction.findMany({
            where: { userId: session.user.id },
            select: interactionSelect,
            orderBy: { interactionDate: "desc" },
        })

        return NextResponse.json(interactions, { headers: noStoreHeaders })
    } catch (error) {
        console.error("interactions_fetch_failed", error)
        return NextResponse.json({ error: "Error al obtener interacciones" }, { status: 500 })
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

        const bodyResult = await readJsonBody(request)
        if (!bodyResult.ok) return bodyResult.response

        const parsed = interactionSchema.safeParse(bodyResult.data)
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Datos inválidos", details: parsed.error.flatten() },
                { status: 400 }
            )
        }

        const { type, subject, notes, clientId, dealId, interactionDate } = parsed.data

        let verifiedClientId: string | null = null
        if (clientId && clientId !== "none") {
            const client = await prisma.client.findFirst({
                where: { id: clientId, userId: session.user.id },
                select: { id: true },
            })
            if (!client) {
                return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 })
            }
            verifiedClientId = client.id
        }

        let verifiedDealId: string | null = null
        if (dealId && dealId !== "none") {
            const deal = await prisma.deal.findFirst({
                where: { id: dealId, userId: session.user.id },
                select: { id: true },
            })
            if (!deal) {
                return NextResponse.json({ error: "Deal no encontrado" }, { status: 404 })
            }
            verifiedDealId = deal.id
        }

        const interaction = await prisma.interaction.create({
            data: {
                type,
                subject: subject || null,
                notes: notes || null,
                clientId: verifiedClientId,
                dealId: verifiedDealId,
                userId: session.user.id,
                interactionDate: interactionDate ? new Date(interactionDate) : new Date(),
            },
            select: interactionSelect,
        })

        return NextResponse.json(interaction, { status: 201 })
    } catch (error) {
        console.error("interaction_create_failed", error)
        return NextResponse.json({ error: "Error al crear interacción" }, { status: 500 })
    }
}
