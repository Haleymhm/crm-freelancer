import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getDealsByStage } from "@/lib/dashboard-data"

const noStoreHeaders = {
    "Cache-Control": "no-store, max-age=0",
    Vary: "Cookie",
}

export async function GET() {
    try {
        const session = await auth()
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 })
        }

        const raw = await getDealsByStage(session.user.id)
        const data = raw.map((item) => ({
            stage: item.stage,
            count: item._count.id,
            value: Number(item._sum.value || 0),
        }))

        return NextResponse.json(data, { headers: noStoreHeaders })
    } catch (error) {
        console.error("report_stages_failed", error)
        return NextResponse.json({ error: "Error al obtener etapas" }, { status: 500 })
    }
}
