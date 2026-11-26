import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

function buildCsp(nonce: string): string {
    return [
        "default-src 'self'",
        "base-uri 'self'",
        "frame-ancestors 'none'",
        "object-src 'none'",
        "img-src 'self' data: blob:",
        "font-src 'self' data:",
        "style-src 'self' 'unsafe-inline'",
        `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
        "connect-src 'self'",
        "form-action 'self'",
        "upgrade-insecure-requests",
    ].join("; ")
}

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

    const nonce = Buffer.from(crypto.randomUUID()).toString("base64")
    const requestHeaders = new Headers(req.headers)
    requestHeaders.set("x-nonce", nonce)

    const response = NextResponse.next({
        request: { headers: requestHeaders },
    })
    response.headers.set("Content-Security-Policy", buildCsp(nonce))
    return response
})

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico|login-bg.jpg).*)"],
}
