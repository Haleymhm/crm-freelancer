import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 })
        }

        const companies = await prisma.company.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: "desc" },
        })

        return NextResponse.json(companies)
    } catch (error) {
        console.error("Error fetching companies:", error)
        return NextResponse.json({ error: "Error al obtener empresas" }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 })
        }

        const data = await request.json()
        const { name, email, phone, website, address } = data

        const company = await prisma.company.create({
            data: {
                name,
                email: email || null,
                phone: phone || null,
                website: website || null,
                address: address || null,
                userId: session.user.id,
            },
        })

        return NextResponse.json(company, { status: 201 })
    } catch (error) {
        console.error("Error creating company:", error)
        return NextResponse.json({ error: "Error al crear empresa" }, { status: 500 })
    }
}
