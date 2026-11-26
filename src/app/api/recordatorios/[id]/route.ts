import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { updateReminderSchema } from "@/lib/validations/reminder"
import { isSameOrigin } from "@/lib/http/same-origin"
import { readJsonBody } from "@/lib/http/request"

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

        const parsed = updateReminderSchema.safeParse(bodyResult.data)
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Datos inválidos", details: parsed.error.flatten() },
                { status: 400 }
            )
        }

        const updated = await prisma.reminder.updateMany({
            where: { id, userId: session.user.id },
            data: {
                ...(parsed.data.message !== undefined && { message: parsed.data.message }),
                ...(parsed.data.dueDate !== undefined && { dueDate: new Date(parsed.data.dueDate) }),
                ...(parsed.data.completed !== undefined && {
                    completed: parsed.data.completed,
                    completedAt: parsed.data.completed ? new Date() : null,
                }),
            },
        })

        if (updated.count === 0) {
            return NextResponse.json({ error: "Recordatorio no encontrado" }, { status: 404 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("reminder_patch_failed", error)
        return NextResponse.json({ error: "Error al actualizar recordatorio" }, { status: 500 })
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
        const deleted = await prisma.reminder.deleteMany({
            where: { id, userId: session.user.id },
        })

        if (deleted.count === 0) {
            return NextResponse.json({ error: "Recordatorio no encontrado" }, { status: 404 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("reminder_delete_failed", error)
        return NextResponse.json({ error: "Error al eliminar recordatorio" }, { status: 500 })
    }
}
