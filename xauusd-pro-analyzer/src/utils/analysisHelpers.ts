import { MarketData } from '../types/trading';

export const calculateTimeframeBias = (timeframe: string, price: number): 'BULLISH' | 'BEARISH' | 'NEUTRAL' => {
  // Mock logic
  return price > 2640 ? 'BULLISH' : 'BEARISH';
};

export const calculateTrendStrength = (timeframe: string): number => {
  // Mock logic
  return Math.floor(Math.random() * 100);
};

export const getTimeframeSignal = (bias: string, strength: number): 'BULLISH' | 'BEARISH' | 'NEUTRAL' => {
  if (strength < 30) return 'NEUTRAL';
  return bias as 'BULLISH' | 'BEARISH';
};

import { Candle } from '../types/candles';

export const calculateDynamicKeyLevels = (candles: Candle[]) => {
  if (candles.length === 0) return { supportMain: 0, supportSecondary: 0, resistanceMain: 0, resistanceSecondary: 0 };
  
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);
  
  const resistanceMain = Math.max(...highs);
  const supportMain = Math.min(...lows);
  
  // Níveis secundários simples baseados em range
  const range = resistanceMain - supportMain;
  const resistanceSecondary = resistanceMain + range * 0.5;
  const supportSecondary = supportMain - range * 0.5;
  
  return {
    supportMain,
    supportSecondary,
    resistanceMain,
    resistanceSecondary,
  };
};

export const getDistanceToLevel = (price: number, level: number) => {
  return ((level - price) / price) * 100;
};

export const getLevelBreakProbability = (price: number, level: number, volatility: 'LOW' | 'MEDIUM' | 'HIGH') => {
  const distance = Math.abs(getDistanceToLevel(price, level));
  const volFactor = volatility === 'HIGH' ? 1.5 : volatility === 'MEDIUM' ? 1 : 0.5;
  
  if (distance < 0.1 * volFactor) return 'HIGH';
  if (distance < 0.3 * volFactor) return 'MEDIUM';
  return 'LOW';
};

export const getMarketOverview = (marketData: MarketData) => {
  return {
    direction: marketData.variation >= 0 ? 'Alta' : 'Baixa',
    strength: marketData.volatility === 'HIGH' ? 'Forte' : 'Moderada',
    condition: 'Tendencial',
    approach: 'Scalp comprado',
  };
};
