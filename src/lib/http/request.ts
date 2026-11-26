import "server-only"
import { NextRequest, NextResponse } from "next/server"

const DEFAULT_MAX_BYTES = 1_048_576 // 1 MB

type ParseResult =
    | { ok: true; data: unknown }
    | { ok: false; response: NextResponse }

/**
 * Lee y parsea el cuerpo JSON validando el tamaño máximo permitido (por defecto 1 MB).
 */
export async function readJsonBody(
    request: NextRequest,
    maxBytes: number = DEFAULT_MAX_BYTES
): Promise<ParseResult> {
    const contentLengthHeader = request.headers.get("content-length")
    if (contentLengthHeader) {
        const declaredSize = Number(contentLengthHeader)
        if (Number.isFinite(declaredSize) && declaredSize > maxBytes) {
            return {
                ok: false,
                response: NextResponse.json(
                    { error: "El tamaño de la solicitud excede el límite permitido" },
                    { status: 413 }
                ),
            }
        }
    }

    try {
        const raw = await request.text()
        if (Buffer.byteLength(raw, "utf8") > maxBytes) {
            return {
                ok: false,
                response: NextResponse.json(
                    { error: "El tamaño de la solicitud excede el límite permitido" },
                    { status: 413 }
                ),
            }
        }
        return { ok: true, data: raw ? JSON.parse(raw) : null }
    } catch {
        return {
            ok: false,
            response: NextResponse.json({ error: "JSON inválido" }, { status: 400 }),
        }
    }
}
