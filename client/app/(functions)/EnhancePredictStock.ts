import { 
  processStockData,
  trainLinearRegressionModel,
  predictNextDay,
  calculateR2Score,
  calculateMSE,
  getPredictionsForData
} from '@/lib/ml-utils';
import { fastPredictStock } from './FastPredictStock';
import { calculateVolatility } from './CalculateVolatility';

export const enhancedPredictStock = async (stockData: { date: string; price: number; }[]) => {
  try {
    const fastResult = fastPredictStock(stockData);
    try {
      const processedData = processStockData({ 
        'Time Series (Daily)': stockData.reduce((acc: Record<string, { '4. close': string }>, item: { date: string; price: number }) => {
          acc[item.date] = { '4. close': item.price.toString() };
          return acc;
        }, {})
      });
      const modelPromise = trainLinearRegressionModel(processedData.xs, processedData.prices);
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('ML timeout')), 8000)
      );
      const model = await Promise.race([modelPromise, timeoutPromise]);
      const predictions = getPredictionsForData(model, processedData.xs);
      const nextPrice = predictNextDay(model, processedData.xs.length);
      const r2Score = calculateR2Score(processedData.prices, predictions);
      const mse = calculateMSE(processedData.prices, predictions);
      const currentPrice = stockData[stockData.length - 1].price;
      const change = nextPrice - currentPrice;
      const changePercent = (change / currentPrice) * 100;
      const baseConfidence = Math.max(0, Math.min(100, r2Score * 100));
      const mseConfidence = Math.max(0, 100 - (mse / currentPrice) * 100);
      const volatility = calculateVolatility(processedData.prices);
      const volatilityPenalty = Math.min(20, volatility * 10);
      const confidence = Math.max(40, Math.min(95, 
        (baseConfidence * 0.6) + (mseConfidence * 0.4) - volatilityPenalty
      ));
      
      return {
        currentPrice: parseFloat(currentPrice.toFixed(2)),
        predictedPrice: parseFloat(nextPrice.toFixed(2)),
        confidence: parseFloat(confidence.toFixed(1)),
        trend: Math.abs(change) < currentPrice * 0.005 ? 'stable' as const : 
               (change > 0 ? 'up' as const : 'down' as const),
        change: parseFloat(change.toFixed(2)),
        changePercent: parseFloat(changePercent.toFixed(2))
      };
      
    } catch {
      return fastResult;
    }
    
  } catch (error) {
    throw error;
  }
};