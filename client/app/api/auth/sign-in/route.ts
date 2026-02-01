import {NextResponse} from "next/server"
import type {NextRequest} from "next/server"
import {rateLimit, getClientIdentifier} from "@/lib/rateLimit"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Rate limiting: 5 login attempts per minute per IP (prevent brute force)
    const identifier = getClientIdentifier(req)
    const rateLimitResult = rateLimit(identifier, {limit: 5, window: 60000})

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: "Too many login attempts. Please try again later.",
          retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            "Retry-After": Math.ceil(
              (rateLimitResult.reset - Date.now()) / 1000
            ).toString(),
          },
        }
      )
    }

    // Validate required fields
    if (!body.email || !body.password) {
      return NextResponse.json(
        {error: "Email and password are required"},
        {status: 400}
      )
    }

    // Forward credentials to backend auth endpoint
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080"

    if (!process.env.NEXT_PUBLIC_BACKEND_URL && process.env.NODE_ENV === "production") {
      console.error("NEXT_PUBLIC_BACKEND_URL not set in production!")
      return NextResponse.json(
        {error: "Server configuration error"},
        {status: 500}
      )
    }

    const backendRes = await fetch(
      `${backendUrl.replace(/\/$/, "")}/auth/sign-in`,
      {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(body),
      }
    )

    const json = await backendRes.json().catch(() => ({}))
    if (!backendRes.ok) {
      return NextResponse.json(
        {error: json.message || "Authentication failed"},
        {status: backendRes.status}
      )
    }

    const token: string | undefined = json.token
    if (!token) {
      return NextResponse.json(
        {error: "No token returned from auth server"},
        {status: 500}
      )
    }

    // decode payload (without verification) to return minimal user info
    const {getUserFromToken} = await import("@/lib/jwt")
    const user = getUserFromToken(token)

    const res = NextResponse.json({
      user,
    })

    const maxAge = 60 * 60 // 1 hour - matches JWT expiry from backend
    res.cookies.set("token", token, {
      httpOnly: true,
      sameSite: "lax", // Changed from "strict" to allow cross-port requests to backend
      path: "/",
      maxAge,
      secure: process.env.NODE_ENV === "production",
    })

    return res
  } catch (err) {
    console.error("Auth sign-in route error:", err)
    return NextResponse.json({error: "Server error"}, {status: 500})
  }
}
