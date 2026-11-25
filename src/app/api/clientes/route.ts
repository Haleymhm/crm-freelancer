import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { clientSchema } from "@/lib/validations/client"
import { z } from "zod"
import type { ClientType } from "@prisma/client"

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
            orderBy: { createdAt: "desc" },
        })

        return NextResponse.json(clients)
    } catch (error) {
        console.error("Error fetching clients:", error)
        return NextResponse.json({ error: "Error al obtener clientes" }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 })
        }

        const data = await request.json()
        const validatedData = clientSchema.parse(data)
        const { type, name, taxId, email, phone, contactName, website, address, notes } = validatedData

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
        })

        return NextResponse.json(client, { status: 201 })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Datos inválidos", details: error.errors }, { status: 400 })
        }
        console.error("Error creating client:", error)
        return NextResponse.json({ error: "Error al crear cliente" }, { status: 500 })
    }
}
