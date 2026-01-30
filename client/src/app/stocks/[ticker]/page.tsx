"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import PriceChart from "@/components/charts/PriceChart";
import VolumeChart from "@/components/charts/VolumeChart";
import MetricCard from "@/components/ui/MetricCard";

interface PricePoint {
  date: string;
  close: number;
}

export default function StockPage() {
  const params = useParams();
  const ticker = typeof params?.ticker === "string"
    ? params.ticker.toUpperCase()
    : "";

  const [data, setData] = useState<PricePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ticker) return;

    fetch(`http://localhost:8080/api/stocks/${ticker}/history`)
      .then(res => {
        if (!res.ok) {
          throw new Error("Failed to fetch stock data");
        }
        return res.json();
      })
      .then(res => {
        setData(res.prices);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  }, [ticker]);

  if (loading) return <p className="p-6">Loading stock data...</p>;
  if (error) return <p className="p-6 text-red-600">{error}</p>;
  if (!data.length) return <p className="p-6">No data found</p>;

  const labels = data.map(p => p.date);
  const prices = data.map(p => p.close);

  const latestPrice = prices[prices.length - 1];
  const firstPrice = prices[0];
  const changePercent = (((latestPrice - firstPrice) / firstPrice) * 100).toFixed(2);

  return (
  <div className="min-h-screen bg-gradient-to-br from-slate-100 via-emerald-50 to-slate-100 p-6">
    <div className="mx-auto max-w-7xl space-y-8">

      {/* Header */}
      <div className="rounded-2xl bg-slate-900 px-6 py-5 text-white shadow-lg">
        <h1 className="text-3xl font-bold tracking-wide">{ticker}</h1>
        <p className="text-slate-300">
          Stock Performance Overview
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <MetricCard
          title="Current Price"
          value={`$${latestPrice}`}
          className="border-l-4 border-emerald-500"
        />
        <MetricCard
          title="Change (%)"
          value={`${changePercent}%`}
          className={`border-l-4 ${
            Number(changePercent) >= 0
              ? "border-emerald-500 text-emerald-600"
              : "border-red-500 text-red-600"
          }`}
        />
        <MetricCard
          title="Data Points"
          value={data.length.toString()}
          className="border-l-4 border-sky-500"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        <div className="rounded-2xl bg-white p-5 shadow-md">
          <h2 className="mb-3 text-lg font-semibold text-slate-700">
            Price Trend
          </h2>
          <PriceChart
            labels={labels}
            prices={prices}
            ticker={ticker}
          />
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-md">
          <h2 className="mb-3 text-lg font-semibold text-slate-700">
            Volume Trend
          </h2>
          <VolumeChart
            labels={labels}
            volumes={prices.map(() => Math.random() * 1_000_000)}
          />
        </div>

      </div>
    </div>
  </div>
);

}
