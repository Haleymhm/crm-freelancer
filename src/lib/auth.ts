import "server-only"
import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { loginLimiter, loginLockout } from "@/lib/rate-limit"

const authSecret = process.env.AUTH_SECRET
if (process.env.NODE_ENV === "production" && (!authSecret || authSecret.length < 32)) {
    throw new Error("AUTH_SECRET debe tener al menos 32 caracteres")
}

const isProduction = process.env.NODE_ENV === "production"

export const { handlers, auth, signIn, signOut } = NextAuth({
    secret: authSecret,
    session: {
        strategy: "jwt",
        maxAge: 8 * 60 * 60,
        updateAge: 15 * 60,
    },
    cookies: {
        sessionToken: {
            name: isProduction ? "__Host-authjs.session-token" : "authjs.session-token",
            options: {
                httpOnly: true,
                sameSite: "lax",
                path: "/",
                secure: isProduction,
            },
        },
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
                const rateKey = `${ip}:${email}`

                if (loginLockout.isLocked(rateKey)) {
                    throw new Error("Cuenta bloqueada temporalmente por intentos fallidos.")
                }

                const { success } = await loginLimiter.limit(rateKey)
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
                    loginLockout.recordFailure(rateKey)
                    throw new Error("Credenciales incorrectas")
                }

                const passwordMatch = await bcrypt.compare(password, user.password)

                if (!passwordMatch) {
                    loginLockout.recordFailure(rateKey)
                    throw new Error("Credenciales incorrectas")
                }

                loginLockout.reset(rateKey)

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
