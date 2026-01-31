"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface BehaviorResponse {
  ticker: string;
  volatilityType: string;
  trendNature: string;
  suitability: string;
  confidenceScore: number;
}

export default function StockBehaviorPage() {
  const params = useParams();
  const ticker =
    typeof params?.ticker === "string"
      ? params.ticker.toUpperCase()
      : "";

  const [data, setData] = useState<BehaviorResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ticker) return;

    fetch(`http://localhost:8080/api/behavior/${ticker}`)
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch behavior data");
        return res.json();
      })
      .then(res => {
        setData(res);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [ticker]);

  if (loading) return <p className="p-6 text-gray-300">Loading analysis...</p>;
  if (error) return <p className="p-6 text-red-500">{error}</p>;
  if (!data) return null;

  const confidence = data.confidenceScore;
  const barWidth = Math.min(100, Math.abs(confidence));
  const barColor = confidence >= 0 ? "bg-green-500" : "bg-red-500";

  return (
    <div className="min-h-screen bg-[#0b1320] p-6 text-white">
      <div className="mx-auto max-w-3xl space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">{ticker}</h1>
          <p className="text-gray-400">Behavioral & Risk Analysis</p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

          <Card title="Volatility">
            <span className="text-yellow-400">
              {data.volatilityType}
            </span>
          </Card>

          <Card title="Trend">
            <span className="text-blue-400">
              {data.trendNature}
            </span>
          </Card>

          <Card title="Investor Suitability">
            <span className="text-green-400">
              {data.suitability}
            </span>
          </Card>

        </div>

        {/* Confidence */}
        <div className="rounded-xl bg-[#121a2b] p-5 shadow-lg">
          <h2 className="mb-3 text-lg font-semibold">Model Confidence</h2>

          <div className="h-3 w-full overflow-hidden rounded bg-gray-700">
            <div
              className={`h-3 ${barColor}`}
              style={{ width: `${barWidth}%` }}
            />
          </div>

          <p className="mt-3 text-sm text-gray-300">
            Confidence Score:{" "}
            <span
              className={confidence >= 0 ? "text-green-400" : "text-red-400"}
            >
              {confidence}%
            </span>
          </p>

          {confidence < 0 && (
            <p className="mt-2 text-xs text-red-400">
              ⚠️ High uncertainty / risky behavior detected
            </p>
          )}
        </div>

      </div>
    </div>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-[#121a2b] p-4 shadow">
      <p className="text-sm text-gray-400">{title}</p>
      <div className="mt-2 text-lg font-semibold">{children}</div>
    </div>
  );
}
