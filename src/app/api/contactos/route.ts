import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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
        const { firstName, lastName, email, phone, position, companyId } = data

        const contact = await prisma.contact.create({
            data: {
                firstName,
                lastName,
                email: email || null,
                phone: phone || null,
                position: position || null,
                companyId: companyId || null,
                userId: session.user.id,
            },
        })

        return NextResponse.json(contact, { status: 201 })
    } catch (error) {
        console.error("Error creating contact:", error)
        return NextResponse.json({ error: "Error al crear contacto" }, { status: 500 })
    }
}
