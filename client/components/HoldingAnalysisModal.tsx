import { memo, useEffect, useMemo, useState } from 'react';
import { stockApi } from '../services/api';
import type { HistoricalDataPoint } from '../types';
import { Line } from 'react-chartjs-2';

interface HoldingAnalysisModalProps {
  symbol: string;
  purchaseDate: string; // YYYY-MM-DD
  purchasePrice: number;
  shares: number;
  onClose: () => void;
}

export const HoldingAnalysisModal = memo(function HoldingAnalysisModal({
  symbol,
  purchaseDate,
  purchasePrice,
  shares,
  onClose,
}: HoldingAnalysisModalProps) {
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<HistoricalDataPoint[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      setError(null);

      try {
        const fromSec = Math.floor(new Date(purchaseDate).getTime() / 1000);
        const toSec = Math.floor(new Date(endDate).getTime() / 1000) + 24 * 60 * 60;

        // 1) Try precise range query (best effort)
        let data = await stockApi.getHistoricalRange(symbol, fromSec, toSec, 'D');

        // 2) If empty, pick an appropriate timeRange and fetch broader history
        const daysSpan = Math.ceil((toSec - fromSec) / (24 * 60 * 60));
        const pickTimeRange = (): '1M' | '3M' | '6M' | '1Y' | '5Y' => {
          if (daysSpan <= 30) return '1M';
          if (daysSpan <= 90) return '3M';
          if (daysSpan <= 180) return '6M';
          if (daysSpan <= 365) return '1Y';
          return '5Y';
        };

        if (!data || data.length === 0) {
          const timeRange = pickTimeRange();
          const hist = await stockApi.getHistoricalData(symbol, timeRange);
          data = hist.filter((d) => new Date(d.date) >= new Date(purchaseDate) && new Date(d.date) <= new Date(endDate));
        }

        // 3) If still empty, attempt per-day price fetch up to a safe cap
        if ((!data || data.length === 0) && daysSpan <= 90) {
          const promises: Promise<HistoricalDataPoint | null>[] = [];
          for (let i = 0; i <= daysSpan; i++) {
            const dt = new Date(purchaseDate);
            dt.setDate(dt.getDate() + i);
            const ts = dt.getTime();
            promises.push(
              (async () => {
                try {
                  const price = await stockApi.getPriceAtDate(symbol, ts);
                  return {
                    date: dt.toISOString().split('T')[0],
                    open: price,
                    high: price,
                    low: price,
                    close: price,
                    volume: 0,
                  } as HistoricalDataPoint;
                } catch {
                  return null;
                }
              })()
            );
          }

          const results = (await Promise.all(promises)).filter(Boolean) as HistoricalDataPoint[];
          if (results.length > 0) data = results;
        }

        // 4) Final fallback: at least return purchase and end date points
        if (!data || data.length === 0) {
          try {
            const p = await stockApi.getPriceAtDate(symbol, new Date(purchaseDate).getTime());
            const e = await stockApi.getPriceAtDate(symbol, new Date(endDate).getTime());
            data = [
              { date: purchaseDate, open: p, high: p, low: p, close: p, volume: 0 },
              { date: endDate, open: e, high: e, low: e, close: e, volume: 0 },
            ];
            // Keep error null — we provide fallback data
          } catch {
            throw new Error('No historical data available');
          }
        }

        // Normalize and set
        const filtered = data
          .filter((d: HistoricalDataPoint) => new Date(d.date) >= new Date(purchaseDate) && new Date(d.date) <= new Date(endDate))
          .sort((a: HistoricalDataPoint, b: HistoricalDataPoint) => new Date(a.date).getTime() - new Date(b.date).getTime());

        setHistory(filtered);

        // If the retrieved dataset is small, warn the user (but don't fail)
        if (!filtered || filtered.length === 0) {
          setError('No data available for the selected range');
        }
      } catch (err) {
        // Try a last-chance two-point fallback
        try {
          const p = await stockApi.getPriceAtDate(symbol, new Date(purchaseDate).getTime());
          const e = await stockApi.getPriceAtDate(symbol, new Date(endDate).getTime());
          setHistory([
            { date: purchaseDate, open: p, high: p, low: p, close: p, volume: 0 },
            { date: endDate, open: e, high: e, low: e, close: e, volume: 0 },
          ]);
          setError(null);
        } catch {
          setError('Failed to load historical data');
          setHistory([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [symbol, purchaseDate, endDate]);

  const chart = useMemo(() => {
    const dates = history.map((h) => h.date);
    const prices = history.map((h) => h.close);

    const pnl = prices.map((p) => (p - purchasePrice) * shares);
    const pnlPercent = prices.map((p) => ((p - purchasePrice) / purchasePrice) * 100);

    return {
      labels: dates,
      datasets: [
        {
          label: 'Price',
          data: prices,
          borderColor: '#58a6ff',
          backgroundColor: 'rgba(88,166,255,0.08)',
          yAxisID: 'y',
          tension: 0.1,
        },
        {
          label: 'P&L ($)',
          data: pnl,
          borderColor: '#238636',
          backgroundColor: 'rgba(35,134,54,0.12)',
          yAxisID: 'y1',
          tension: 0.1,
        },
      ],
    };
  }, [history, purchasePrice, shares]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index' as const, intersect: false },
    plugins: { legend: { position: 'top' as const } },
    scales: {
      y: { position: 'left' as const, ticks: { color: '#c9d1d9' } },
      y1: { position: 'right' as const, grid: { drawOnChartArea: false }, ticks: { color: '#c9d1d9' } },
    },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-800 rounded-xl shadow-xl w-full max-w-3xl mx-4 p-6 border border-slate-700 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-white">{symbol} — P&L Analysis</h2>
            <p className="text-sm text-slate-400">From {purchaseDate} to {endDate}</p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              max={new Date().toISOString().split('T')[0]}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 bg-slate-700/50 rounded border border-slate-600 text-white"
            />
            <button onClick={onClose} className="px-3 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded">Close</button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <span className="animate-spin rounded-full h-8 w-8 border-2 border-[#58a6ff] border-t-transparent" />
          </div>
        ) : error ? (
          <div className="p-4 bg-red-500/10 rounded text-red-400">{error}</div>
        ) : (
          <div className="h-[420px]">
            <Line data={chart} options={options as any} />
          </div>
        )}

        <div className="mt-4 text-sm text-slate-400">
          <p>Purchase price: <span className="text-white ml-2 font-mono">${purchasePrice.toFixed(2)}</span></p>
          <p>Shares: <span className="text-white ml-2 font-mono">{shares}</span></p>
        </div>
      </div>
    </div>
  );
});
