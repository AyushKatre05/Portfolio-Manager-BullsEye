export const fastPredictStock = (stockData: { date: string; price: number; }[]) => {
  if (stockData.length < 10) {
    throw new Error('Insufficient data for prediction');
  }
  const prices = stockData.map(d => d.price);
  const currentPrice = prices[prices.length - 1];
  const shortMA = prices.slice(-5).reduce((a, b) => a + b, 0) / 5;
  const longMA = prices.slice(-20).reduce((a, b) => a + b, 0) / 20;
  const recentPrices = prices.slice(-10);
  const n = recentPrices.length;
  const x = Array.from({length: n}, (_, i) => i);
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = recentPrices.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((acc, xi, i) => acc + xi * recentPrices[i], 0);
  const sumXX = x.reduce((acc, xi) => acc + xi * xi, 0);
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  const nextPrice = slope * n + intercept;
  const returns = prices.slice(1).map((price, i) => (price - prices[i]) / prices[i]);
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length;
  const volatility = Math.sqrt(variance);
  const change = nextPrice - currentPrice;
  const changePercent = (change / currentPrice) * 100;
  const trendStrength = Math.abs(slope);
  const maConsistency = Math.abs(shortMA - longMA) / currentPrice;
  const baseConfidence = Math.min(90, (trendStrength * 1000 + maConsistency * 100));
  const volatilityPenalty = Math.min(30, volatility * 500);
  const confidence = Math.max(45, Math.min(90, baseConfidence - volatilityPenalty));
  
  return {
    currentPrice: parseFloat(currentPrice.toFixed(2)),
    predictedPrice: parseFloat(nextPrice.toFixed(2)),
    confidence: parseFloat(confidence.toFixed(1)),
    trend: Math.abs(change) < currentPrice * 0.005 ? 'stable' as const : 
           (change > 0 ? 'up' as const : 'down' as const),
    change: parseFloat(change.toFixed(2)),
    changePercent: parseFloat(changePercent.toFixed(2))
  }
};