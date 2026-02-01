import {NextResponse} from "next/server"
import type {NextRequest} from "next/server"
import {rateLimit, getClientIdentifier} from "@/lib/rateLimit"

export async function GET(req: NextRequest) {
  try {
    const {searchParams} = new URL(req.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({error: "Missing userId"}, {status: 400})
    }

    const token = req.cookies.get("token")?.value

    if (!token) {
      return NextResponse.json({error: "Not authenticated"}, {status: 401})
    }

    // Rate limiting: 60 requests per minute per user (higher for GET)
    const identifier = getClientIdentifier(req, userId)
    const rateLimitResult = rateLimit(identifier, {limit: 60, window: 60000})

    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: "Too many requests. Please try again later.",
          retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": rateLimitResult.limit.toString(),
            "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
            "X-RateLimit-Reset": rateLimitResult.reset.toString(),
            "Retry-After": Math.ceil(
              (rateLimitResult.reset - Date.now()) / 1000
            ).toString(),
          },
        }
      )
    }

    // Forward request to Spring backend with JWT token
    const backendUrl = process.env.BACKEND_URL || "http://localhost:8080"
    const backendRes = await fetch(
      `${backendUrl}/api/wishlist/wishlist?userId=${encodeURIComponent(
        userId
      )}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )

    if (!backendRes.ok) {
      const errorText = await backendRes.text().catch(() => "")
      console.error("Backend error:", backendRes.status, errorText)
      return NextResponse.json(
        {error: "Failed to fetch wishlist"},
        {status: backendRes.status}
      )
    }

    const data = await backendRes.json()
    return NextResponse.json(data)
  } catch (err) {
    console.error("Wishlist get route error:", err)
    return NextResponse.json({error: "Server error"}, {status: 500})
  }
}
