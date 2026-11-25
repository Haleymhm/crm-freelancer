import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { clientSchema } from "@/lib/validations/client"
import { z } from "zod"

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

        const client = await prisma.client.findFirst({
            where: {
                id,
                userId: session.user.id,
            },
        })

        if (!client) {
            return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 })
        }

        return NextResponse.json(client)
    } catch (error) {
        console.error("Error fetching client:", error)
        return NextResponse.json({ error: "Error al obtener cliente" }, { status: 500 })
    }
}

export async function PUT(
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
        const validatedData = clientSchema.parse(data)
        const { type, name, taxId, email, phone, contactName, website, address, notes } = validatedData

        const client = await prisma.client.updateMany({
            where: {
                id,
                userId: session.user.id,
            },
            data: {
                type,
                name,
                taxId: taxId || null,
                email: email || null,
                phone: phone || null,
                contactName: type === "EMPRESA" ? contactName || null : null,
                website: website || null,
                address: address || null,
                notes: notes || null,
            },
        })

        if (client.count === 0) {
            return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Datos inválidos", details: error.errors }, { status: 400 })
        }
        console.error("Error updating client:", error)
        return NextResponse.json({ error: "Error al actualizar cliente" }, { status: 500 })
    }
}

export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 })
        }

        const { id } = await params

        const client = await prisma.client.deleteMany({
            where: {
                id,
                userId: session.user.id,
            },
        })

        if (client.count === 0) {
            return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 })
        }

        return NextResponse.json({ success: true, message: "Cliente eliminado" })
    } catch (error) {
        console.error("Error deleting client:", error)
        return NextResponse.json({ error: "Error al eliminar cliente" }, { status: 500 })
    }
}
