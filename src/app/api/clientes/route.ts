import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { clientSchema } from "@/lib/validations/client"
import { isSameOrigin } from "@/lib/http/same-origin"
import type { ClientType } from "@prisma/client"

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

export async function GET(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const typeParam = searchParams.get("type")
        const validTypes: ClientType[] = ["PERSONA", "EMPRESA"]
        const typeFilter =
            typeParam && validTypes.includes(typeParam as ClientType)
                ? (typeParam as ClientType)
                : undefined

        const clients = await prisma.client.findMany({
            where: {
                userId: session.user.id,
                ...(typeFilter && { type: typeFilter }),
            },
            select: clientSelect,
            orderBy: { createdAt: "desc" },
        })

        return NextResponse.json(clients, { headers: noStoreHeaders })
    } catch (error) {
        console.error("Error fetching clients:", error)
        return NextResponse.json({ error: "Error al obtener clientes" }, { status: 500 })
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

        const parsed = clientSchema.safeParse(await request.json().catch(() => null))
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Datos inválidos", details: parsed.error.flatten() },
                { status: 400 }
            )
        }

        const { type, name, taxId, email, phone, contactName, website, address, notes } = parsed.data

        const client = await prisma.client.create({
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
                userId: session.user.id,
            },
            select: clientSelect,
        })

        return NextResponse.json(client, { status: 201 })
    } catch (error) {
        console.error("Error creating client:", error)
        return NextResponse.json({ error: "Error al crear cliente" }, { status: 500 })
    }
}
