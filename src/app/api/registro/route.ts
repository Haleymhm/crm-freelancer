import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { registerLimiter } from "@/lib/rate-limit"
import { isSameOrigin } from "@/lib/http/same-origin"

const apiRegisterSchema = z.object({
    name: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres").max(100),
    email: z.string().trim().toLowerCase().email("Debe ser un correo electrónico válido").max(254),
    password: z.string().min(12, "La contraseña debe tener al menos 12 caracteres").max(128),
})

export async function POST(request: NextRequest) {
    try {
        if (!isSameOrigin(request)) {
            return NextResponse.json({ error: "Origen no permitido" }, { status: 403 })
        }

        const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
        const { success } = await registerLimiter.limit(ip)
        if (!success) {
            return NextResponse.json(
                { error: "Demasiadas solicitudes. Intenta más tarde." },
                { status: 429 }
            )
        }

        const parsed = apiRegisterSchema.safeParse(await request.json().catch(() => null))
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Datos de registro inválidos", details: parsed.error.flatten() },
                { status: 400 }
            )
        }

        const { name, email, password } = parsed.data

        const existingUser = await prisma.user.findUnique({
            where: { email },
            select: { id: true },
        })

        // Respuesta genérica para evitar enumeración de correos
        if (existingUser) {
            return NextResponse.json(
                { message: "Si el correo es válido, el registro se completará correctamente" },
                { status: 202 }
            )
        }

        const hashedPassword = await bcrypt.hash(password, 12)

        await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
            },
        })

        return NextResponse.json(
            { message: "Si el correo es válido, el registro se completará correctamente" },
            { status: 202 }
        )
    } catch (error) {
        console.error("Error creating user:", error)
        return NextResponse.json(
            { error: "Error al crear el usuario" },
            { status: 500 }
        )
    }
}
