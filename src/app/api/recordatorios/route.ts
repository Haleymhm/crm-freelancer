import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createReminderSchema } from "@/lib/validations/reminder"
import { isSameOrigin } from "@/lib/http/same-origin"
import { readJsonBody } from "@/lib/http/request"

const noStoreHeaders = {
    "Cache-Control": "no-store, max-age=0",
    Vary: "Cookie",
}

const reminderSelect = {
    id: true,
    dealId: true,
    message: true,
    dueDate: true,
    completed: true,
    completedAt: true,
    createdAt: true,
    updatedAt: true,
    deal: { select: { id: true, title: true } },
}

export async function GET() {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 })
        }

        const reminders = await prisma.reminder.findMany({
            where: { userId: session.user.id },
            select: reminderSelect,
            orderBy: { dueDate: "asc" },
        })

        return NextResponse.json(reminders, { headers: noStoreHeaders })
    } catch (error) {
        console.error("reminders_fetch_failed", error)
        return NextResponse.json({ error: "Error al obtener recordatorios" }, { status: 500 })
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

        const parsed = createReminderSchema.safeParse(bodyResult.data)
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Datos inválidos", details: parsed.error.flatten() },
                { status: 400 }
            )
        }

        const { dealId, message, dueDate, completed } = parsed.data

        const deal = await prisma.deal.findFirst({
            where: { id: dealId, userId: session.user.id },
            select: { id: true },
        })
        if (!deal) {
            return NextResponse.json({ error: "Deal no encontrado" }, { status: 404 })
        }

        const reminder = await prisma.reminder.create({
            data: {
                dealId: deal.id,
                userId: session.user.id,
                message,
                dueDate: new Date(dueDate),
                completed: Boolean(completed),
                completedAt: completed ? new Date() : null,
            },
            select: reminderSelect,
        })

        return NextResponse.json(reminder, { status: 201 })
    } catch (error) {
        console.error("reminder_create_failed", error)
        return NextResponse.json({ error: "Error al crear recordatorio" }, { status: 500 })
    }
}
