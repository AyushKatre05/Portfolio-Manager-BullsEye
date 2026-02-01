"use client"

import {useEffect, useState} from "react"
import {useWatchlist} from "@/hooks/useWatchlist"
import TradingViewWidget from "@/components/TradingViewWidget"
import WatchlistButton from "@/components/WatchlistButton"
import {
  SYMBOL_INFO_WIDGET_CONFIG,
  CANDLE_CHART_WIDGET_CONFIG,
  BASELINE_WIDGET_CONFIG,
  TECHNICAL_ANALYSIS_WIDGET_CONFIG,
  COMPANY_PROFILE_WIDGET_CONFIG,
  COMPANY_FINANCIALS_WIDGET_CONFIG,
} from "@/lib/constants"

export default function StockDetails({params}: StockDetailsPageProps) {
  const [symbol, setSymbol] = useState<string>("")
  const [companyName, setCompanyName] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const {isInWatchlist} = useWatchlist()

  const scriptUrl = `https://s3.tradingview.com/external-embedding/embed-widget-`

  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params
      setSymbol(resolvedParams.symbol)
    }
    getParams()
  }, [params])

  // Fetch company name from backend
  useEffect(() => {
    if (!symbol) return

    const fetchCompanyName = async () => {
      setIsLoading(true)
      let name = symbol.toUpperCase()
      let fetchError = null

      try {
        const backendUrl =
          process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080"
        const url = `${backendUrl}/api/stocks/profile?symbol=${symbol}`

        const response = await fetch(url, {
          cache: "no-store",
          headers: {
            Accept: "application/json",
          },
        })

        if (response.ok) {
          const profileData = await response.json()
          if (profileData && profileData.name) {
            name = profileData.name
          }
        } else {
          fetchError = `HTTP ${response.status}`
        }
      } catch (error) {
        fetchError = error instanceof Error ? error.message : "Unknown error"
      }

      // Log to terminal (visible in npm run dev output)
      if (fetchError) {
        console.error(
          `[Stock ${symbol}] Failed to fetch profile: ${fetchError}`
        )
      } else {
        console.log(`[Stock ${symbol}] Company name: ${name}`)
      }

      setCompanyName(name)
      setIsLoading(false)
    }

    fetchCompanyName()
  }, [symbol])

  if (!symbol || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen p-4 md:p-6 lg:p-8">
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
        {/* Left column */}
        <div className="flex flex-col gap-6">
          <TradingViewWidget
            scriptUrl={`${scriptUrl}symbol-info.js`}
            config={SYMBOL_INFO_WIDGET_CONFIG(symbol)}
            height={170}
          />

          <TradingViewWidget
            scriptUrl={`${scriptUrl}advanced-chart.js`}
            config={CANDLE_CHART_WIDGET_CONFIG(symbol)}
            className="custom-chart"
            height={600}
          />

          <TradingViewWidget
            scriptUrl={`${scriptUrl}advanced-chart.js`}
            config={BASELINE_WIDGET_CONFIG(symbol)}
            className="custom-chart"
            height={600}
          />
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <WatchlistButton
              symbol={symbol.toUpperCase()}
              company={companyName}
              isInWatchlist={isInWatchlist(symbol.toUpperCase())}
            />
          </div>

          <TradingViewWidget
            scriptUrl={`${scriptUrl}technical-analysis.js`}
            config={TECHNICAL_ANALYSIS_WIDGET_CONFIG(symbol)}
            height={400}
          />

          <TradingViewWidget
            scriptUrl={`${scriptUrl}company-profile.js`}
            config={COMPANY_PROFILE_WIDGET_CONFIG(symbol)}
            height={440}
          />

          <TradingViewWidget
            scriptUrl={`${scriptUrl}financials.js`}
            config={COMPANY_FINANCIALS_WIDGET_CONFIG(symbol)}
            height={464}
          />
        </div>
      </section>
    </div>
  )
}
