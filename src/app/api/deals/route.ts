import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 })
        }

        const deals = await prisma.deal.findMany({
            where: { userId: session.user.id },
            include: {
                contact: { select: { firstName: true, lastName: true } },
                company: { select: { name: true } },
                quotes: { orderBy: { createdAt: "desc" } },
            },
            orderBy: { createdAt: "desc" },
        })

        return NextResponse.json(deals)
    } catch (error) {
        return NextResponse.json({ error: "Error al obtener deals" }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 })
        }

        const data = await request.json()
        const deal = await prisma.deal.create({
            data: {
                ...data,
                userId: session.user.id,
                contactId: data.contactId || null,
                companyId: data.companyId || null,
                expectedCloseDate: data.expectedCloseDate ? new Date(data.expectedCloseDate) : null,
            },
        })

        return NextResponse.json(deal, { status: 201 })
    } catch (error) {
        return NextResponse.json({ error: "Error al crear deal" }, { status: 500 })
    }
}
