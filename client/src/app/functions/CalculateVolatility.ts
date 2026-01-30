export const calculateVolatility = (prices: number[]): number => {
  if (prices.length < 2) return 0;
  const returns = prices.slice(1).map((price, i) => (price - prices[i]) / prices[i]);
  const meanReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
  const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - meanReturn, 2), 0) / returns.length;
  return Math.sqrt(variance);
};