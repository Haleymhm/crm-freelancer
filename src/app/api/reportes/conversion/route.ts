import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getDealsConversion } from "@/lib/dashboard-data"

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

        const data = await getDealsConversion(session.user.id)
        return NextResponse.json(data, { headers: noStoreHeaders })
    } catch (error) {
        console.error("report_conversion_failed", error)
        return NextResponse.json({ error: "Error al obtener conversión" }, { status: 500 })
    }
}
