export interface StockData {
  date: string;
  price: number;
}

export interface PredictionResult {
  currentPrice: number;
  predictedPrice: number;
  confidence: number;
  trend: 'up' | 'down' | 'stable';
  change: number;
  changePercent: number;
}