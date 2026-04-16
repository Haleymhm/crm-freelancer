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

        const company = await prisma.company.findFirst({
            where: { id, userId: session.user.id },
        })

        if (!company) {
            return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 })
        }

        return NextResponse.json(company)
    } catch (error) {
        console.error("Error fetching company:", error)
        return NextResponse.json({ error: "Error al obtener empresa" }, { status: 500 })
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
        const { name, email, phone, website, address } = data

        const company = await prisma.company.updateMany({
            where: { id, userId: session.user.id },
            data: {
                name,
                email: email || null,
                phone: phone || null,
                website: website || null,
                address: address || null,
            },
        })

        if (company.count === 0) {
            return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error updating company:", error)
        return NextResponse.json({ error: "Error al actualizar empresa" }, { status: 500 })
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

        const company = await prisma.company.deleteMany({
            where: { id, userId: session.user.id },
        })

        if (company.count === 0) {
            return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 })
        }

        return NextResponse.json({ success: true, message: "Empresa eliminada" })
    } catch (error) {
        console.error("Error deleting company:", error)
        return NextResponse.json({ error: "Error al eliminar empresa" }, { status: 500 })
    }
}
