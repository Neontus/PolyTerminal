import { useMemo } from 'react';

export interface SignalData {
  value: number;
  label: string;
  signal: 'BUY' | 'SELL' | 'NEUTRAL';
  description: string;
  color: string;
}

export interface TechnicalSignals {
  rsi: SignalData;
  macd: SignalData;
  zScore: SignalData;
  momentum: SignalData;
  volatility: SignalData;
  divergence: SignalData;
}

interface PricePoint {
  time: number;
  price: number;
  volume?: number;
}

function calculateMean(data: number[]): number {
  if (data.length === 0) return 0;
  return data.reduce((a, b) => a + b, 0) / data.length;
}

function calculateStdDev(data: number[]): number {
  if (data.length < 2) return 0;
  const mean = calculateMean(data);
  const variance = data.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (data.length - 1);
  return Math.sqrt(variance);
}

function calculateEMA(data: number[], days: number): number[] {
  const k = 2 / (days + 1);
  const emaArray = [data[0]];
  for (let i = 1; i < data.length; i++) {
    emaArray.push(data[i] * k + emaArray[i - 1] * (1 - k));
  }
  return emaArray;
}

export function useTechnicalIndicators(history: PricePoint[]) {
  return useMemo(() => {
    if (!history || history.length < 30) return null;

    // Ensure sorted by time ascending for calculations
    const sorted = [...history].sort((a, b) => a.time - b.time);
    const prices = sorted.map(d => d.price);
    const currentPrice = prices[prices.length - 1];

    // --- RSI (14) ---
    // Simple implementation
    let gains = 0;
    let losses = 0;
    const period = 14;
    
    // First avg gain/loss
    for(let i=1; i<=period; i++) {
        const change = prices[i] - prices[i-1];
        if(change > 0) gains += change;
        else losses += Math.abs(change);
    }
    
    let avgGain = gains / period;
    let avgLoss = losses / period;

    // Smoothed
    for(let i=period + 1; i<prices.length; i++) {
        const change = prices[i] - prices[i-1];
        if(change > 0) {
            avgGain = (avgGain * 13 + change) / 14;
            avgLoss = (avgLoss * 13 + 0) / 14;
        } else {
            avgGain = (avgGain * 13 + 0) / 14;
            avgLoss = (avgLoss * 13 + Math.abs(change)) / 14;
        }
    }

    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    const rsiVal = 100 - (100 / (1 + rs));

    // --- MACD (12, 26, 9) ---
    const ema12 = calculateEMA(prices, 12);
    const ema26 = calculateEMA(prices, 26);
    const macdLine = ema12.map((val, i) => val - ema26[i]);
    const signalLine = calculateEMA(macdLine, 9);
    
    const currentMacd = macdLine[macdLine.length - 1];
    const currentSignal = signalLine[signalLine.length - 1];
    const macdHist = currentMacd - currentSignal;


    // --- Z-Score (20) ---
    const window20 = prices.slice(-20);
    const mean20 = calculateMean(window20);
    const std20 = calculateStdDev(window20);
    const zScoreVal = std20 === 0 ? 0 : (currentPrice - mean20) / std20;


    // --- Momentum (ROC 10) ---
    const lookback = 10;
    const prevPrice = prices[prices.length - 1 - lookback] || prices[0];
    const momentumVal = ((currentPrice - prevPrice) / prevPrice) * 100;


    // --- Volatility (StdDev of Log Returns) ---
    // Log returns = ln(P_t / P_{t-1})
    const logReturns = [];
    for(let i=1; i<prices.length; i++) {
        logReturns.push(Math.log(prices[i] / prices[i-1]));
    }
    const volVal = calculateStdDev(logReturns.slice(-20)) * Math.sqrt(365) * 100; // Annualized-ish for display


    // --- Price-Volume Anomaly (Simplified Anomaly Detection) ---
    // Detect abnormal volume spikes (> 2 std dev or > 200% SMA)
    // If volume data is missing (often true for simple price history), we skip this.
    
    let anomalyVal = 0;
    let anomalySignal: 'BUY' | 'SELL' | 'NEUTRAL' = 'NEUTRAL';
    let anomalyDesc = 'No Vol Data';
    let anomalyColor = 'text-gray-500';

    const volumes = sorted.map(d => d.volume || 0);
    const hasVolume = volumes.some(v => v > 0);

    if (hasVolume) {
         const volSMA = calculateMean(volumes.slice(-20));
         const currentVol = volumes[volumes.length - 1];
         const volRatio = volSMA > 0 ? currentVol / volSMA : 0;
         
         const priceChange = (currentPrice - sorted[sorted.length - 2].price) / sorted[sorted.length - 2].price;
         
         anomalyVal = volRatio;

         if (volRatio > 2.5) {
             // Huge volume spike
             if (Math.abs(priceChange) > 0.02) {
                 // Significant price move + Volume
                 anomalySignal = priceChange > 0 ? 'BUY' : 'SELL';
                 anomalyDesc = priceChange > 0 ? 'Vol Breakout (Up)' : 'Vol Breakout (Down)';
                 anomalyColor = priceChange > 0 ? 'text-green-500 font-bold' : 'text-red-500 font-bold';
             } else {
                 anomalySignal = 'NEUTRAL';
                 anomalyDesc = 'Vol Spike (Indecisive)';
                 anomalyColor = 'text-yellow-400';
             }
         } else if (volRatio > 1.5) {
             anomalyDesc = 'Elevated Vol';
             anomalyColor = 'text-blue-300';
         } else {
            anomalyDesc = 'Normal Vol';
            anomalyColor = 'text-gray-400';
         }
    }

    // --- Signals Formatting ---
    
    const signals: TechnicalSignals = {
        rsi: {
            value: rsiVal,
            label: 'RSI (14)',
            signal: rsiVal > 70 ? 'SELL' : rsiVal < 30 ? 'BUY' : 'NEUTRAL',
            description: rsiVal > 70 ? 'Overbought (>70)' : rsiVal < 30 ? 'Oversold (<30)' : 'Neutral',
            color: rsiVal > 70 ? 'text-red-400' : rsiVal < 30 ? 'text-green-400' : 'text-gray-400'
        },
        macd: {
            value: macdHist,
            label: 'MACD',
            signal: macdHist > 0 ? 'BUY' : 'SELL',
            description: macdHist > 0 ? 'Bullish Trend' : 'Bearish Trend',
            color: macdHist > 0 ? 'text-green-400' : 'text-red-400'
        },
        zScore: {
            value: zScoreVal,
            label: 'Z-Score',
            signal: zScoreVal > 2 ? 'SELL' : zScoreVal < -2 ? 'BUY' : 'NEUTRAL',
            description: zScoreVal > 2 ? '> 2σ (Rich)' : zScoreVal < -2 ? '< -2σ (Cheap)' : 'Mean Reverting',
            color: Math.abs(zScoreVal) > 2 ? 'text-yellow-400' : 'text-gray-400'
        },
        momentum: {
            value: momentumVal,
            label: 'Momentum',
            signal: momentumVal > 0 ? 'BUY' : 'SELL',
            description: `${momentumVal > 0 ? '+' : ''}${momentumVal.toFixed(2)}% (10p)`,
            color: momentumVal > 0 ? 'text-green-400' : 'text-red-400'
        },
        volatility: {
            value: volVal,
            label: 'Volatility',
            signal: 'NEUTRAL',
            description: `${volVal.toFixed(1)}% Annualized`,
            color: volVal > 100 ? 'text-red-400' : volVal > 50 ? 'text-yellow-400' : 'text-blue-400'
        },
        divergence: {
            value: anomalyVal,
            label: 'Vol Anomaly',
            signal: anomalySignal,
            description: anomalyDesc,
            color: anomalyColor
        }
    };

    return signals;

  }, [history]);
}
