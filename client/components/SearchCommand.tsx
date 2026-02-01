"use client"

import {useEffect, useState} from "react"
import {
  CommandDialog,
  CommandEmpty,
  CommandInput,
  CommandList,
} from "../components/ui/command"
import {Button} from "../components/ui/button"
import {Loader2, TrendingUp, Star} from "lucide-react"
import Link from "next/link"
import {useWatchlist} from "../hooks/useWatchlist"

const CACHE_KEY = "popular_stocks_cache"
const CACHE_EXPIRY_KEY = "popular_stocks_cache_expiry"

export default function SearchCommand({
  renderAs = "button",
  label = "Add stock",
}: SearchCommandProps) {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(false)
  const [stocks, setStocks] = useState<StockWithWatchlistStatus[]>([])
  const [popularStocksCache, setPopularStocksCache] = useState<
    StockWithWatchlistStatus[]
  >([])

  const {isInWatchlist, addToWatchlist, removeFromWatchlist} = useWatchlist()
  useEffect(() => {
    const loadCachedStocks = () => {
      try {
        const cachedData = localStorage.getItem(CACHE_KEY)
        const cacheExpiry = localStorage.getItem(CACHE_EXPIRY_KEY)

        if (cachedData && cacheExpiry) {
          const expiryTime = parseInt(cacheExpiry, 10)
          const now = Date.now()

          if (now < expiryTime) {
            const parsedData = JSON.parse(cachedData)
            const timeRemaining = Math.round((expiryTime - now) / 1000 / 60) // minutes
            console.log("📦 Loaded popular stocks from localStorage cache", {
              count: parsedData.length,
              expiresInMinutes: timeRemaining,
            })
            setPopularStocksCache(parsedData)
          } else {
            console.log("⏰ Cache expired - will fetch fresh data")
            localStorage.removeItem(CACHE_KEY)
            localStorage.removeItem(CACHE_EXPIRY_KEY)
          }
        } else {
          console.log("📭 No cache found in localStorage")
        }
      } catch (error) {
        console.error("Error loading cached stocks:", error)
        localStorage.removeItem(CACHE_KEY)
        localStorage.removeItem(CACHE_EXPIRY_KEY)
      }
    }

    loadCachedStocks()
  }, [])
  useEffect(() => {
    if (open && stocks.length === 0 && popularStocksCache.length === 0) {
      console.log("🔴 No cache found - Making API call for popular stocks")
      fetchStocks()
    } else if (open && stocks.length === 0 && popularStocksCache.length > 0) {
      console.log("✅ Using cached popular stocks - NO API call", {
        cachedCount: popularStocksCache.length,
      })
      setStocks(popularStocksCache)
    }
  }, [open])

  useEffect(() => {
    if (!open) return

    const delayDebounce = setTimeout(() => {
      if (searchTerm.trim()) {
        fetchStocks(searchTerm.trim())
      } else if (popularStocksCache.length > 0) {
        console.log("✅ Search cleared - Using cached popular stocks")
        setStocks(popularStocksCache)
      } else {
        fetchStocks()
      }
    }, 300) 

    return () => clearTimeout(delayDebounce)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, open])

  const fetchStocks = async (query?: string) => {
    setLoading(true)
    try {
      const backendUrl =
        process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080"
      const url = query
        ? `${backendUrl}/api/stocks/search?query=${encodeURIComponent(query)}`
        : `${backendUrl}/api/stocks/search`

      console.log("📡 Making API call:", {
        hasQuery: !!query,
        query: query || "popular stocks (no params)",
        url,
      })

      const res = await fetch(url, {
        credentials: "include", // Send cookies for authentication
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!res.ok) {
        console.error("Fetch failed with status:", res.status)
        throw new Error("Failed to fetch stocks")
      }

      const data: StockWithWatchlistStatus[] = await res.json()

      // Update watchlist status from cache
      const stocksWithStatus = data.map((stock) => ({
        ...stock,
        isInWatchlist: isInWatchlist(stock.symbol),
      }))

      setStocks(stocksWithStatus)

      // Cache popular stocks (when no query) with JWT expiry time (1 hour)
      if (!query) {
        console.log("💾 Caching popular stocks to localStorage", {
          count: data.length,
          expiresIn: "1 hour",
        })
        setPopularStocksCache(data)

        try {
          // Store in localStorage with expiry time matching JWT (1 hour = 3600 seconds)
          const expiryTime = Date.now() + 60 * 60 * 1000 // 1 hour in milliseconds
          localStorage.setItem(CACHE_KEY, JSON.stringify(data))
          localStorage.setItem(CACHE_EXPIRY_KEY, expiryTime.toString())
        } catch (error) {
          console.error("Error caching stocks to localStorage:", error)
        }
      }
    } catch (error) {
      console.error("Error fetching stocks:", error)
      setStocks([])
    } finally {
      setLoading(false)
    }
  }

  const isSearchMode = !!searchTerm.trim()
  const displayStocks = stocks

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  const handleSelectStock = () => {
    setOpen(false)
    setSearchTerm("")
  }

  const handleToggleWatchlist = async (
    e: React.MouseEvent,
    stock: StockWithWatchlistStatus
  ) => {
    e.preventDefault() // Prevent navigation
    e.stopPropagation() // Stop event bubbling

    try {
      if (stock.isInWatchlist) {
        // Remove from watchlist
        await removeFromWatchlist(stock.symbol)

        // Update local state
        setStocks((prev) =>
          prev.map((s) =>
            s.symbol === stock.symbol ? {...s, isInWatchlist: false} : s
          )
        )

        if (!searchTerm.trim()) {
          setPopularStocksCache((prev) =>
            prev.map((s) =>
              s.symbol === stock.symbol ? {...s, isInWatchlist: false} : s
            )
          )
        }
      } else {
        // Add to watchlist
        await addToWatchlist(stock.symbol, stock.name)

        // Update local state
        setStocks((prev) =>
          prev.map((s) =>
            s.symbol === stock.symbol ? {...s, isInWatchlist: true} : s
          )
        )

        if (!searchTerm.trim()) {
          setPopularStocksCache((prev) =>
            prev.map((s) =>
              s.symbol === stock.symbol ? {...s, isInWatchlist: true} : s
            )
          )
        }
      }
    } catch (error) {
      console.error("Error updating watchlist:", error)
      alert("Failed to update watchlist. Please try again.")
    }
  }

  return (
    <>
      {renderAs === "text" ? (
        <span onClick={() => setOpen(true)} className="search-text">
          {label}
        </span>
      ) : (
        <Button onClick={() => setOpen(true)} className="search-btn">
          {label}
        </Button>
      )}
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        className="search-dialog"
      >
        <div className="search-field">
          <CommandInput
            value={searchTerm}
            onValueChange={setSearchTerm}
            placeholder="Search stocks..."
            className="search-input"
          />
          {loading && <Loader2 className="search-loader" />}
        </div>
        <CommandList className="search-list">
          {loading ? (
            <CommandEmpty className="search-list-empty">
              Loading stocks...
            </CommandEmpty>
          ) : displayStocks?.length === 0 ? (
            <div className="search-list-indicator">
              {isSearchMode ? "No results found" : "No stocks available"}
            </div>
          ) : (
            <ul>
              <div className="search-count">
                {isSearchMode ? "Search results" : "Popular stocks"}
                {` `}({displayStocks?.length || 0})
              </div>
              {displayStocks?.map((stock) => (
                <li key={stock.symbol} className="search-item">
                  <Link
                    href={`/stocks/${stock.symbol}`}
                    onClick={handleSelectStock}
                    className="search-item-link"
                  >
                    <TrendingUp className="h-4 w-4 text-gray-500" />
                    <div className="flex-1">
                      <div className="search-item-name">{stock.name}</div>
                      <div className="text-sm text-gray-500">
                        {stock.symbol} | {stock.exchange} | {stock.type}
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleToggleWatchlist(e, stock)}
                      className="p-1 hover:bg-gray-700 rounded transition-colors"
                      title={
                        stock.isInWatchlist
                          ? "Remove from watchlist"
                          : "Add to watchlist"
                      }
                    >
                      <Star
                        className={`h-5 w-5 transition-colors ${
                          stock.isInWatchlist
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-400 hover:text-yellow-400"
                        }`}
                      />
                    </button>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
}
