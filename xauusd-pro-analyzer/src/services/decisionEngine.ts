import { Candle } from '../types/candles';

export interface DecisionEngineInput {
  price: number;
  historicalData: Record<string, Candle[]>;
  zones: {
    supportMain: number;
    supportSecondary: number;
    resistanceMain: number;
    resistanceSecondary: number;
  };
  volatility: 'LOW' | 'MEDIUM' | 'HIGH';
  session: string;
  newsImpact: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface DecisionResult {
  signal: 'BUY' | 'SELL' | 'NEUTRAL';
  score: number;
  confidence: number;
  reasons: string[];
}

/**
 * Professional Decision Engine for XAUUSD
 * Institutional Grade Analysis
 */
export const calculateDecision = (input: DecisionEngineInput): DecisionResult => {
  const { price, historicalData, zones, volatility, session, newsImpact } = input;
  const reasons: string[] = [];
  let score = 50; // Start at neutral

  // 1. Trend Analysis (SMA 20/50)
  // Rules: SMA20 > SMA50 → Bullish, SMA20 < SMA50 → Bearish
  // Points: +20 strong (all aligned), +10 partial, 0 neutral
  let bullishTFs = 0;
  let bearishTFs = 0;
  const intervals = ['5min', '15min', '1h', '4h'];

  intervals.forEach(tf => {
    const candles = historicalData[tf];
    if (candles && candles.length >= 50) {
      const sma20 = calculateSMA(candles, 20);
      const sma50 = calculateSMA(candles, 50);
      
      if (sma20 > sma50) bullishTFs++;
      else if (sma20 < sma50) bearishTFs++;
    }
  });

  if (bullishTFs === 4) {
    score += 20;
    reasons.push("Tendência forte de alta em todos os timeframes (SMA 20/50)");
  } else if (bearishTFs === 4) {
    score -= 20;
    reasons.push("Tendência forte de baixa em todos os timeframes (SMA 20/50)");
  } else if (bullishTFs >= 2) {
    score += 10;
    reasons.push("Tendência predominante de alta (alinhamento parcial)");
  } else if (bearishTFs >= 2) {
    score -= 10;
    reasons.push("Tendência predominante de baixa (alinhamento parcial)");
  }

  // 2. Momentum
  // Rules: Strong move → +15, Moderate → +8, Weak → 0
  const m5Candles = historicalData['5min'];
  if (m5Candles && m5Candles.length >= 2) {
    const lastClose = m5Candles[m5Candles.length - 1].close;
    const prevClose = m5Candles[m5Candles.length - 2].close;
    const variation = ((lastClose - prevClose) / prevClose) * 100;

    if (Math.abs(variation) > 0.1) {
      score += variation > 0 ? 15 : -15;
      reasons.push(`Momentum forte detectado (${variation > 0 ? 'Alta' : 'Baixa'})`);
    } else if (Math.abs(variation) > 0.05) {
      score += variation > 0 ? 8 : -8;
      reasons.push("Momentum moderado");
    }
  }

  // 3. Proximity to Zones
  // Rules: Near support → BUY (+15), Near resistance → SELL (-15)
  const threshold = price * 0.001; // 0.1% proximity
  if (Math.abs(price - zones.supportMain) < threshold) {
    score += 15;
    reasons.push("Preço próximo ao suporte principal");
  } else if (Math.abs(price - zones.resistanceMain) < threshold) {
    score -= 15;
    reasons.push("Preço próximo à resistência principal");
  }

  // 4. Volatility Adjustment
  // Rules: High volatility → reduce score (towards neutral)
  if (volatility === 'HIGH') {
    const diff = score - 50;
    score -= diff * 0.2; // Reduce deviation by 20%
    reasons.push("Alta volatilidade: Ajuste de risco institucional aplicado");
  }

  // 5. Session Weight
  // Rules: NY (1.2x), London (1.1x), Asia (0.9x)
  let sessionMultiplier = 1.0;
  if (session.includes('NY')) {
    sessionMultiplier = 1.2;
    reasons.push("Sessão New York ativa (Alta liquidez)");
  } else if (session.includes('London')) {
    sessionMultiplier = 1.1;
    reasons.push("Sessão London ativa");
  } else if (session.includes('Asia')) {
    sessionMultiplier = 0.9;
    reasons.push("Sessão Asia ativa (Baixa volatilidade)");
  }
  
  const finalDeviation = (score - 50) * sessionMultiplier;
  score = 50 + finalDeviation;

  // 6. News Filter
  // Rules: High impact → reduce confidence, avoid operation (push to neutral)
  let confidence = 85;
  if (newsImpact === 'HIGH') {
    confidence -= 40;
    score = 50 + (score - 50) * 0.5; // Push 50% towards neutral
    reasons.push("ALERTA: Notícias de alto impacto próximas. Confiança reduzida.");
  } else if (newsImpact === 'MEDIUM') {
    confidence -= 15;
    reasons.push("Notícias de médio impacto no radar.");
  }

  // Final Signal Calculation
  // Rules: >= 70 → BUY, <= 30 → SELL, else → NEUTRAL
  let signal: 'BUY' | 'SELL' | 'NEUTRAL' = 'NEUTRAL';
  if (score >= 70) signal = 'BUY';
  else if (score <= 30) signal = 'SELL';

  // Clamp score and confidence
  score = Math.max(0, Math.min(100, score));
  confidence = Math.max(0, Math.min(100, confidence));

  return {
    signal,
    score: Math.round(score),
    confidence: Math.round(confidence),
    reasons
  };
};

/**
 * Calculates Simple Moving Average
 */
const calculateSMA = (candles: Candle[], period: number): number => {
  if (candles.length < period) return 0;
  const slice = candles.slice(-period);
  const sum = slice.reduce((acc, c) => acc + c.close, 0);
  return sum / period;
};

/**
 * Identifies the trend for a single timeframe
 */
export const getTrendForTimeframe = (candles: Candle[]): 'Bullish' | 'Bearish' | 'Neutral' => {
  if (candles.length < 50) return 'Neutral';
  const sma20 = calculateSMA(candles, 20);
  const sma50 = calculateSMA(candles, 50);
  
  if (sma20 > sma50) return 'Bullish';
  if (sma20 < sma50) return 'Bearish';
  return 'Neutral';
};
