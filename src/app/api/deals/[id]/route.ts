import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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
        const data = await request.json()

        const updateData: any = {}
        if (data.stage !== undefined) {
            updateData.stage = data.stage
            if (data.stage.startsWith("CERRADO")) updateData.closedAt = new Date()
        }
        if (data.title !== undefined) updateData.title = data.title
        if (data.description !== undefined) updateData.description = data.description
        if (data.value !== undefined) updateData.value = data.value
        if (data.contactId !== undefined) updateData.contactId = data.contactId || null
        if (data.companyId !== undefined) updateData.companyId = data.companyId || null

        const deal = await prisma.deal.updateMany({
            where: { id, userId: session.user.id },
            data: updateData,
        })

        if (deal.count === 0) {
            return NextResponse.json({ error: "Deal no encontrado" }, { status: 404 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: "Error al actualizar deal" }, { status: 500 })
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 })
        }

        const { id } = await params

        const deal = await prisma.deal.deleteMany({
            where: { id, userId: session.user.id },
        })

        if (deal.count === 0) {
            return NextResponse.json({ error: "Deal no encontrado" }, { status: 404 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: "Error al eliminar deal" }, { status: 500 })
    }
}
