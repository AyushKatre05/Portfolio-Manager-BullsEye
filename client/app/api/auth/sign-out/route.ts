import {NextResponse} from "next/server"

export async function POST() {
  try {
    const res = NextResponse.json({ok: true})

    // Clear the httpOnly token cookie by setting it with maxAge 0 and empty value
    res.cookies.set("token", "", {
      httpOnly: true,
      sameSite: "lax", // Match sign-in cookie settings
      path: "/",
      maxAge: 0,
      secure: process.env.NODE_ENV === "production",
    })

    return res
  } catch (err) {
    console.error("Auth sign-out route error:", err)
    return NextResponse.json({error: "Server error"}, {status: 500})
  }
}
