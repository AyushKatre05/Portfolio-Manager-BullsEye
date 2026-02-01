import {NextResponse} from "next/server"
import type {NextRequest} from "next/server"
import {rateLimit, getClientIdentifier} from "@/lib/rateLimit"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const token = req.cookies.get("token")?.value

    if (!token) {
      return NextResponse.json({error: "Not authenticated"}, {status: 401})
    }

    // Rate limiting: 30 requests per minute per user
    const identifier = getClientIdentifier(req, body.userId)
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

    // Log what we're sending to the backend
    console.log("📤 Sending to Spring backend:", body)

    // Forward request to Spring backend with JWT token
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080"
    const backendRes = await fetch(`${backendUrl}/api/wishlist/add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    })

    if (!backendRes.ok) {
      const errorText = await backendRes.text().catch(() => "")
      console.error("Backend error:", backendRes.status, errorText)
      return NextResponse.json(
        {error: "Failed to add to wishlist"},
        {status: backendRes.status}
      )
    }

    return NextResponse.json({success: true})
  } catch (err) {
    console.error("Wishlist add route error:", err)
    return NextResponse.json({error: "Server error"}, {status: 500})
  }
}
