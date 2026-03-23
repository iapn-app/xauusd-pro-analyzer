import { DecisionResult } from './decisionEngine';

export interface TradeSetup {
  entry: number;
  stop: number;
  take: number;
  direction: 'BUY' | 'SELL';
}

export interface QuantResult {
  probability: number;
  ev: number;
  evPercent: number;
  setup: TradeSetup;
  isValid: boolean;
}

/**
 * Institutional Quant Engine for XAUUSD
 * Mathematical edge calculation
 */

/**
 * Calculates real win probability based on technical factors
 * @returns probability (0-1)
 */
export const calculateWinProbability = (
  decision: DecisionResult,
  price: number,
  zones: { supportMain: number; resistanceMain: number }
): number => {
  const { score, signal } = decision;
  let probability = 0.5; // Neutral base

  // 1. Trend Alignment (from Decision Engine Score)
  // Score 50 is neutral. 100 is strong buy, 0 is strong sell.
  const trendFactor = Math.abs(score - 50) / 50; // 0 to 1
  
  if (signal === 'BUY' && score >= 70) {
    probability += 0.15 * trendFactor;
  } else if (signal === 'SELL' && score <= 30) {
    probability += 0.15 * trendFactor;
  }

  // 2. Zone Positioning
  const distToSupport = Math.abs(price - zones.supportMain);
  const distToResistance = Math.abs(price - zones.resistanceMain);
  const totalRange = zones.resistanceMain - zones.supportMain;
  
  if (totalRange > 0) {
    if (signal === 'BUY' && distToSupport < totalRange * 0.2) {
      probability += 0.1; // Near support favors buy
    } else if (signal === 'SELL' && distToResistance < totalRange * 0.2) {
      probability += 0.1; // Near resistance favors sell
    }
  }

  // 3. Momentum & Confidence
  if (decision.confidence > 80) probability += 0.05;

  // Clamp results based on rules
  // Forte tendência + suporte → 65%–80%
  // Neutro → 45%–55%
  // Contra tendência → 20%–40%
  if (signal === 'NEUTRAL') return Math.min(0.55, Math.max(0.45, probability));
  
  // If signal is BUY but score is low (contradiction), reduce probability
  if (signal === 'BUY' && score < 50) probability -= 0.2;
  if (signal === 'SELL' && score > 50) probability -= 0.2;

  return Math.min(0.85, Math.max(0.15, probability));
};

/**
 * Calculates Expected Value (EV)
 * EV = (probability * reward) - ((1 - probability) * risk)
 */
export const calculateEV = (
  probability: number,
  entry: number,
  stop: number,
  take: number
) => {
  const risk = Math.abs(entry - stop);
  const reward = Math.abs(take - entry);
  
  if (risk === 0) return { evValue: 0, evPercent: 0 };

  const evValue = (probability * reward) - ((1 - probability) * risk);
  const evPercent = (evValue / risk) * 100;

  return {
    evValue: Number(evValue.toFixed(2)),
    evPercent: Number(evPercent.toFixed(2))
  };
};

/**
 * Generates automatic trade setup based on price and zones
 */
export const generateTradeSetup = (
  price: number,
  zones: { supportMain: number; resistanceMain: number; supportSecondary: number; resistanceSecondary: number },
  direction: 'BUY' | 'SELL'
): TradeSetup => {
  if (direction === 'BUY') {
    return {
      entry: price, // Market execution or near support
      stop: zones.supportMain - (zones.resistanceMain - zones.supportMain) * 0.1, // Below main support
      take: zones.resistanceMain,
      direction: 'BUY'
    };
  } else {
    return {
      entry: price,
      stop: zones.resistanceMain + (zones.resistanceMain - zones.supportMain) * 0.1, // Above main resistance
      take: zones.supportMain,
      direction: 'SELL'
    };
  }
};

/**
 * Main Quant Analysis Entry Point
 */
export const performQuantAnalysis = (
  decision: DecisionResult,
  price: number,
  zones: any
): QuantResult => {
  const direction = decision.signal === 'SELL' ? 'SELL' : 'BUY';
  const setup = generateTradeSetup(price, zones, direction);
  const probability = calculateWinProbability(decision, price, zones);
  const { evValue, evPercent } = calculateEV(probability, setup.entry, setup.stop, setup.take);

  // Professional Filter Rules:
  // EV > 0 → válido
  // EV < 0 → descartar trade
  // probabilidade < 50% → evitar
  const isValid = evValue > 0 && probability >= 0.5 && decision.signal !== 'NEUTRAL';

  return {
    probability: Math.round(probability * 100),
    ev: evValue,
    evPercent: evPercent,
    setup,
    isValid
  };
};
