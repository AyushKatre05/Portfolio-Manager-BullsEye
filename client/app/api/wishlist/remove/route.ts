import {NextResponse} from "next/server"
import type {NextRequest} from "next/server"
import {rateLimit, getClientIdentifier} from "@/lib/rateLimit"

export async function DELETE(req: NextRequest) {
  try {
    const {searchParams} = new URL(req.url)
    const userId = searchParams.get("userId")
    const symbol = searchParams.get("symbol")

    if (!userId || !symbol) {
      return NextResponse.json(
        {error: "Missing userId or symbol"},
        {status: 400}
      )
    }

    const token = req.cookies.get("token")?.value

    if (!token) {
      return NextResponse.json({error: "Not authenticated"}, {status: 401})
    }

    // Rate limiting: 30 requests per minute per user
    const identifier = getClientIdentifier(req, userId)
    const rateLimitResult = rateLimit(identifier, {limit: 30, window: 60000})

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
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080"
    const backendRes = await fetch(
      `${backendUrl}/api/wishlist/remove?userId=${encodeURIComponent(
        userId
      )}&symbol=${encodeURIComponent(symbol)}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )

    if (!backendRes.ok) {
      const errorText = await backendRes.text().catch(() => "")
      console.error("Backend error:", backendRes.status, errorText)
      return NextResponse.json(
        {error: "Failed to remove from wishlist"},
        {status: backendRes.status}
      )
    }

    return NextResponse.json({success: true})
  } catch (err) {
    console.error("Wishlist remove route error:", err)
    return NextResponse.json({error: "Server error"}, {status: 500})
  }
}
