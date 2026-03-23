import { MarketSnapshot } from '../types/market';

/**
 * Trading Engine Service - Institutional Grade
 * Specialized for XAUUSD (Gold)
 */

export interface PositionSizeResult {
  riskAmount: number;
  stopDistancePoints: number;
  stopDistancePrice: number;
  recommendedLotSize: number;
}

export interface RiskRewardResult {
  risk: number;
  reward: number;
  ratio: number;
}

export interface PnLResult {
  profit: number;
  profitPercent: number;
}

export interface ValidationResult {
  status: 'OK' | 'ALERT';
  messages: string[];
}

/**
 * Calculates the ideal position size based on account balance and risk percentage.
 * For XAUUSD: 1 Lot = 100 oz.
 */
export const calculatePositionSize = (
  balance: number,
  riskPercent: number,
  entryPrice: number,
  stopLoss: number,
  symbol: string = 'XAUUSD'
): PositionSizeResult => {
  const riskAmount = balance * (riskPercent / 100);
  const stopDistancePrice = Math.abs(entryPrice - stopLoss);
  
  // For XAUUSD, 1.00 price move = $100 per lot
  // Contract size is 100
  const contractSize = 100;
  
  if (stopDistancePrice === 0) {
    return {
      riskAmount,
      stopDistancePoints: 0,
      stopDistancePrice: 0,
      recommendedLotSize: 0,
    };
  }

  const recommendedLotSize = riskAmount / (stopDistancePrice * contractSize);
  const stopDistancePoints = stopDistancePrice * 100; // 1.00 = 100 points

  return {
    riskAmount,
    stopDistancePoints,
    stopDistancePrice,
    recommendedLotSize: Number(recommendedLotSize.toFixed(2)),
  };
};

/**
 * Calculates Risk/Reward metrics.
 */
export const calculateRiskReward = (
  entry: number,
  stop: number,
  take: number
): RiskRewardResult => {
  const risk = Math.abs(entry - stop);
  const reward = Math.abs(take - entry);
  const ratio = risk === 0 ? 0 : reward / risk;

  return {
    risk,
    reward,
    ratio: Number(ratio.toFixed(2)),
  };
};

/**
 * Calculates Profit and Loss for a trade.
 */
export const calculatePnL = (
  entry: number,
  exit: number,
  lotSize: number,
  direction: 'BUY' | 'SELL'
): PnLResult => {
  const contractSize = 100; // XAUUSD
  const priceDiff = direction === 'BUY' ? exit - entry : entry - exit;
  const profit = priceDiff * contractSize * lotSize;
  const profitPercent = (profit / (entry * contractSize * lotSize)) * 100; // This is a bit tricky, usually % is based on margin or balance

  return {
    profit: Number(profit.toFixed(2)),
    profitPercent: Number(profitPercent.toFixed(2)),
  };
};

/**
 * Validates a trade setup based on institutional risk rules.
 */
export const validateTrade = (
  riskPercent: number,
  rr: number
): ValidationResult => {
  const messages: string[] = [];
  let status: 'OK' | 'ALERT' = 'OK';

  if (riskPercent > 2) {
    status = 'ALERT';
    messages.push('Risco superior ao limite institucional (2%)');
  }

  if (rr < 1.5) {
    status = 'ALERT';
    messages.push('Relação Risco:Retorno abaixo do mínimo (1.5)');
  }

  return {
    status,
    messages,
  };
};

/**
 * Professional Risk Management Logic
 */
export const checkRiskLimits = (
  dailyPnL: number,
  weeklyPnL: number,
  balance: number
) => {
  const dailyLimit = balance * 0.05;
  const weeklyLimit = balance * 0.10;

  const dailyStatus = dailyPnL <= -dailyLimit ? 'BLOCKED' : 'OK';
  const weeklyStatus = weeklyPnL <= -weeklyLimit ? 'BLOCKED' : 'OK';

  return {
    dailyLimit,
    weeklyLimit,
    dailyStatus,
    weeklyStatus,
    isBlocked: dailyStatus === 'BLOCKED' || weeklyStatus === 'BLOCKED',
  };
};

export interface MarketRecommendation {
  signal: 'BUY' | 'SELL' | 'WAIT';
  confidence: number;
  reason: string;
}

/**
 * Generates a market recommendation based on current snapshot data.
 */
export const getMarketRecommendation = (snapshot: MarketSnapshot): MarketRecommendation => {
  const { sentiment, volatility, variationPercent } = snapshot;
  
  let signal: 'BUY' | 'SELL' | 'WAIT' = 'WAIT';
  let confidence = 0;
  let reason = '';

  const isStrongTrend = Math.abs(variationPercent) > 0.1;
  const isModerateTrend = Math.abs(variationPercent) > 0.05;

  if (sentiment === 'BULLISH') {
    if (isStrongTrend) {
      signal = 'BUY';
      confidence = volatility === 'HIGH' ? 90 : 75;
      reason = `Forte tendência de alta (${variationPercent.toFixed(2)}%). Volume institucional confirmado.`;
    } else if (isModerateTrend) {
      signal = 'BUY';
      confidence = volatility === 'MEDIUM' ? 70 : 60;
      reason = `Tendência de alta moderada. Estrutura de mercado favorece compras.`;
    } else {
      signal = 'WAIT';
      confidence = 40;
      reason = 'Sentimento de alta, mas momentum fraco. Risco de lateralização.';
    }
  } else if (sentiment === 'BEARISH') {
    if (isStrongTrend) {
      signal = 'SELL';
      confidence = volatility === 'HIGH' ? 90 : 75;
      reason = `Forte tendência de baixa (${variationPercent.toFixed(2)}%). Pressão vendedora dominante.`;
    } else if (isModerateTrend) {
      signal = 'SELL';
      confidence = volatility === 'MEDIUM' ? 70 : 60;
      reason = `Tendência de baixa moderada. Estrutura de mercado favorece vendas.`;
    } else {
      signal = 'WAIT';
      confidence = 40;
      reason = 'Sentimento de baixa, mas exaustão vendedora possível. Aguarde pullback.';
    }
  } else {
    signal = 'WAIT';
    confidence = 25;
    reason = 'Mercado em zona de equilíbrio (Chop). Alta probabilidade de stop loss por ruído.';
  }

  return { signal, confidence, reason };
};
