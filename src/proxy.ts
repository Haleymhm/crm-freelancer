import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
    const userId = (req.auth?.user as { id?: string } | undefined)?.id
    const isLoggedIn = Boolean(userId)
    const { pathname } = req.nextUrl
    const isAuthPage = pathname === "/login" || pathname === "/registro"

    if (!isLoggedIn && !isAuthPage) {
        return NextResponse.redirect(new URL("/login", req.url))
    }

    if (isLoggedIn && isAuthPage) {
        return NextResponse.redirect(new URL("/", req.url))
    }

    return NextResponse.next()
})

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico|login-bg.jpg).*)"],
}
