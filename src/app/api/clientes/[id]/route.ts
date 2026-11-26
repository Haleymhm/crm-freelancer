import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { clientSchema } from "@/lib/validations/client"
import { isSameOrigin } from "@/lib/http/same-origin"

const noStoreHeaders = {
    "Cache-Control": "no-store, max-age=0",
    Vary: "Cookie",
}

const clientSelect = {
    id: true,
    type: true,
    name: true,
    taxId: true,
    email: true,
    phone: true,
    contactName: true,
    website: true,
    address: true,
    notes: true,
    createdAt: true,
    updatedAt: true,
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

        const client = await prisma.client.findFirst({
            where: {
                id,
                userId: session.user.id,
            },
            select: clientSelect,
        })

        if (!client) {
            return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 })
        }

        return NextResponse.json(client, { headers: noStoreHeaders })
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
        if (!isSameOrigin(request)) {
            return NextResponse.json({ error: "Origen no permitido" }, { status: 403 })
        }

        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 })
        }

        const { id } = await params
        const parsed = clientSchema.safeParse(await request.json().catch(() => null))
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Datos inválidos", details: parsed.error.flatten() },
                { status: 400 }
            )
        }

        const { type, name, taxId, email, phone, contactName, website, address, notes } = parsed.data

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
        console.error("Error updating client:", error)
        return NextResponse.json({ error: "Error al actualizar cliente" }, { status: 500 })
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
