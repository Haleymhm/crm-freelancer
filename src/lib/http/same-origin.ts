import "server-only"
import type { NextRequest } from "next/server"

/**
 * Verifica que la petición mutante provenga del mismo origen (protección CSRF).
 */
export function isSameOrigin(request: NextRequest): boolean {
    const origin = request.headers.get("origin")
    const host = request.headers.get("host")
    const fetchSite = request.headers.get("sec-fetch-site")

    if (fetchSite && fetchSite !== "same-origin") return false
    if (!origin || !host) return false

    try {
        return new URL(origin).host === host
    } catch {
        return false
    }
}
