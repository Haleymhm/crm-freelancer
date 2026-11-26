import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { isSameOrigin } from "@/lib/http/same-origin"

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
        const deleted = await prisma.interaction.deleteMany({
            where: { id, userId: session.user.id },
        })

        if (deleted.count === 0) {
            return NextResponse.json({ error: "Interacción no encontrada" }, { status: 404 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("interaction_delete_failed", error)
        return NextResponse.json({ error: "Error al eliminar interacción" }, { status: 500 })
    }
}
