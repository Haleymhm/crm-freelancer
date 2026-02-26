import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"

const apiRegisterSchema = z.object({
    name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
    email: z.string().email("Debe ser un correo electrónico válido"),
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
})

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const validatedData = apiRegisterSchema.parse(body)
        const { name, email, password } = validatedData

        // Verificar si el usuario ya existe
        const existingUser = await prisma.user.findUnique({
            where: { email },
        })

        if (existingUser) {
            return NextResponse.json(
                { error: "El email ya está registrado" },
                { status: 400 }
            )
        }

        // Hashear contraseña
        const hashedPassword = await bcrypt.hash(password, 10)

        // Crear usuario
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
            },
        })

        return NextResponse.json(
            { message: "Usuario creado exitosamente", userId: user.id },
            { status: 201 }
        )
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Datos de registro inválidos", details: error.errors }, { status: 400 })
        }
        console.error("Error creating user:", error)
        return NextResponse.json(
            { error: "Error al crear el usuario" },
            { status: 500 }
        )
    }
}
