import { memo, useMemo } from 'react';
import { useAppSelector } from '../store/hooks';

/**
 * Portfolio Summary Component
 * Displays total portfolio value, P&L, and cash balance
 */
export const PortfolioSummary = memo(function PortfolioSummary() {
  const { holdings, cashBalance, initialBalance, currentPrices, status } = useAppSelector(
    (state) => state.portfolio
  );

  // Calculate portfolio metrics
  const metrics = useMemo(() => {
    // Calculate total market value of holdings
    const marketValue = holdings.reduce((total, holding) => {
      const currentPrice = currentPrices[holding.symbol] || holding.averageCost;
      return total + currentPrice * holding.shares;
    }, 0);

    // Calculate total cost basis
    const totalCostBasis = holdings.reduce((total, holding) => {
      return total + holding.totalCost;
    }, 0);

    // Calculate unrealized P&L
    const unrealizedPnL = marketValue - totalCostBasis;
    const unrealizedPnLPercent = totalCostBasis > 0 ? (unrealizedPnL / totalCostBasis) * 100 : 0;

    // Total portfolio value (holdings + cash)
    const totalValue = marketValue + cashBalance;

    // Total P&L (from initial balance)
    const totalPnL = totalValue - initialBalance;
    const totalPnLPercent = initialBalance > 0 ? (totalPnL / initialBalance) * 100 : 0;

    return {
      marketValue,
      totalCostBasis,
      unrealizedPnL,
      unrealizedPnLPercent,
      totalValue,
      totalPnL,
      totalPnLPercent,
    };
  }, [holdings, cashBalance, initialBalance, currentPrices]);

  const isLoading = status === 'loading';

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Portfolio Summary</h2>
        {isLoading && (
          <span className="animate-spin rounded-full h-4 w-4 border-2 border-[#58a6ff] border-t-transparent" />
        )}
      </div>

      {/* Main Value */}
      <div className="mb-6">
        <p className="text-gray-500 text-sm mb-1 uppercase tracking-wider">Total Portfolio Value</p>
        <p className="text-4xl font-bold text-white font-mono tabular-nums">
          ${metrics.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        <div
          className={`inline-flex items-center gap-1 mt-2 px-3 py-1 rounded-lg text-sm font-medium font-mono ${
            metrics.totalPnL >= 0
              ? 'bg-[#238636]/20 text-[#238636]'
              : 'bg-[#f85149]/20 text-[#f85149]'
          }`}
        >
          <svg
            className={`w-4 h-4 ${metrics.totalPnL >= 0 ? '' : 'rotate-180'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 10l7-7m0 0l7 7m-7-7v18"
            />
          </svg>
          {metrics.totalPnL >= 0 ? '+' : ''}
          ${metrics.totalPnL.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          ({metrics.totalPnLPercent >= 0 ? '+' : ''}{metrics.totalPnLPercent.toFixed(2)}%)
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          label="Cash Balance"
          value={`$${cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={null}
        />
        <SummaryCard
          label="Market Value"
          value={`$${metrics.marketValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={null}
        />
        <SummaryCard
          label="Cost Basis"
          value={`$${metrics.totalCostBasis.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={null}
        />
        <SummaryCard
          label="Unrealized P&L"
          value={`${metrics.unrealizedPnL >= 0 ? '+' : ''}$${metrics.unrealizedPnL.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subValue={`${metrics.unrealizedPnLPercent >= 0 ? '+' : ''}${metrics.unrealizedPnLPercent.toFixed(2)}%`}
          highlight={metrics.unrealizedPnL >= 0 ? 'positive' : 'negative'}
          icon={null}
        />
      </div>

      {/* Holdings Count */}
      <div className="mt-6 pt-4 border-t border-[#30363d]">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">
            Holding {holdings.length} {holdings.length === 1 ? 'stock' : 'stocks'}
          </span>
          <span className="text-gray-500">
            Initial Balance: ${initialBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>
    </div>
  );
});

/**
 * Summary Card Component
 */
interface SummaryCardProps {
  label: string;
  value: string;
  subValue?: string;
  highlight?: 'positive' | 'negative';
  icon: React.ReactNode;
}

const SummaryCard = memo(function SummaryCard({
  label,
  value,
  subValue,
  highlight,
  icon,
}: SummaryCardProps) {
  return (
    <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-4">
      <span className="text-gray-500 text-xs uppercase tracking-wider">{label}</span>
      <p
        className={`font-semibold text-lg font-mono mt-1 ${
          highlight === 'positive'
            ? 'text-[#238636]'
            : highlight === 'negative'
            ? 'text-[#f85149]'
            : 'text-white'
        }`}
      >
        {value}
      </p>
      {subValue && (
        <p
          className={`text-xs mt-1 font-mono ${
            highlight === 'positive'
              ? 'text-[#238636]'
              : highlight === 'negative'
              ? 'text-[#f85149]'
              : 'text-gray-500'
          }`}
        >
          {subValue}
        </p>
      )}
    </div>
  );
});
