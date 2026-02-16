import { auth } from "@/lib/auth"

export default auth((req) => {
    // req.auth is available here if needed
})

export const config = {
    matcher: ["/((?!api/auth|api/registro|login|registro|_next/static|_next/image|favicon.ico).*)"],
}
