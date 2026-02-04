'use client';

import { memo, useMemo } from 'react';
import { useRouter } from 'next/navigation';

import { useAppSelector } from '@/store/hooks';
import type { PortfolioHolding } from '@/types';

interface HoldingsTableProps {
  onSellClick?: (holding: PortfolioHolding) => void;
  onViewClick?: (holding: PortfolioHolding) => void;
  getPurchaseDate?: (symbol: string) => string;
}

function daysHeld(purchaseDateStr: string): number | null {
  if (!purchaseDateStr) return null;
  const start = new Date(purchaseDateStr).getTime();
  const now = Date.now();
  return Math.floor((now - start) / (1000 * 60 * 60 * 24));
}

function formatHeld(days: number): string {
  if (days < 30) return `${days}d`;
  if (days < 365) return `${Math.floor(days / 30)}mo`;
  return `${(days / 365).toFixed(1)}y`;
}

/**
 * Holdings Table Component (Next.js)
 * Displays all portfolio holdings with current values and P&L
 */
export const HoldingsTable = memo(function HoldingsTable({
  onSellClick,
  onViewClick,
  getPurchaseDate,
}: HoldingsTableProps = {}) {
  const router = useRouter();
  const { holdings, currentPrices, status } = useAppSelector(
    (state) => state.portfolio
  );

  const extendedHoldings = useMemo(() => {
    return holdings.map((holding) => {
      const currentPrice =
        currentPrices[holding.symbol] || holding.averageCost;

      const marketValue = currentPrice * holding.shares;
      const unrealizedPnL = marketValue - holding.totalCost;
      const unrealizedPnLPercent =
        holding.totalCost > 0
          ? (unrealizedPnL / holding.totalCost) * 100
          : 0;

      return {
        ...holding,
        currentPrice,
        marketValue,
        unrealizedPnL,
        unrealizedPnLPercent,
      };
    });
  }, [holdings, currentPrices]);

  const isLoading = status === 'loading';

  if (holdings.length === 0) {
    return (
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Holdings</h3>
        <div className="text-center py-8">
          <p className="text-gray-400 mb-2">No holdings yet</p>
          <p className="text-gray-500 text-sm">Click &quot;Add to Portfolio&quot; above to add stocks. P&L and charts will track from the date you add each position.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Holdings ({holdings.length})</h3>
        {isLoading && (
          <span className="animate-spin rounded-full h-4 w-4 border-2 border-[#58a6ff] border-t-transparent" />
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-gray-500 text-xs uppercase tracking-wider border-b border-[#30363d]">
              <th className="text-left py-3 px-2">Symbol</th>
              <th className="text-right py-3 px-2">Shares</th>
              {getPurchaseDate && <th className="text-right py-3 px-2 hidden md:table-cell">Held</th>}
              <th className="text-right py-3 px-2 hidden sm:table-cell">Avg Cost</th>
              <th className="text-right py-3 px-2">Current</th>
              <th className="text-right py-3 px-2">Market Value</th>
              <th className="text-right py-3 px-2">P&L</th>
              {onSellClick && <th className="text-center py-3 px-2">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#21262d]">
            {extendedHoldings.map((holding) => (
              <tr
                key={holding.symbol}
                className="hover:bg-[#21262d] transition-colors cursor-pointer"
                onClick={() => router.push(`/stocks/${holding.symbol}`)}
              >
                <td className="py-4 px-2">
                  <p className="font-semibold text-white font-mono">{holding.symbol}</p>
                  <p className="text-gray-500 text-xs truncate max-w-[150px]">{holding.name}</p>
                </td>
                <td className="text-right py-4 px-2 text-white font-mono">
                  {holding.shares.toLocaleString()}
                </td>
                {getPurchaseDate && (
                  <td className="text-right py-4 px-2 text-gray-400 hidden md:table-cell font-mono text-xs">
                    {(() => {
                      const d = daysHeld(getPurchaseDate(holding.symbol));
                      return d !== null ? formatHeld(d) : '—';
                    })()}
                  </td>
                )}
                <td className="text-right py-4 px-2 text-gray-400 hidden sm:table-cell font-mono">
                  ${holding.averageCost.toFixed(2)}
                </td>
                <td className="text-right py-4 px-2 text-white font-mono">
                  ${holding.currentPrice.toFixed(2)}
                </td>
                <td className="text-right py-4 px-2 text-white font-medium font-mono">
                  ${holding.marketValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="text-right py-4 px-2">
                  <div className={holding.unrealizedPnL >= 0 ? 'text-[#238636]' : 'text-[#f85149]'}>
                    <p className="font-medium font-mono">
                      {holding.unrealizedPnL >= 0 ? '+' : ''}${holding.unrealizedPnL.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                    <p className="text-xs font-mono opacity-70">
                      {holding.unrealizedPnLPercent >= 0 ? '+' : ''}
                      {holding.unrealizedPnLPercent.toFixed(2)}%
                    </p>
                  </div>
                </td>
                <td className="text-center py-4 px-2 flex items-center justify-center gap-2">
                  {onViewClick && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewClick(holding);
                      }}
                      className="px-3 py-1.5 text-xs font-semibold bg-[#238636]/20 text-[#238636] rounded border border-[#238636]/40 hover:bg-[#238636]/30 transition-colors"
                    >
                      View
                    </button>
                  )}
                  {onSellClick && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSellClick(holding);
                      }}
                      className="px-3 py-1.5 text-xs font-semibold bg-[#f85149]/20 text-[#f85149] rounded border border-[#f85149]/40 hover:bg-[#f85149]/30 transition-colors"
                    >
                      Sell
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 pt-4 border-t border-[#30363d]">
        <div className="flex justify-between items-center">
          <span className="text-gray-500 text-sm">Total Market Value</span>
          <span className="text-white font-semibold font-mono">
            ${extendedHoldings.reduce((sum, h) => sum + h.marketValue, 0).toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>
      </div>
    </div>
  );
});
