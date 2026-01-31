"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import PriceChart from "@/components/charts/PriceChart";
import MetricCard from "@/components/ui/MetricCard";

interface PricePoint {
  date: string;
  close: number;
}

export default function StockPage() {
  const params = useParams();
  const ticker = typeof params?.ticker === "string" ? params.ticker.toUpperCase() : "";

  const [data, setData] = useState<PricePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ticker) return;

    fetch(`http://localhost:8080/api/stocks/${ticker}/history`)
      .then(res => res.json())
      .then(res => {
        setData(res.prices || []);
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
    <div className="p-6">
      <h1>{ticker}</h1>
      <MetricCard title="Current Price" value={`$${latestPrice}`} />
      <MetricCard title="Change (%)" value={`${changePercent}%`} />
      <PriceChart labels={labels} prices={prices} ticker={ticker} />
    </div>
  );
}
