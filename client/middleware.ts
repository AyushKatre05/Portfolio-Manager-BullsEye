import {NextRequest, NextResponse} from "next/server"
import {jwtVerify} from "jose"

// Middleware: protect routes with JWT verification using jose (Edge-compatible).
// Backend uses HS256 algorithm with symmetric key for signing/verification.

export async function middleware(req: NextRequest) {
  const {pathname} = req.nextUrl

  // Allow public and internal routes
  if (
    pathname === "/sign-in" ||
    pathname === "/sign-up" ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/assets") ||
    pathname.startsWith("/images") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next()
  }

  const token = req.cookies.get("token")?.value

  if (!token) {
    console.log(
      `[Middleware] No token found for ${pathname}, redirecting to sign-in`
    )
    return NextResponse.redirect(new URL("/sign-in", req.url))
  }

  // Verify JWT using jose (Edge-compatible, matches Spring backend HS256)
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "")

    if (!process.env.JWT_SECRET) {
      console.error("[Middleware] JWT_SECRET not configured!")
      return NextResponse.redirect(new URL("/sign-in", req.url))
    }

    await jwtVerify(token, secret, {
      algorithms: ["HS256"], // Match Spring backend algorithm
    })

    console.log(`[Middleware] ✅ Token valid for ${pathname}`)
    // Token valid - expiration check is handled by jwtVerify automatically
    const response = NextResponse.next()

    // Add security headers
    response.headers.set("X-Content-Type-Options", "nosniff")
    response.headers.set("X-Frame-Options", "DENY")
    response.headers.set("X-XSS-Protection", "1; mode=block")

    return response
  } catch (err) {
    // Invalid/expired token - redirect to sign-in
    console.log(
      `[Middleware] ❌ Token invalid for ${pathname}:`,
      err instanceof Error ? err.message : "Unknown error"
    )
    return NextResponse.redirect(new URL("/sign-in", req.url))
  }
}

export const config = {
  matcher: [
    "/",
    "/stocks/:path*",
    "/watchlist/:path*",
    "/profile/:path*",
    "/settings/:path*",
    "/alerts/:path*",
  ],
}
