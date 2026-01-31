"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface Company {
  symbol: string;
  name: string;
  sector?: string | null;
  industry?: string | null;
  market_cap?: string | null;
  pe_ratio?: string | null;
  dividend_yield?: string | null;
  description?: string | null;
}

export default function CompanyPage() {
  const params = useParams();
  const ticker = typeof params?.ticker === "string" ? params.ticker.toUpperCase() : "";

  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ticker) return;

    fetch(`http://localhost:8080/api/company/${ticker}`)
      .then(res => {
        if (!res.ok) throw new Error(`Backend error: ${res.status}`);
        return res.json();
      })
      .then(data => {
        setCompany(data); // ← use data directly, not data.company
        setLoading(false);
      })
      .catch(err => {
        console.error("Fetch failed:", err);
        setError("Unable to load company data");
        setLoading(false);
      });
  }, [ticker]);

  if (loading) return <p className="p-6">Loading company info...</p>;
  if (error) return <p className="p-6 text-red-600">{error}</p>;
  if (!company) return <p className="p-6">No data found</p>;

  // Only render fields that exist and are not "-"
  const infoFields: { label: string; value?: string | null }[] = [
    { label: "Sector", value: company.sector },
    { label: "Industry", value: company.industry },
    { label: "Market Cap", value: company.market_cap },
    { label: "P/E Ratio", value: company.pe_ratio },
    { label: "Dividend Yield", value: company.dividend_yield },
  ].filter(f => f.value && f.value !== "-");

  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-4xl rounded-xl bg-white p-6 shadow">

        <h1 className="text-3xl font-bold text-slate-800">
          {company.name}
          <span className="ml-2 text-slate-500">({company.symbol})</span>
        </h1>

        {company.description && company.description !== "-" && (
          <p className="mt-4 text-slate-600 leading-relaxed">{company.description}</p>
        )}

        {infoFields.length > 0 && (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {infoFields.map(f => (
              <Info key={f.label} label={f.label} value={f.value!} />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-lg font-semibold text-slate-800">{value}</p>
    </div>
  );
}
