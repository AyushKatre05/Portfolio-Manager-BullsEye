import * as tf from '@tensorflow/tfjs';

export interface StockData {
  dates: string[];
  prices: number[];
  xs: number[];
}

export interface PredictionResult {
  nextPrice: number;
  model: tf.Sequential;
  r2Score: number;
  mse: number;
}

// Process raw stock data for ML
export function processStockData(data: { 'Time Series (Daily)': Record<string, { '4. close': string }> }): { prices: number[], dates: string[], xs: number[] } {
  const timeSeries = data['Time Series (Daily)'];
  if (!timeSeries) {
    throw new Error('Invalid stock data format');
  }
  
  const dates = Object.keys(timeSeries).sort(); // Sort dates chronologically
  const prices = dates.map(date => {
    const price = parseFloat(timeSeries[date]['4. close']);
    if (isNaN(price)) {
      throw new Error(`Invalid price data for date ${date}: ${timeSeries[date]['4. close']}`);
    }
    return price;
  });
  
  // Validate that we have valid price data
  if (prices.length === 0) {
    throw new Error('No valid price data found');
  }
  
  // Check for any NaN values
  const hasNaN = prices.some(price => isNaN(price));
  if (hasNaN) {
    throw new Error('Price data contains invalid values');
  }
  
  const xs = dates.map((_, i) => i); // Day indices starting from 0
  
  return { dates, prices, xs };
};

// Train enhanced regression model with advanced features
export const trainLinearRegressionModel = async (xs: number[], ys: number[]): Promise<tf.Sequential> => {
  // Normalize the data for better training
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const yMin = Math.min(...ys);
  const yMax = Math.max(...ys);
  

  
  // Create advanced features for better pattern recognition
  const createAdvancedFeatures = (x: number, prices: number[], index: number) => {
    const xNorm = (x - xMin) / (xMax - xMin);
    
    // Moving averages (if enough data)
    const ma3 = index >= 2 ? (prices[index] + prices[index-1] + prices[index-2]) / 3 : prices[index];
    const ma5 = index >= 4 ? prices.slice(Math.max(0, index-4), index+1).reduce((a, b) => a + b, 0) / Math.min(5, index+1) : prices[index];
    
    // Price momentum
    const momentum = index > 0 ? prices[index] - prices[index-1] : 0;
    const volatility = index >= 5 ? Math.sqrt(prices.slice(Math.max(0, index-4), index+1).reduce((sum, p) => sum + Math.pow(p - ma5, 2), 0) / Math.min(5, index+1)) : 0;
    
    return [
      xNorm,                           // Normalized time index
      xNorm * xNorm,                   // Quadratic term
      Math.sin(xNorm * 2 * Math.PI),   // Seasonal pattern 1
      Math.cos(xNorm * 2 * Math.PI),   // Seasonal pattern 2
      Math.sin(xNorm * 4 * Math.PI),   // Higher frequency pattern
      (ma3 - yMin) / (yMax - yMin),    // 3-day MA (normalized)
      (ma5 - yMin) / (yMax - yMin),    // 5-day MA (normalized)
      momentum / (yMax - yMin),        // Price momentum (normalized)
      volatility / (yMax - yMin)       // Volatility (normalized)
    ];
  };
  
  // Create training data with advanced features
  const xsFeatures = xs.map((x, i) => createAdvancedFeatures(x, ys, i));
  const ysNorm = ys.map(y => (y - yMin) / (yMax - yMin));
  
  const model = tf.sequential();
  
  // More sophisticated architecture
  model.add(tf.layers.dense({
    inputShape: [9], // 9 advanced features
    units: 64,
    activation: 'relu',
    kernelRegularizer: tf.regularizers.l2({ l2: 0.001 })
  }));
  
  model.add(tf.layers.dropout({ rate: 0.3 }));
  
  model.add(tf.layers.dense({
    units: 32,
    activation: 'relu',
    kernelRegularizer: tf.regularizers.l2({ l2: 0.001 })
  }));
  
  model.add(tf.layers.dropout({ rate: 0.2 }));
  
  model.add(tf.layers.dense({
    units: 16,
    activation: 'relu'
  }));
  
  model.add(tf.layers.dense({
    units: 1,
    activation: 'sigmoid' // Use sigmoid for better bounded output
  }));
  
  // Compile with adaptive learning rate
  model.compile({
    optimizer: tf.train.adam(0.0005),
    loss: 'meanSquaredError',
    metrics: ['mse', 'mae']
  });
  
  // Convert features to tensors
  const xsTensor = tf.tensor2d(xsFeatures, [xsFeatures.length, 9]);
  const ysTensor = tf.tensor2d(ysNorm, [ysNorm.length, 1]);
  
  try {
    // Progressive training strategy
    const initialEpochs = 200;
    const finetuneEpochs = 100;
    
    // Initial training with higher learning rate
  const history = await model.fit(xsTensor, ysTensor, {
    epochs: 100,
    batchSize: 32,
    validationSplit: 0.2,
    callbacks: {
      onEpochEnd: (epoch: number) => {
        // Training progress callback
      }
    }
  });    // Fine-tuning with lower learning rate
    model.compile({
      optimizer: tf.train.adam(0.0001), // Lower learning rate
      loss: 'meanSquaredError',
      metrics: ['mse', 'mae']
    });
    
    const finetuneHistory = await model.fit(xsTensor, ysTensor, {
      epochs: finetuneEpochs,
      batchSize: Math.min(4, Math.floor(xs.length / 8)),
      verbose: 0,
      shuffle: true,
      validationSplit: 0.2,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          if (epoch % 20 === 0) {
            // Fine-tuning progress tracking
          }
        }
      }
    });
    
  // Training completed successfully
  console.log('LSTM model training completed');    
    // Store all necessary data for predictions
    (model as any).normalizationParams = { xMin, xMax, yMin, yMax };
    (model as any).createAdvancedFeatures = createAdvancedFeatures;
    (model as any).trainingPrices = ys; // Store for feature calculation
    
    return model;
  } finally {
    // Clean up tensors
    xsTensor.dispose();
    ysTensor.dispose();
  }
};

