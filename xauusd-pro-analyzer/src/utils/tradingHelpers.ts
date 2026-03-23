import { TradeSetup, TradeRecommendation } from '../types/trading';
import * as TradingEngine from '../services/tradingEngine';

export const calculateSetupScore = (setup: TradeSetup): number => {
  const { entry, stopLoss, takeProfit } = setup;
  const rrResult = TradingEngine.calculateRiskReward(entry, stopLoss, takeProfit);
  const rr = rrResult.ratio;
  
  let score = 0;
  
  // RR Score
  if (rr >= 3) score += 50;
  else if (rr >= 2) score += 30;
  else if (rr >= 1.5) score += 10;
  
  // Risk Score
  if (setup.riskPercent <= 1) score += 20;
  else if (setup.riskPercent <= 2) score += 10;
  
  return Math.min(score, 100);
};

export const classifySetup = (score: number): TradeRecommendation['classification'] => {
  if (score >= 80) return 'EXCELENTE';
  if (score >= 60) return 'BOM';
  if (score >= 40) return 'ACEITÁVEL';
  return 'RUIM';
};

export const getTradeRecommendation = (score: number, direction: 'BUY' | 'SELL'): TradeRecommendation['recommendation'] => {
  if (score < 40) return 'NO TRADE';
  if (score < 60) return 'WAIT';
  return direction;
};
