import React from "react"
import Header from "@/components/Header"
import {cookies} from "next/headers"
import {WatchlistProvider} from "@/hooks/useWatchlist"
import {getUserFromToken} from "@/lib/jwt"
import {Toaster} from "@/components/Toaster"
import {ErrorBoundary} from "@/components/ErrorBoundary"

const layout = async ({children}: {children: React.ReactNode}) => {
  const cookiesStore = await cookies()
  const token = cookiesStore.get("token")?.value

  let session: {
    user?: {id?: string; name?: string; email?: string}
    token?: string
  } | null = null

  // Middleware already validated JWT - if we have a token here, it's valid
  // Just decode the payload to extract user info (no verification needed)
  if (token) {
    const user = getUserFromToken(token)
    if (user) {
      session = {
        token,
        user,
      }
    }
  }

  return (
    <ErrorBoundary>
      <WatchlistProvider>
        <Toaster />
        <main className="min-h-screen text-gray-400">
          <Header
            user={
              session?.user?.id && session?.user?.name && session?.user?.email
                ? {
                    id: session.user.id,
                    name: session.user.name,
                    email: session.user.email,
                  }
                : undefined
            }
          />
          <div className="container py-10">{children}</div>
        </main>
      </WatchlistProvider>
    </ErrorBoundary>
  )
}

export default layout
