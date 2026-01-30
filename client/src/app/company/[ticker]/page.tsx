"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface Company {
  symbol: string;
  name: string;
  sector: string;
  industry: string;
  marketCap: string;
  peRatio: string;
  dividendYield: string;
  description: string;
}

export default function CompanyPage() {
  const params = useParams();
  const ticker =
    typeof params?.ticker === "string"
      ? params.ticker.toUpperCase()
      : "";

  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ticker) return;

    fetch(`http://localhost:8080/api/company/${ticker}`)
      .then(res => res.json())
      .then(data => {
        setCompany(data.company);
        setLoading(false);
      });
  }, [ticker]);

  if (loading) return <p className="p-6">Loading company info...</p>;
  if (!company) return <p className="p-6">No data found</p>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-emerald-50 p-6">
      <div className="mx-auto max-w-4xl space-y-6">

        {/* Header */}
        <div className="rounded-2xl bg-slate-900 p-6 text-white shadow-lg">
          <h1 className="text-3xl font-bold">{company.name}</h1>
          <p className="text-slate-300">{company.symbol}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Stat label="Sector" value={company.sector} />
          <Stat label="Industry" value={company.industry} />
          <Stat label="Market Cap" value={company.marketCap} />
          <Stat label="P/E Ratio" value={company.peRatio} />
          <Stat label="Dividend Yield" value={company.dividendYield || "N/A"} />
        </div>

        {/* Description */}
        <div className="rounded-xl bg-white p-6 shadow-md">
          <h2 className="mb-2 text-lg font-semibold text-slate-700">
            About the Company
          </h2>
          <p className="text-slate-600 leading-relaxed">
            {company.description}
          </p>
        </div>

      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-800">
        {value}
      </p>
    </div>
  );
}
