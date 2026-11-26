import { NextRequest, NextResponse } from "next/server"
import { handlers } from "@/lib/auth"
import { authRouteLimiter } from "@/lib/rate-limit"

export const GET = handlers.GET

export async function POST(request: NextRequest) {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
    const { success } = await authRouteLimiter.limit(ip)

    if (!success) {
        return NextResponse.json(
            { error: "Demasiadas solicitudes. Intenta más tarde." },
            { status: 429 }
        )
    }

    return handlers.POST(request)
}
