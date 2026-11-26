import "server-only"
import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { loginLimiter } from "@/lib/rate-limit"

const authSecret = process.env.AUTH_SECRET
if (process.env.NODE_ENV === "production" && (!authSecret || authSecret.length < 32)) {
    throw new Error("AUTH_SECRET debe tener al menos 32 caracteres")
}

export const { handlers, auth, signIn, signOut } = NextAuth({
    secret: authSecret,
    session: {
        strategy: "jwt",
        maxAge: 8 * 60 * 60,
        updateAge: 15 * 60,
    },
    pages: {
        signIn: "/login",
    },
    providers: [
        Credentials({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials, request) {
                const email = String(credentials?.email ?? "").trim().toLowerCase()
                const password = String(credentials?.password ?? "")

                const ip =
                    request?.headers?.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"

                const { success } = await loginLimiter.limit(`${ip}:${email}`)
                if (!success) {
                    throw new Error("Demasiados intentos. Intenta más tarde.")
                }

                if (!email || !password) {
                    throw new Error("Credenciales incorrectas")
                }

                const user = await prisma.user.findUnique({
                    where: { email },
                })

                if (!user || !user.password) {
                    throw new Error("Credenciales incorrectas")
                }

                const passwordMatch = await bcrypt.compare(password, user.password)

                if (!passwordMatch) {
                    throw new Error("Credenciales incorrectas")
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                }
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id
            }
            return token
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string
            }
            return session
        },
    },
})
