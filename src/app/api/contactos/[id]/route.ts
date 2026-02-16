import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 })
        }

        const { id } = await params

        const contact = await prisma.contact.findFirst({
            where: {
                id,
                userId: session.user.id,
            },
            include: {
                company: true,
            },
        })

        if (!contact) {
            return NextResponse.json({ error: "Contacto no encontrado" }, { status: 404 })
        }

        return NextResponse.json(contact)
    } catch (error) {
        console.error("Error fetching contact:", error)
        return NextResponse.json({ error: "Error al obtener contacto" }, { status: 500 })
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
        const { firstName, lastName, email, phone, position, companyId } = data

        const contact = await prisma.contact.updateMany({
            where: {
                id,
                userId: session.user.id,
            },
            data: {
                firstName,
                lastName,
                email: email || null,
                phone: phone || null,
                position: position || null,
                companyId: companyId || null,
            },
        })

        if (contact.count === 0) {
            return NextResponse.json({ error: "Contacto no encontrado" }, { status: 404 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error updating contact:", error)
        return NextResponse.json({ error: "Error al actualizar contacto" }, { status: 500 })
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

        const contact = await prisma.contact.deleteMany({
            where: {
                id,
                userId: session.user.id,
            },
        })

        if (contact.count === 0) {
            return NextResponse.json({ error: "Contacto no encontrado" }, { status: 404 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error deleting contact:", error)
        return NextResponse.json({ error: "Error al eliminar contacto" }, { status: 500 })
    }
}
