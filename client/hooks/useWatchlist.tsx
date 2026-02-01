"use client"

import {createContext, useContext, useEffect, useState, ReactNode} from "react"

interface WatchlistItem {
  symbol: string
  company: string
  addedAt: string
}

interface WatchlistContextType {
  watchlist: WatchlistItem[]
  isLoading: boolean
  isAdding: boolean
  isRemoving: boolean
  userId: string | null
  isInWatchlist: (symbol: string) => boolean
  addToWatchlist: (symbol: string, company: string) => Promise<void>
  removeFromWatchlist: (symbol: string) => Promise<void>
  refreshWatchlist: () => Promise<void>
}

const WatchlistContext = createContext<WatchlistContextType | undefined>(
  undefined
)

const WATCHLIST_CACHE_KEY = "user_watchlist_cache"
const WATCHLIST_CACHE_EXPIRY_KEY = "user_watchlist_cache_expiry"
const CACHED_USER_ID_KEY = "cached_watchlist_user_id"

export function WatchlistProvider({children}: {children: ReactNode}) {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  // Get userId from localStorage
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user")
      if (storedUser) {
        const user = JSON.parse(storedUser)
        const newUserId = user.id

        // Check if user has changed - if so, clear cache
        const cachedUserId = localStorage.getItem(CACHED_USER_ID_KEY)
        if (cachedUserId && cachedUserId !== newUserId) {
          console.log("🔄 User changed, clearing watchlist cache")
          localStorage.removeItem(WATCHLIST_CACHE_KEY)
          localStorage.removeItem(WATCHLIST_CACHE_EXPIRY_KEY)
        }

        // Store current user ID
        localStorage.setItem(CACHED_USER_ID_KEY, newUserId)
        setUserId(newUserId)
      } else {
        // No user logged in - clear everything
        setUserId(null)
        setWatchlist([])
        localStorage.removeItem(WATCHLIST_CACHE_KEY)
        localStorage.removeItem(WATCHLIST_CACHE_EXPIRY_KEY)
        localStorage.removeItem(CACHED_USER_ID_KEY)
      }
    } catch (error) {
      console.error("Error loading user from localStorage:", error)
    }
  }, [])

  // Load watchlist from cache or API on mount
  useEffect(() => {
    if (!userId) {
      setIsLoading(false)
      return
    }

    const loadWatchlist = async () => {
      try {
        // Try to load from cache first
        const cachedData = localStorage.getItem(WATCHLIST_CACHE_KEY)
        const cacheExpiry = localStorage.getItem(WATCHLIST_CACHE_EXPIRY_KEY)

        if (cachedData && cacheExpiry) {
          const expiryTime = parseInt(cacheExpiry, 10)
          const now = Date.now()

          if (now < expiryTime) {
            const parsedData = JSON.parse(cachedData)
            console.log("📦 Loaded watchlist from cache", {
              count: parsedData.length,
            })
            setWatchlist(parsedData)
            setIsLoading(false)
            return
          } else {
            // Cache expired
            console.log("⏰ Watchlist cache expired")
            localStorage.removeItem(WATCHLIST_CACHE_KEY)
            localStorage.removeItem(WATCHLIST_CACHE_EXPIRY_KEY)
          }
        }

        // Fetch from API
        console.log("🔄 Fetching watchlist from API")
        await refreshWatchlist()
      } catch (error) {
        console.error("Error loading watchlist:", error)
        setIsLoading(false)
      }
    }

    loadWatchlist()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  const refreshWatchlist = async () => {
    if (!userId) return

    try {
      setIsLoading(true)
      const response = await fetch(`/api/wishlist/get?userId=${userId}`)

      if (!response.ok) {
        throw new Error("Failed to fetch watchlist")
      }

      const data: WatchlistItem[] = await response.json()
      setWatchlist(data)

      // Cache with JWT expiry (1 hour)
      const expiryTime = Date.now() + 60 * 60 * 1000
      localStorage.setItem(WATCHLIST_CACHE_KEY, JSON.stringify(data))
      localStorage.setItem(WATCHLIST_CACHE_EXPIRY_KEY, expiryTime.toString())

      console.log("✅ Watchlist refreshed and cached", {count: data.length})
    } catch (error) {
      console.error("Error refreshing watchlist:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const isInWatchlist = (symbol: string): boolean => {
    return watchlist.some((item) => item.symbol === symbol)
  }

  const addToWatchlist = async (symbol: string, company: string) => {
    if (!userId) {
      throw new Error("User not authenticated")
    }

    try {
      setIsAdding(true)

      const response = await fetch("/api/wishlist/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          symbol,
          company,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to add to watchlist")
      }

      console.log("➕ Added to watchlist, refreshing cache")
      // Invalidate cache and refresh
      localStorage.removeItem(WATCHLIST_CACHE_KEY)
      localStorage.removeItem(WATCHLIST_CACHE_EXPIRY_KEY)
      await refreshWatchlist()
    } finally {
      setIsAdding(false)
    }
  }

  const removeFromWatchlist = async (symbol: string) => {
    if (!userId) {
      throw new Error("User not authenticated")
    }

    try {
      setIsRemoving(true)

      const response = await fetch(
        `/api/wishlist/remove?userId=${encodeURIComponent(
          userId
        )}&symbol=${encodeURIComponent(symbol)}`,
        {
          method: "DELETE",
        }
      )

      if (!response.ok) {
        throw new Error("Failed to remove from watchlist")
      }

      console.log("➖ Removed from watchlist, refreshing cache")
      // Invalidate cache and refresh
      localStorage.removeItem(WATCHLIST_CACHE_KEY)
      localStorage.removeItem(WATCHLIST_CACHE_EXPIRY_KEY)
      await refreshWatchlist()
    } finally {
      setIsRemoving(false)
    }
  }

  return (
    <WatchlistContext.Provider
      value={{
        watchlist,
        isLoading,
        isAdding,
        isRemoving,
        userId,
        isInWatchlist,
        addToWatchlist,
        removeFromWatchlist,
        refreshWatchlist,
      }}
    >
      {children}
    </WatchlistContext.Provider>
  )
}

export function useWatchlist() {
  const context = useContext(WatchlistContext)
  if (context === undefined) {
    throw new Error("useWatchlist must be used within a WatchlistProvider")
  }
  return context
}

// Utility function to clear watchlist cache (can be called during logout)
export function clearWatchlistCache() {
  try {
    localStorage.removeItem(WATCHLIST_CACHE_KEY)
    localStorage.removeItem(WATCHLIST_CACHE_EXPIRY_KEY)
    localStorage.removeItem(CACHED_USER_ID_KEY)
    console.log("🧹 Watchlist cache cleared")
  } catch (error) {
    console.error("Error clearing watchlist cache:", error)
  }
}