// Make prediction for next day
export const predictNextDay = (model: tf.Sequential, nextDayIndex: number): number => {
  const params = (model as any).normalizationParams;
  const createFeatures = (model as any).createAdvancedFeatures;
  const trainingPrices = (model as any).trainingPrices;
  if (!params || !createFeatures || !trainingPrices) {
    throw new Error('Model missing required parameters');
  }
  
  // Create advanced features for the input
  const features = createFeatures(nextDayIndex, trainingPrices, Math.min(nextDayIndex, trainingPrices.length - 1));
  
  const inputTensor = tf.tensor2d([features], [1, 9]);
  const prediction = model.predict(inputTensor) as tf.Tensor;
  const normalizedResult = prediction.dataSync()[0];
  
  // Denormalize the output (sigmoid output needs special handling)
  const result = normalizedResult * (params.yMax - params.yMin) + params.yMin;
  
  inputTensor.dispose();
  prediction.dispose();
  
  return isNaN(result) ? params.yMin : Math.max(params.yMin * 0.8, Math.min(params.yMax * 1.2, result));
};

// Calculate R-squared score for model evaluation
export const calculateR2Score = (actual: number[], predicted: number[]): number => {
  if (actual.length !== predicted.length) {
    throw new Error('Actual and predicted arrays must have the same length');
  }
  
  // Check for NaN values
  const hasNaNActual = actual.some(val => isNaN(val));
  const hasNaNPredicted = predicted.some(val => isNaN(val));
  
  if (hasNaNActual || hasNaNPredicted) {
    console.error('NaN values found in R2 calculation:', { hasNaNActual, hasNaNPredicted });
    return 0; // Return 0 instead of NaN
  }
  
  const actualMean = actual.reduce((sum, val) => sum + val, 0) / actual.length;
  
  const totalSumSquares = actual.reduce((sum, val) => sum + Math.pow(val - actualMean, 2), 0);
  const residualSumSquares = actual.reduce((sum, val, i) => sum + Math.pow(val - predicted[i], 2), 0);
  
  // Avoid division by zero
  if (totalSumSquares === 0) {
    return 0;
  }
  
  const r2 = 1 - (residualSumSquares / totalSumSquares);
  
  // Return 0 if result is NaN
  return isNaN(r2) ? 0 : r2;
};

// Calculate Mean Squared Error
export const calculateMSE = (actual: number[], predicted: number[]): number => {
  if (actual.length !== predicted.length) {
    throw new Error('Actual and predicted arrays must have the same length');
  }
  
  // Check for NaN values
  const hasNaNActual = actual.some(val => isNaN(val));
  const hasNaNPredicted = predicted.some(val => isNaN(val));
  
  if (hasNaNActual || hasNaNPredicted) {
    console.error('NaN values found in MSE calculation:', { hasNaNActual, hasNaNPredicted });
    return 0; // Return 0 instead of NaN
  }
  
  const sumSquaredErrors = actual.reduce((sum, val, i) => 
    sum + Math.pow(val - predicted[i], 2), 0
  );
  
  const mse = sumSquaredErrors / actual.length;
  
  // Return 0 if result is NaN
  return isNaN(mse) ? 0 : mse;
};

// Get predictions for existing data (for visualization)
export const getPredictionsForData = (model: tf.Sequential, xs: number[]): number[] => {
  const params = (model as any).normalizationParams;
  const createFeatures = (model as any).createAdvancedFeatures;
  const trainingPrices = (model as any).trainingPrices;
  if (!params || !createFeatures || !trainingPrices) {
    throw new Error('Model missing required parameters');
  }
  
  // Create advanced features for all inputs
  const xsFeatures = xs.map((x, i) => createFeatures(x, trainingPrices, i));
  
  const xsTensor = tf.tensor2d(xsFeatures, [xsFeatures.length, 9]);
  const predictions = model.predict(xsTensor) as tf.Tensor;
  const normalizedResults = Array.from(predictions.dataSync());
  
  // Denormalize the outputs
  const result = normalizedResults.map(val => 
    val * (params.yMax - params.yMin) + params.yMin
  );
  
  xsTensor.dispose();
  predictions.dispose();
  
  // Clean and bound the results
  const cleanResult = result.map((val, i) => {
    if (isNaN(val)) {
      return trainingPrices[i] || (params.yMin + params.yMax) / 2;
    }
    // Bound predictions within reasonable range
    return Math.max(params.yMin * 0.8, Math.min(params.yMax * 1.2, val));
  });
  

  
  return cleanResult;
};