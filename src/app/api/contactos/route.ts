import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { contactSchema } from "@/lib/validations/contact"
import { z } from "zod"

export async function GET() {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 })
        }

        const contacts = await prisma.contact.findMany({
            where: { userId: session.user.id },
            include: {
                company: {
                    select: {
                        name: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        })

        return NextResponse.json(contacts)
    } catch (error) {
        console.error("Error fetching contacts:", error)
        return NextResponse.json({ error: "Error al obtener contactos" }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 })
        }

        const data = await request.json()
        const validatedData = contactSchema.parse(data)
        const { firstName, lastName, email, phone, position, companyId } = validatedData

        const contact = await prisma.contact.create({
            data: {
                firstName,
                lastName,
                email: email || null,
                phone: phone || null,
                position: position || null,
                companyId: companyId === "none" ? null : companyId || null,
                userId: session.user.id,
            },
        })

        return NextResponse.json(contact, { status: 201 })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Datos inválidos", details: error.errors }, { status: 400 })
        }
        console.error("Error creating contact:", error)
        return NextResponse.json({ error: "Error al crear contacto" }, { status: 500 })
    }
}
