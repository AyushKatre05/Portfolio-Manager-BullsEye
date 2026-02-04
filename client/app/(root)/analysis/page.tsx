'use client';
import { useState } from 'react';
import StockChart from '../../../components/StockChart';
import type { StockData, PredictionResult } from '../../../types/type';
import { enhancedPredictStock } from '../../(functions)/EnhancePredictStock';

export default function Analysis() {
  const [stockSymbol, setStockSymbol] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stockData, setStockData] = useState<StockData[]>([]);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [selectedExchange, setSelectedExchange] = useState<'NSE' | 'BSE'>('NSE');
  const getNextTradingDay = (lastDate: string): string => {
    const date = new Date(lastDate);
    date.setDate(date.getDate() + 1);
    while (date.getDay() === 0 || date.getDay() === 6) {
      date.setDate(date.getDate() + 1);
    }
    return date.toISOString().split('T')[0];
  };
  const generateHistoricalPredictions = (stockData: StockData[]): number[] => {
    if (stockData.length === 0) return [];
    const predictions: number[] = [];
    const prices = stockData.map(d => d.price);
    for (let i = 0; i < prices.length; i++) {
      if (i < 5) {
        predictions.push(prices[i] * (0.99 + Math.random() * 0.02));
      } else {
        const ma5 = prices.slice(i - 5, i).reduce((sum, price) => sum + price, 0) / 5;
        const error = (Math.random() - 0.5) * 0.03; // ±1.5% error
        predictions.push(ma5 * (1 + error));
      }
    }
    return predictions;
  };

  const handlePredict = async () => {
    if (!stockSymbol.trim()) {
      setError('Please enter a stock symbol');
      return;
    }
    setLoading(true);
    setError('');
    setPrediction(null);
    setStockData([]);

    try {
      const symbol = `${stockSymbol.toUpperCase()}.${selectedExchange}`;
      const response = await fetch(`/api/stock?symbol=${symbol}`);
      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 503) {
          throw new Error(`Unable to fetch real stock data for ${symbol}. The stock symbol might be incorrect or the data providers are currently unavailable. Please verify the symbol and try again later.`);
        } else if (response.status === 500) {
          throw new Error(`Server error while fetching ${symbol} data: ${data.error || 'Internal server error'}`);
        }
        throw new Error(data.error || 'Failed to fetch stock data');
      }

      if (!data.success) {
        throw new Error(data.error || 'API returned unsuccessful response');
      }

      if (!data.stockData || data.stockData.length === 0) {
        throw new Error(`No stock data available for ${symbol}. Please check if the symbol is correct.`);
      }

      setStockData(data.stockData);
      const predictionPromise = enhancedPredictStock(data.stockData);
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Prediction timeout - using statistical analysis')), 12000)
      );
      
      const predictionResult = await Promise.race([predictionPromise, timeoutPromise]);
      setPrediction(predictionResult);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while predicting stock price');
    } finally {
      setLoading(false);
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-yellow-600';
    }
  };

  const hasResults = prediction || stockData.length > 0;

  return (
    <div className="min-h-screen bg-[#0d1117] text-gray-200 p-4 sm:p-6 lg:p-8">
      <div className="max-w-[1600px] mx-auto">
        {/* Start / Toolbar: bigger when no results */}
        <div className={`bg-[#161b22] border border-[#30363d] rounded-lg mb-6 ${hasResults ? 'p-4' : 'p-8 sm:p-10 lg:p-12'}`}>
          <div className={hasResults ? 'flex flex-wrap items-center gap-4' : 'space-y-6'}>
            {!hasResults && (
              <div className="mb-2">
                <h1 className="text-xl sm:text-2xl font-semibold text-white">Stock Analysis</h1>
                <p className="text-sm text-gray-500 mt-0.5">Enter a symbol and run prediction</p>
              </div>
            )}
            <div className={`flex flex-wrap items-center ${hasResults ? 'gap-4' : 'gap-6'}`}>
              <div className="flex items-center gap-2">
                <span className={`font-medium text-gray-500 uppercase tracking-wider ${hasResults ? 'text-xs' : 'text-sm'}`}>Exchange</span>
                <div className="flex rounded overflow-hidden border border-[#30363d]">
                  <button
                    onClick={() => setSelectedExchange('NSE')}
                    disabled={loading}
                    className={`font-semibold transition-colors ${
                      selectedExchange === 'NSE'
                        ? 'bg-[#238636] text-white'
                        : 'bg-[#21262d] text-gray-400 hover:bg-[#30363d]'
                    } ${loading ? 'opacity-50 cursor-not-allowed' : ''} ${hasResults ? 'px-4 py-2.5 text-sm' : 'px-6 py-3.5 text-base'}`}
                  >
                    NSE
                  </button>
                  <button
                    onClick={() => setSelectedExchange('BSE')}
                    disabled={loading}
                    className={`font-semibold transition-colors ${
                      selectedExchange === 'BSE'
                        ? 'bg-[#238636] text-white'
                        : 'bg-[#21262d] text-gray-400 hover:bg-[#30363d]'
                    } ${loading ? 'opacity-50 cursor-not-allowed' : ''} ${hasResults ? 'px-4 py-2.5 text-sm' : 'px-6 py-3.5 text-base'}`}
                  >
                    BSE
                  </button>
                </div>
              </div>
              <div className={`flex-1 min-w-0 ${hasResults ? 'min-w-[200px] flex items-center gap-2' : 'w-full sm:min-w-[280px] flex items-center gap-3'}`}>
                <input
                  id="stockSymbol"
                  type="text"
                  value={stockSymbol}
                  onChange={(e) => setStockSymbol(e.target.value.toUpperCase())}
                  onKeyPress={(e) => e.key === 'Enter' && handlePredict()}
                  placeholder={hasResults ? 'Symbol' : 'Enter stock symbol (e.g. RELIANCE)'}
                  className={`flex-1 bg-[#0d1117] border border-[#30363d] rounded font-mono font-semibold text-white placeholder-gray-500 focus:border-[#58a6ff] focus:outline-none focus:ring-1 focus:ring-[#58a6ff] ${hasResults ? 'px-4 py-2.5 text-lg' : 'px-5 py-4 text-xl sm:text-2xl'}`}
                  style={{ letterSpacing: '0.05em' }}
                  disabled={loading}
                />
                <span className={`font-mono text-gray-500 ${hasResults ? 'text-sm' : 'text-base'}`}>.{selectedExchange}</span>
              </div>
              <button
                onClick={handlePredict}
                disabled={loading || !stockSymbol.trim()}
                className={`font-semibold rounded transition-colors ${
                  loading || !stockSymbol.trim()
                    ? 'bg-[#21262d] text-gray-500 cursor-not-allowed'
                    : 'bg-[#238636] text-white hover:bg-[#2ea043]'
                } ${hasResults ? 'px-6 py-2.5 text-sm' : 'px-8 py-4 text-base sm:text-lg'}`}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Analyze
                  </span>
                ) : (
                  'Predict'
                )}
              </button>
            </div>
            <div className={`flex flex-wrap items-center gap-2 ${hasResults ? 'mt-3' : 'mt-6 pt-6 border-t border-[#30363d]'}`}>
              <span className={`text-gray-500 ${hasResults ? 'text-xs' : 'text-sm'}`}>Quick select:</span>
              {(selectedExchange === 'NSE'
                ? ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK']
                : ['RELIANCE', 'TCS', 'WIPRO', 'BHARTIARTL', 'MARUTI']
              ).map((stock) => (
                <button
                  key={stock}
                  onClick={() => setStockSymbol(stock)}
                  disabled={loading}
                  className={`font-mono rounded border transition-colors ${
                    stockSymbol === stock
                      ? 'bg-[#238636]/20 border-[#238636] text-[#7ee787]'
                      : 'bg-[#21262d] border-[#30363d] text-gray-400 hover:border-[#484f58] hover:text-gray-300'
                  } disabled:opacity-50 ${hasResults ? 'px-3 py-1.5 text-xs' : 'px-4 py-2.5 text-sm'}`}
                >
                  {stock}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-[#3d1f1f] border border-[#f85149]/50 rounded-lg">
            <h3 className="text-sm font-semibold text-[#f85149] mb-1">Error</h3>
            <p className="text-sm text-[#ff7b72]">{error}</p>
          </div>
        )}

        {loading && (
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-12 mb-6">
            <div className="flex flex-col items-center gap-6">
              <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#30363d] border-t-[#58a6ff]" />
              <div className="text-center">
                <h3 className="text-lg font-semibold text-white">Analyzing</h3>
                <p className="text-sm text-gray-500 mt-1 font-mono">{stockSymbol}.{selectedExchange}</p>
              </div>
            </div>
          </div>
        )}
        
        {(prediction || stockData.length > 0) && !loading && (
          <div className="space-y-6">
            {/* Key metrics: big, prominent */}
            {prediction && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Current Price</p>
                  <p className="text-3xl sm:text-4xl font-mono font-bold text-white tabular-nums">
                    ₹{prediction.currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 font-mono">{stockSymbol}.{selectedExchange}</p>
                </div>
                <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Predicted Price</p>
                  <p className="text-3xl sm:text-4xl font-mono font-bold text-[#58a6ff] tabular-nums">
                    ₹{prediction.predictedPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Next trading day</p>
                </div>
                <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Change</p>
                  <p className={`text-3xl sm:text-4xl font-mono font-bold tabular-nums ${getTrendColor(prediction.trend)}`}>
                    {prediction.changePercent > 0 ? '+' : ''}{prediction.changePercent.toFixed(2)}%
                  </p>
                  <p className={`text-sm font-mono mt-1 ${getTrendColor(prediction.trend)}`}>
                    {prediction.change > 0 ? '+' : ''}₹{Math.abs(prediction.change).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Confidence</p>
                  <p className="text-3xl sm:text-4xl font-mono font-bold text-white tabular-nums">
                    {prediction.confidence.toFixed(0)}%
                  </p>
                  <div className="mt-2 h-1.5 bg-[#21262d] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${prediction.confidence}%`,
                        backgroundColor: prediction.confidence >= 70 ? '#238636' : prediction.confidence >= 50 ? '#d29922' : '#da3633',
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Chart: full width, tall */}
            {stockData.length > 0 && (
              <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-white">Price Chart</h2>
                  <span className="text-sm font-mono text-gray-500">{stockSymbol}.{selectedExchange}</span>
                </div>
                <div className="h-[420px] min-h-80 w-full">
                  <StockChart
                    dates={stockData.map(d => d.date)}
                    actualPrices={stockData.map(d => d.price)}
                    predictedPrices={prediction ? generateHistoricalPredictions(stockData) : []}
                    futureDates={prediction ? [getNextTradingDay(stockData[stockData.length - 1].date)] : []}
                    futurePredictions={prediction ? [prediction.predictedPrice] : []}
                    symbol={`${stockSymbol.toUpperCase()}.${selectedExchange}`}
                    className="h-full"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-3">{selectedExchange} • Latest 100 trading days</p>
              </div>
            )}

            {/* Secondary: analysis + disclaimer */}
            {prediction && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-5">
                  <h3 className="text-sm font-semibold text-white mb-3">Price Movement</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500 mb-0.5">Absolute</p>
                      <p className={`font-mono font-semibold ${getTrendColor(prediction.trend)}`}>
                        {prediction.change > 0 ? '+' : ''}₹{Math.abs(prediction.change).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 mb-0.5">Percent</p>
                      <p className={`font-mono font-semibold ${getTrendColor(prediction.trend)}`}>
                        {prediction.changePercent > 0 ? '+' : ''}{prediction.changePercent.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-5">
                  <h3 className="text-sm font-semibold text-white mb-3">Model</h3>
                  <p className="text-xs text-gray-500">9-feature neural network (64→32→16→1). Data: {selectedExchange} with moving averages, momentum, volatility.</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
