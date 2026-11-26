import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"
import { updateDealSchema } from "@/lib/validations/deal"
import { isSameOrigin } from "@/lib/http/same-origin"

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const session = await auth()

    try {
        if (!isSameOrigin(request)) {
            return NextResponse.json({ error: "Origen no permitido" }, { status: 403 })
        }

        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 })
        }

        const parsed = updateDealSchema.safeParse(await request.json().catch(() => null))
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Datos inválidos", details: parsed.error.flatten() },
                { status: 400 }
            )
        }

        const updateData: Prisma.DealUncheckedUpdateInput = {}
        if (parsed.data.stage !== undefined) {
            updateData.stage = parsed.data.stage
            updateData.closedAt = parsed.data.stage.startsWith("CERRADO") ? new Date() : null
        }
        if (parsed.data.title !== undefined) updateData.title = parsed.data.title
        if (parsed.data.description !== undefined) {
            updateData.description = parsed.data.description || null
        }
        if (parsed.data.value !== undefined) updateData.value = parsed.data.value
        if (parsed.data.expectedCloseDate !== undefined) {
            updateData.expectedCloseDate = parsed.data.expectedCloseDate
                ? new Date(`${parsed.data.expectedCloseDate}T12:00:00Z`)
                : null
        }
        if (parsed.data.clientId !== undefined) {
            if (parsed.data.clientId && parsed.data.clientId !== "none") {
                const ownedClient = await prisma.client.findFirst({
                    where: { id: parsed.data.clientId, userId: session.user.id },
                    select: { id: true },
                })
                if (!ownedClient) {
                    return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 })
                }
                updateData.clientId = ownedClient.id
            } else {
                updateData.clientId = null
            }
        }

        await prisma.deal.update({
            where: { id, userId: session.user.id },
            data: updateData,
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === "P2025") {
                return NextResponse.json({ error: "Deal no encontrado" }, { status: 404 })
            }
            if (error.code === "P2003") {
                return NextResponse.json({ error: "Referencia inválida" }, { status: 400 })
            }
        }

        console.error("deal_update_failed", {
            dealId: id,
            userId: session?.user?.id,
            error,
        })

        return NextResponse.json(
            { error: "No se pudo actualizar la oportunidad" },
            { status: 500 }
        )
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const session = await auth()

    try {
        if (!isSameOrigin(request)) {
            return NextResponse.json({ error: "Origen no permitido" }, { status: 403 })
        }

        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 })
        }

        const deal = await prisma.deal.deleteMany({
            where: { id, userId: session.user.id },
        })

        if (deal.count === 0) {
            return NextResponse.json({ error: "Deal no encontrado" }, { status: 404 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("deal_delete_failed", {
            dealId: id,
            userId: session?.user?.id,
            error,
        })
        return NextResponse.json(
            { error: "Error al eliminar la oportunidad" },
            { status: 500 }
        )
    }
}
