"use client";

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchPortfolioPrices, resetPortfolio } from '../../store/slices/portfolioSlice';
import { PortfolioSummary } from '../../components/PortfolioSummary';
import { HoldingsTable } from '../../components/HoldingsTable';
import { TransactionForm } from '../../components/TransactionForm';
import { TransactionHistory } from '../../components/TransactionHistory';
import { AllocationChart } from '../../components/AllocationChart';
import { PortfolioPerformanceChart } from '../../components/PortfolioPerformanceChart';
import { StockPerformanceChart } from '../../components/StockPerformanceChart';
import { DrawdownChart } from '../../components/DrawdownChart';
import { CumulativeReturnChart } from '../../components/CumulativeReturnChart';
import { PnLContributionChart } from '../../components/PnLContributionChart';
import { stockApi } from '../../services/api';
import { HoldingAnalysisModal } from '../../components/HoldingAnalysisModal';
import type { HistoricalDataPoint } from '../../types';
import type { PortfolioHolding } from '../../types';

type DateRangeKey = '1M' | '3M' | '6M' | '1Y' | 'YTD' | 'ALL';

/**
 * Portfolio Page
 * Modern portfolio management with trading-site theme
 */
export default function Portfolio() {
  const dispatch = useAppDispatch();
  const { holdings, transactions, cashBalance, initialBalance, currentPrices, status } = useAppSelector(
    (state) => state.portfolio
  );

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'buy' | 'sell'>('buy');
  const [selectedHolding, setSelectedHolding] = useState<PortfolioHolding | null>(null);
  const [dateRange, setDateRange] = useState<DateRangeKey>('ALL');
  const [portfolioHistory, setPortfolioHistory] = useState<{ date: string; value: number }[]>([]);
  const [stockHistories, setStockHistories] = useState<Record<string, HistoricalDataPoint[]>>({});
  const [loadingHistory, setLoadingHistory] = useState(false);

  const dateRangeOptions: { key: DateRangeKey; label: string }[] = [
    { key: '1M', label: '1M' },
    { key: '3M', label: '3M' },
    { key: '6M', label: '6M' },
    { key: '1Y', label: '1Y' },
    { key: 'YTD', label: 'YTD' },
    { key: 'ALL', label: 'All' },
  ];

  const handleAddToPortfolio = useCallback(() => {
    setSelectedHolding(null);
    setModalMode('buy');
    setIsModalOpen(true);
  }, []);

  const [analysisModal, setAnalysisModal] = useState<null | { symbol: string; purchaseDate: string; purchasePrice: number; shares: number }>(null);

  const handleSellClick = useCallback((holding: PortfolioHolding) => {
    setSelectedHolding(holding);
    setModalMode('sell');
    setIsModalOpen(true);
  }, []);


  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    setSelectedHolding(null);
  }, []);

  useEffect(() => {
    if (holdings.length > 0) {
      dispatch(fetchPortfolioPrices());
    }
  }, [dispatch, holdings.length]);

  useEffect(() => {
    if (holdings.length === 0) return;
    const interval = setInterval(() => {
      dispatch(fetchPortfolioPrices());
    }, 30000);
    return () => clearInterval(interval);
  }, [dispatch, holdings.length]);

  // Calculate portfolio value over time from transactions
  useEffect(() => {
    if (transactions.length === 0) {
      setPortfolioHistory([]);
      return;
    }

    const history: { date: string; value: number }[] = [];
    const sortedTransactions = [...transactions].sort((a, b) => a.timestamp - b.timestamp);
    
    let runningCash = initialBalance;
    const runningHoldings: Record<string, { shares: number; avgCost: number }> = {};

    sortedTransactions.forEach((tx) => {
      const date = new Date(tx.timestamp).toISOString().split('T')[0];
      
      if (tx.type === 'buy') {
        runningCash -= tx.total;
        if (runningHoldings[tx.symbol]) {
          const totalShares = runningHoldings[tx.symbol].shares + tx.shares;
          const totalCost = runningHoldings[tx.symbol].avgCost * runningHoldings[tx.symbol].shares + tx.total;
          runningHoldings[tx.symbol] = {
            shares: totalShares,
            avgCost: totalCost / totalShares,
          };
        } else {
          runningHoldings[tx.symbol] = {
            shares: tx.shares,
            avgCost: tx.price,
          };
        }
      } else {
        runningCash += tx.total;
        if (runningHoldings[tx.symbol]) {
          runningHoldings[tx.symbol].shares -= tx.shares;
          if (runningHoldings[tx.symbol].shares <= 0) {
            delete runningHoldings[tx.symbol];
          }
        }
      }

      // Use current price or average cost for market value
      const marketValue = Object.entries(runningHoldings).reduce((sum, [symbol, holding]) => {
        const currentPrice = currentPrices[symbol] || holding.avgCost;
        return sum + currentPrice * holding.shares;
      }, 0);

      history.push({
        date,
        value: runningCash + marketValue,
      });
    });

    setPortfolioHistory(history);
  }, [transactions, initialBalance, currentPrices]);

  // Fetch historical data for stocks
  useEffect(() => {
    if (holdings.length === 0) {
      setStockHistories({});
      return;
    }

    const fetchHistories = async () => {
      setLoadingHistory(true);
      const histories: Record<string, HistoricalDataPoint[]> = {};

      for (const holding of holdings) {
        try {
          const firstBuyTx = transactions
            .filter((tx) => tx.symbol === holding.symbol && tx.type === 'buy')
            .sort((a, b) => a.timestamp - b.timestamp)[0];

          if (firstBuyTx) {
            const purchaseDate = new Date(firstBuyTx.timestamp);
            const daysSincePurchase = Math.floor(
              (Date.now() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24)
            );
            
            let timeRange: '1M' | '3M' | '6M' | '1Y' = '1M';
            if (daysSincePurchase > 365) timeRange = '1Y';
            else if (daysSincePurchase > 180) timeRange = '6M';
            else if (daysSincePurchase > 90) timeRange = '3M';

            const data = await stockApi.getHistoricalData(holding.symbol, timeRange);
            histories[holding.symbol] = data.filter(
              (point) => new Date(point.date) >= purchaseDate
            );
          }
        } catch {
          // Skip if fetch fails
        }
      }

      setStockHistories(histories);
      setLoadingHistory(false);
    };

    fetchHistories();
  }, [holdings, transactions]);

  const handleResetPortfolio = useCallback(() => {
    dispatch(resetPortfolio());
    setShowResetConfirm(false);
  }, [dispatch]);

  const handleRefresh = useCallback(() => {
    dispatch(fetchPortfolioPrices());
  }, [dispatch]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const marketValue = holdings.reduce((total, holding) => {
      const currentPrice = currentPrices[holding.symbol] || holding.averageCost;
      return total + currentPrice * holding.shares;
    }, 0);

    const totalCostBasis = holdings.reduce((total, holding) => total + holding.totalCost, 0);
    const unrealizedPnL = marketValue - totalCostBasis;
    const unrealizedPnLPercent = totalCostBasis > 0 ? (unrealizedPnL / totalCostBasis) * 100 : 0;
    const totalValue = marketValue + cashBalance;
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

  // Get first purchase date for each holding
  const getPurchaseDate = useCallback(
    (symbol: string) => {
      const firstBuy = transactions
        .filter((tx) => tx.symbol === symbol && tx.type === 'buy')
        .sort((a, b) => a.timestamp - b.timestamp)[0];
      return firstBuy ? new Date(firstBuy.timestamp).toISOString().split('T')[0] : '';
    },
    [transactions]
  );

  const handleViewClick = useCallback((holding: PortfolioHolding) => {
    setAnalysisModal({
      symbol: holding.symbol,
      purchaseDate: getPurchaseDate(holding.symbol),
      purchasePrice: holding.averageCost,
      shares: holding.shares,
    });
  }, [getPurchaseDate]);

  // Filter portfolio history by date range
  const filteredPortfolioHistory = useMemo(() => {
    if (portfolioHistory.length === 0) return [];
    const now = new Date();
    const rangeStart = (() => {
      switch (dateRange) {
        case '1M': {
          const d = new Date(now);
          d.setMonth(d.getMonth() - 1);
          return d;
        }
        case '3M': {
          const d = new Date(now);
          d.setMonth(d.getMonth() - 3);
          return d;
        }
        case '6M': {
          const d = new Date(now);
          d.setMonth(d.getMonth() - 6);
          return d;
        }
        case '1Y': {
          const d = new Date(now);
          d.setFullYear(d.getFullYear() - 1);
          return d;
        }
        case 'YTD': {
          return new Date(now.getFullYear(), 0, 1);
        }
        default:
          return new Date(0);
      }
    })();
    return portfolioHistory.filter((h) => new Date(h.date) >= rangeStart);
  }, [portfolioHistory, dateRange]);

  // Management metrics: realized P&L, inception, period return, max drawdown
  const managementMetrics = useMemo(() => {
    let realizedPnL = 0;
    const runningHoldings: Record<string, { shares: number; avgCost: number }> = {};
    const sortedTx = [...transactions].sort((a, b) => a.timestamp - b.timestamp);

    sortedTx.forEach((tx) => {
      if (tx.type === 'buy') {
        if (runningHoldings[tx.symbol]) {
          const totalShares = runningHoldings[tx.symbol].shares + tx.shares;
          const totalCost =
            runningHoldings[tx.symbol].avgCost * runningHoldings[tx.symbol].shares + tx.total;
          runningHoldings[tx.symbol] = { shares: totalShares, avgCost: totalCost / totalShares };
        } else {
          runningHoldings[tx.symbol] = { shares: tx.shares, avgCost: tx.price };
        }
      } else {
        const h = runningHoldings[tx.symbol];
        if (h) {
          const costBasis = h.avgCost * tx.shares;
          realizedPnL += tx.total - costBasis;
          h.shares -= tx.shares;
          if (h.shares <= 0) delete runningHoldings[tx.symbol];
        }
      }
    });

    const inceptionDate =
      transactions.length > 0
        ? new Date(
            Math.min(...transactions.map((t) => t.timestamp))
          ).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : null;

    const periodReturn =
      filteredPortfolioHistory.length >= 2
        ? ((filteredPortfolioHistory[filteredPortfolioHistory.length - 1].value -
            filteredPortfolioHistory[0].value) /
            filteredPortfolioHistory[0].value) *
          100
        : null;

    let maxDrawdown = 0;
    if (filteredPortfolioHistory.length >= 2) {
      let peak = filteredPortfolioHistory[0].value;
      filteredPortfolioHistory.forEach((h) => {
        if (h.value > peak) peak = h.value;
        const dd = peak > 0 ? ((peak - h.value) / peak) * 100 : 0;
        if (dd > maxDrawdown) maxDrawdown = dd;
      });
    }

    return { realizedPnL, inceptionDate, periodReturn, maxDrawdown };
  }, [transactions, filteredPortfolioHistory]);

  // P&L by holding for bar chart
  const pnlByHolding = useMemo(
    () =>
      holdings.map((h) => {
        const currentPrice = currentPrices[h.symbol] ?? h.averageCost;
        const marketValue = currentPrice * h.shares;
        const unrealizedPnL = marketValue - h.totalCost;
        return { symbol: h.symbol, unrealizedPnL, realizedPnL: 0 };
      }),
    [holdings, currentPrices]
  );

  return (
    <div className="min-h-screen bg-[#0d1117] text-gray-200 p-4 sm:p-6 lg:p-8">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-white">Portfolio Manager</h1>
            <p className="text-sm text-gray-500 mt-0.5">Track performance, drawdowns, and P&L by date range</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={status === 'loading'}
              className="px-4 py-2 text-sm font-semibold bg-[#21262d] border border-[#30363d] text-gray-300 rounded hover:bg-[#30363d] transition-colors disabled:opacity-50"
            >
              {status === 'loading' ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent" />
                  Updating
                </span>
              ) : (
                'Refresh'
              )}
            </button>
            <button
              onClick={() => setShowResetConfirm(true)}
              className="px-4 py-2 text-sm font-semibold bg-[#21262d] border border-[#30363d] text-[#f85149] rounded hover:bg-[#30363d] transition-colors"
            >
              Reset
            </button>
            <button
              onClick={handleAddToPortfolio}
              className="px-5 py-2 text-sm font-semibold bg-[#238636] text-white rounded hover:bg-[#2ea043] transition-colors"
            >
              Add to Portfolio
            </button>
          </div>
        </div>

        {/* Management summary: inception, date range, period stats */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              {managementMetrics.inceptionDate && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 uppercase tracking-wider">Portfolio since</span>
                  <span className="text-sm font-mono font-semibold text-white">
                    {managementMetrics.inceptionDate}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 uppercase tracking-wider">Date range</span>
                <div className="flex rounded border border-[#30363d] overflow-hidden">
                  {dateRangeOptions.map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => setDateRange(opt.key)}
                      className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                        dateRange === opt.key
                          ? 'bg-[#238636] text-white'
                          : 'bg-[#0d1117] text-gray-500 hover:bg-[#21262d] hover:text-gray-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-6">
              {managementMetrics.periodReturn !== null && filteredPortfolioHistory.length >= 2 && (
                <div>
                  <span className="text-xs text-gray-500 uppercase tracking-wider">Period return</span>
                  <p
                    className={`text-sm font-mono font-semibold ${
                      managementMetrics.periodReturn >= 0 ? 'text-[#238636]' : 'text-[#f85149]'
                    }`}
                  >
                    {managementMetrics.periodReturn >= 0 ? '+' : ''}
                    {managementMetrics.periodReturn.toFixed(2)}%
                  </p>
                </div>
              )}
              {managementMetrics.maxDrawdown > 0 && (
                <div>
                  <span className="text-xs text-gray-500 uppercase tracking-wider">Max drawdown</span>
                  <p className="text-sm font-mono font-semibold text-[#f85149]">
                    -{managementMetrics.maxDrawdown.toFixed(2)}%
                  </p>
                </div>
              )}
              <div>
                <span className="text-xs text-gray-500 uppercase tracking-wider">Realized P&L</span>
                <p
                  className={`text-sm font-mono font-semibold ${
                    managementMetrics.realizedPnL >= 0 ? 'text-[#238636]' : 'text-[#f85149]'
                  }`}
                >
                  {managementMetrics.realizedPnL >= 0 ? '+' : ''}$
                  {managementMetrics.realizedPnL.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Total Value</p>
            <p className="text-2xl sm:text-3xl font-mono font-bold text-white tabular-nums">
              ${metrics.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p
              className={`text-sm font-mono mt-1 ${
                metrics.totalPnL >= 0 ? 'text-[#238636]' : 'text-[#f85149]'
              }`}
            >
              {metrics.totalPnL >= 0 ? '+' : ''}${metrics.totalPnL.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{' '}
              ({metrics.totalPnLPercent >= 0 ? '+' : ''}
              {metrics.totalPnLPercent.toFixed(2)}%)
            </p>
          </div>
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Market Value</p>
            <p className="text-2xl sm:text-3xl font-mono font-bold text-white tabular-nums">
              ${metrics.marketValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-gray-500 mt-1">{holdings.length} holdings</p>
          </div>
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Cash</p>
            <p className="text-2xl sm:text-3xl font-mono font-bold text-white tabular-nums">
              ${cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {((cashBalance / metrics.totalValue) * 100).toFixed(1)}% of portfolio
            </p>
          </div>
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Unrealized P&L</p>
            <p
              className={`text-2xl sm:text-3xl font-mono font-bold tabular-nums ${
                metrics.unrealizedPnL >= 0 ? 'text-[#238636]' : 'text-[#f85149]'
              }`}
            >
              {metrics.unrealizedPnL >= 0 ? '+' : ''}${metrics.unrealizedPnL.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
            <p
              className={`text-sm font-mono mt-1 ${
                metrics.unrealizedPnLPercent >= 0 ? 'text-[#238636]' : 'text-[#f85149]'
              }`}
            >
              {metrics.unrealizedPnLPercent >= 0 ? '+' : ''}
              {metrics.unrealizedPnLPercent.toFixed(2)}%
            </p>
          </div>
        </div>

        {/* Portfolio charts: value, cumulative return, drawdown */}
        {filteredPortfolioHistory.length > 0 && (
          <div className="space-y-6">
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Portfolio Value</h2>
              <PortfolioPerformanceChart
                dates={filteredPortfolioHistory.map((h) => h.date)}
                portfolioValues={filteredPortfolioHistory.map((h) => h.value)}
                className="h-80"
              />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6">
                <CumulativeReturnChart
                  dates={filteredPortfolioHistory.map((h) => h.date)}
                  portfolioValues={filteredPortfolioHistory.map((h) => h.value)}
                  className="h-64"
                />
              </div>
              <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6">
                <DrawdownChart
                  dates={filteredPortfolioHistory.map((h) => h.date)}
                  portfolioValues={filteredPortfolioHistory.map((h) => h.value)}
                  className="h-64"
                />
              </div>
            </div>
          </div>
        )}

        {/* Holdings table - full width */}
        <div>
          <HoldingsTable onSellClick={handleSellClick} onViewClick={handleViewClick} getPurchaseDate={getPurchaseDate} />
        </div>

        {/* Allocation and P&L charts - side by side, equal height */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="min-h-80">
            <AllocationChart />
          </div>
          {holdings.length > 0 ? (
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6 min-h-80 flex flex-col">
              <h3 className="text-lg font-semibold text-white mb-4">P&L by Holding</h3>
              <div className="flex-1 min-h-[280px]">
                <PnLContributionChart holdings={pnlByHolding} className="h-full min-h-[280px]" />
              </div>
            </div>
          ) : (
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6 flex items-center justify-center min-h-80">
              <p className="text-gray-500 text-sm">Add holdings to see P&L by holding</p>
            </div>
          )}
        </div>

        {/* Individual Stock Performance Charts */}
        {holdings.length > 0 && (
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Stock Performance</h2>
            {loadingHistory ? (
              <div className="flex items-center justify-center py-12">
                <span className="animate-spin rounded-full h-8 w-8 border-2 border-[#58a6ff] border-t-transparent" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {holdings.map((holding) => {
                  const history = stockHistories[holding.symbol];
                  const purchaseDate = getPurchaseDate(holding.symbol);
                  const purchasePrice = holding.averageCost;

                  if (!history || history.length === 0) return null;

                  return (
                    <StockPerformanceChart
                      key={holding.symbol}
                      symbol={holding.symbol}
                      dates={history.map((h) => h.date)}
                      prices={history.map((h) => h.close)}
                      purchasePrice={purchasePrice}
                      purchaseDate={purchaseDate}
                      className="h-64"
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Transaction History */}
        <TransactionHistory limit={10} />

        {/* Add / Sell Modal */}
        <TransactionForm
          isOpen={isModalOpen}
          onClose={handleModalClose}
          mode={modalMode}
          prefilledHolding={selectedHolding}
        />

        {/* Holding Analysis Modal */}
        {analysisModal && (
          <HoldingAnalysisModal
            symbol={analysisModal.symbol}
            purchaseDate={analysisModal.purchaseDate}
            purchasePrice={analysisModal.purchasePrice}
            shares={analysisModal.shares}
            onClose={() => setAnalysisModal(null)}
          />
        )}

        {/* Reset Confirmation Modal */}
        {showResetConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setShowResetConfirm(false)}
            />
            <div className="relative bg-[#161b22] border border-[#30363d] rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-white mb-2">Reset Portfolio?</h3>
                <p className="text-sm text-gray-500 mb-6">
                  This will delete all holdings and transaction history. You will start fresh with $
                  {initialBalance.toLocaleString('en-US')} virtual cash.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="flex-1 px-4 py-2 text-sm font-semibold bg-[#21262d] border border-[#30363d] text-gray-300 rounded hover:bg-[#30363d] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleResetPortfolio}
                    className="flex-1 px-4 py-2 text-sm font-semibold bg-[#f85149] text-white rounded hover:bg-[#da3633] transition-colors"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
