import { Candle } from './candles';

export interface MarketData {
  price: number;
  variation: number;
  variationPercent: number;
  high: number;
  low: number;
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  volatility: 'LOW' | 'MEDIUM' | 'HIGH';
  session: string;
  lastUpdate: Date;
}

export interface MarketSnapshot extends MarketData {
  candles: Candle[];
  timeframe: string;
}
