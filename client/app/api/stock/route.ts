import axios from 'axios';
import { NextRequest, NextResponse } from 'next/server';

async function fetchFromYahooFinance(symbol: string): Promise<Array<{ date: string; price: number; }> | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=3mo&interval=1d`;
    
    const response = await axios.get(url, {
      timeout: 8000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      }
    });
    
    if (response.data?.chart?.result?.[0]) {
      const result = response.data.chart.result[0];
      const timestamps = result.timestamp;
      const prices = result.indicators?.quote?.[0]?.close;
      
      if (timestamps && prices && timestamps.length === prices.length) {
        const dataPoints: Array<{ date: string; price: number; }> = [];
        
        for (let i = 0; i < timestamps.length; i++) {
          if (prices[i] !== null && !isNaN(prices[i])) {
            const date = new Date(timestamps[i] * 1000).toISOString().split('T')[0];
            dataPoints.push({
              date: date,
              price: parseFloat(prices[i].toFixed(2))
            });
          }
        }
        
        return dataPoints.length > 20 ? dataPoints : null;
      }
    }
    
    return null;
  } catch {
    return null;
  }
}

async function tryAlternativeFormats(symbol: string, exchange: string): Promise<Array<{ date: string; price: number; }> | null> {
  const formats = [
    `${symbol}.${exchange === 'NSE' ? 'NS' : 'BO'}`,
    `${symbol}.${exchange}`,
    symbol
  ];
  
  for (const format of formats) {
    const data = await fetchFromYahooFinance(format);
    if (data && data.length > 20) {
      return data;
    }
  }
  
  return null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol') || 'RELIANCE.NSE';
  
  try {
    const [stockSymbol, exchange] = symbol.split('.');
    const yahooSymbol = exchange === 'NSE' ? `${stockSymbol}.NS` : `${stockSymbol}.BO`;
    
    let stockData = await fetchFromYahooFinance(yahooSymbol);
    
    if (!stockData) {
      stockData = await tryAlternativeFormats(stockSymbol, exchange);
    }
    
    if (stockData && stockData.length > 20) {
      return NextResponse.json({
        success: true,
        stockData: stockData,
        source: 'yahoo_finance',
        symbol: symbol
      });
    }
    
    // Return error if no data found
    return NextResponse.json({
      success: false,
      error: `Unable to fetch stock data for ${symbol}. Please verify the symbol is correct.`,
      symbol: symbol,
      suggestions: ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK', 'SBIN']
    }, { status: 503 });

  } catch {
    return NextResponse.json({
      success: false,
      error: 'Server error while fetching stock data',
      symbol: symbol
    }, { status: 500 });
  }
}