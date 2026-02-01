"use client"

import {useEffect, useState} from "react"
import {
  Loader2,
  TrendingUp,
  Calendar,
  DollarSign,
  Building2,
  ExternalLink,
} from "lucide-react"
import Link from "next/link"
import WatchlistButton from "@/components/WatchlistButton"
import {useWatchlist} from "@/hooks/useWatchlist"

interface StockProfile {
  name: string
  logo: string
  marketCapitalization: number
  ticker: string
  exchange: string
  finnhubIndustry: string
  currency: string
  weburl: string
}

interface EnrichedWishlistItem {
  symbol: string
  company: string
  addedAt: string
  profile?: StockProfile
  loading: boolean
  error?: string
}

export default function WatchlistPage() {
  const {watchlist: contextWatchlist, isLoading} = useWatchlist()
  const [enrichedWatchlist, setEnrichedWatchlist] = useState<
    EnrichedWishlistItem[]
  >([])

  // Fetch stock profiles when watchlist changes
  useEffect(() => {
    const fetchProfiles = async () => {
      // Initialize with loading state
      const enriched: EnrichedWishlistItem[] = contextWatchlist.map((item) => ({
        ...item,
        loading: true,
      }))

      setEnrichedWatchlist(enriched)

      // Fetch all profiles in parallel for better performance
      const profilePromises = contextWatchlist.map(async (item, index) => {
        try {
          const profileRes = await fetch(
            `${
              process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080"
            }/api/stocks/profile?symbol=${item.symbol}`
          )

          if (profileRes.ok) {
            const profile: StockProfile = await profileRes.json()
            return {index, profile, error: undefined}
          } else {
            return {index, profile: undefined, error: "Failed to load profile"}
          }
        } catch {
          return {index, profile: undefined, error: "Failed to load profile"}
        }
      })

      // Wait for all profiles to load
      const results = await Promise.all(profilePromises)

      // Update state once with all results
      setEnrichedWatchlist((prev) => {
        const updated = [...prev]
        results.forEach(({index, profile, error}) => {
          updated[index] = {
            ...updated[index],
            profile,
            loading: false,
            error,
          }
        })
        return updated
      })
    }

    if (contextWatchlist.length > 0) {
      fetchProfiles()
    } else {
      setEnrichedWatchlist([])
    }
  }, [contextWatchlist])

  const formatMarketCap = (value: number) => {
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(2)}T`
    }
    return `$${value.toFixed(2)}B`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-400">Loading your watchlist...</p>
        </div>
      </div>
    )
  }

  if (enrichedWatchlist.length === 0 && contextWatchlist.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <TrendingUp className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">
            Your Watchlist is Empty
          </h2>
          <p className="text-gray-400 mb-6">
            Start tracking stocks by adding them to your watchlist
          </p>
          <button
            onClick={() => {
              // Trigger the search command by pressing Ctrl+K
              const event = new KeyboardEvent("keydown", {
                key: "k",
                code: "KeyK",
                ctrlKey: true,
                metaKey: true,
                bubbles: true,
              })
              document.dispatchEvent(event)
            }}
            className="inline-flex items-center justify-center px-6 yellow-btn"
          >
            Browse Stocks
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">My Watchlist</h1>
        <p className="text-gray-400">
          {enrichedWatchlist.length}{" "}
          {enrichedWatchlist.length === 1 ? "stock" : "stocks"} in your
          watchlist
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {enrichedWatchlist.map((item) => (
          <div
            key={item.symbol}
            className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10"
          >
            {item.loading ? (
              <div className="p-6 flex items-center justify-center min-h-[300px]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : item.error ? (
              <div className="p-6">
                <p className="text-red-500 text-center">{item.error}</p>
              </div>
            ) : (
              <>
                {/* Card Header */}
                <div className="p-6 border-b border-gray-700">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {item.profile?.logo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.profile.logo}
                          alt={item.symbol}
                          className="w-12 h-12 rounded-lg object-cover bg-white p-1"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gray-700 flex items-center justify-center">
                          <Building2 className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <h3 className="text-xl font-bold text-white">
                          {item.symbol}
                        </h3>
                        <p className="text-sm text-gray-400">
                          {item.profile?.exchange || "N/A"}
                        </p>
                      </div>
                    </div>
                    <WatchlistButton
                      symbol={item.symbol}
                      company={item.company}
                      isInWatchlist={true}
                      type="icon"
                    />
                  </div>
                  <h4 className="text-lg font-semibold text-white line-clamp-2 mt-(-0.5)">
                    {item.profile?.name || item.company}
                  </h4>
                </div>

                {/* Card Body */}
                <div className="p-6 space-y-4">
                  {/* Market Cap */}
                  {item.profile?.marketCapitalization && (
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="w-4 h-4 text-green-500" />
                      <span className="text-gray-400">Market Cap:</span>
                      <span className="text-white font-semibold">
                        {formatMarketCap(item.profile.marketCapitalization)}
                      </span>
                    </div>
                  )}

                  {/* Industry */}
                  {item.profile?.finnhubIndustry && (
                    <div className="flex items-center gap-2 text-sm">
                      <Building2 className="w-4 h-4 text-blue-500" />
                      <span className="text-gray-400">Industry:</span>
                      <span className="text-white">
                        {item.profile.finnhubIndustry}
                      </span>
                    </div>
                  )}

                  {/* Added Date */}
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-purple-500" />
                    <span className="text-gray-400">Added:</span>
                    <span className="text-white">
                      {formatDate(item.addedAt)}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-4">
                    <Link
                      href={`/stocks/${item.symbol}`}
                      className="flex-1 yellow-btn flex items-center justify-center"
                    >
                      View Details
                    </Link>
                    {item.profile?.weburl && (
                      <a
                        href={item.profile.weburl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition flex items-center justify-center"
                        title="Visit company website"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
