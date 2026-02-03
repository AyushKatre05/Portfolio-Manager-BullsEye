'use client';

import { memo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { StockQuote } from '../types';

interface StockTableProps {
  stocks: StockQuote[];
  title?: string;
  isLoading?: boolean;
  onAddToWatchlist?: (symbol: string, name: string) => void;
  watchlistSymbols?: string[];
}

/**
 * Stock Table Component (Next.js)
 */
export const StockTable = memo(function StockTable({
  stocks,
  title = 'Stocks',
  isLoading = false,
  onAddToWatchlist,
  watchlistSymbols = [],
}: StockTableProps) {
  const router = useRouter();

  const handleRowClick = useCallback(
    (symbol: string) => {
      router.push(`/stock/${symbol}`);
    },
    [router]
  );

  const handleWatchlistClick = useCallback(
    (e: React.MouseEvent, symbol: string, name: string) => {
      e.stopPropagation();
      onAddToWatchlist?.(symbol, name);
    },
    [onAddToWatchlist]
  );

  if (isLoading) {
    return (
      <div className="bg-card rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-700">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
        </div>
        <div className="p-8 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-400">Loading stocks...</p>
          </div>
        </div>
      </div>
    );
  }

  if (stocks.length === 0) {
    return (
      <div className="bg-card rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-700">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
        </div>
        <div className="p-8 text-center">
          <p className="text-slate-400">No stocks to display</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl overflow-hidden">
      <div className="p-4 border-b border-slate-700 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <span className="text-sm text-slate-400">
          {stocks.length} stocks
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="stock-table">
          <thead className="bg-slate-800/50">
            <tr>
              <th className="w-12"></th>
              <th>Symbol</th>
              <th>Name</th>
              <th className="text-right">Price</th>
              <th className="text-right">Change</th>
              <th className="text-right">% Change</th>
              <th className="text-right hidden md:table-cell">High</th>
              <th className="text-right hidden md:table-cell">Low</th>
            </tr>
          </thead>
          <tbody>
            {stocks.map((stock) => {
              const isPositive = stock.changePercent >= 0;
              const isInWatchlist = watchlistSymbols.includes(stock.symbol);

              return (
                <tr
                  key={stock.symbol}
                  onClick={() => handleRowClick(stock.symbol)}
                  className="cursor-pointer"
                >
                  <td className="w-12">
                    <button
                      onClick={(e) =>
                        handleWatchlistClick(e, stock.symbol, stock.name)
                      }
                      className={`p-1.5 rounded-lg transition-colors ${
                        isInWatchlist
                          ? 'text-yellow-400 hover:text-yellow-300'
                          : 'text-slate-500 hover:text-yellow-400'
                      }`}
                    >
                      ★
                    </button>
                  </td>

                  <td className="font-semibold text-white">
                    {stock.symbol}
                  </td>

                  <td className="text-slate-300 truncate max-w-[150px] block">
                    {stock.name}
                  </td>

                  <td className="text-right text-white">
                    ${stock.price.toFixed(2)}
                  </td>

                  <td className="text-right">
                    <span
                      className={
                        isPositive ? 'text-positive' : 'text-negative'
                      }
                    >
                      {isPositive ? '+' : ''}
                      {stock.change.toFixed(2)}
                    </span>
                  </td>

                  <td className="text-right">
                    <span
                      className={`px-2 py-0.5 rounded text-sm font-medium ${
                        isPositive
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {isPositive ? '+' : ''}
                      {stock.changePercent.toFixed(2)}%
                    </span>
                  </td>

                  <td className="text-right hidden md:table-cell text-slate-300">
                    ${stock.high.toFixed(2)}
                  </td>

                  <td className="text-right hidden md:table-cell text-slate-300">
                    ${stock.low.toFixed(2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
});
