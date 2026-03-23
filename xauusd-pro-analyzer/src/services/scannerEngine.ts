import { DecisionResult } from './decisionEngine';
import { calculateWinProbability, calculateEV, TradeSetup } from './quantEngine';

export interface ScannedSetup extends TradeSetup {
  probability: number;
  ev: number;
  evPercent: number;
  rr: number;
  score: number;
  confidence: 'HIGH' | 'MODERATE' | 'LOW';
  label: string;
}

/**
 * Institutional Scanner Engine for XAUUSD
 * Finds and ranks the best trading opportunities
 */

export const generateTradeCandidates = (
  price: number,
  zones: { supportMain: number; resistanceMain: number; supportSecondary: number; resistanceSecondary: number }
): TradeSetup[] => {
  const range = zones.resistanceMain - zones.supportMain;
  const buffer = range * 0.05;

  return [
    // 1. BUY at Main Support
    {
      direction: 'BUY',
      entry: zones.supportMain,
      stop: zones.supportMain - buffer * 2,
      take: zones.resistanceMain,
      label: 'BUY @ Suporte Principal'
    } as any,
    // 2. BUY at Secondary Support
    {
      direction: 'BUY',
      entry: zones.supportSecondary,
      stop: zones.supportSecondary - buffer,
      take: zones.resistanceSecondary,
      label: 'BUY @ Suporte Secundário'
    } as any,
    // 3. SELL at Main Resistance
    {
      direction: 'SELL',
      entry: zones.resistanceMain,
      stop: zones.resistanceMain + buffer * 2,
      take: zones.supportMain,
      label: 'SELL @ Resistência Principal'
    } as any,
    // 4. SELL at Secondary Resistance
    {
      direction: 'SELL',
      entry: zones.resistanceSecondary,
      stop: zones.resistanceSecondary + buffer,
      take: zones.supportSecondary,
      label: 'SELL @ Resistência Secundária'
    } as any
  ];
};

export const calculateSetupScore = (
  evPercent: number,
  probability: number,
  rr: number,
  risk: number = 1
): number => {
  // score = (EV * 50) + (probabilidade * 30) + (RR * 10) - (risco * 10)
  // Normalizing EV (assuming 0-1 range for calculation, evPercent is already 0-100+)
  const normalizedEV = Math.min(100, Math.max(0, evPercent)) / 100;
  const normalizedProb = probability / 100;
  const normalizedRR = Math.min(5, rr) / 5;
  const normalizedRisk = Math.min(5, risk) / 5;

  const rawScore = (normalizedEV * 50) + (normalizedProb * 30) + (normalizedRR * 10) - (normalizedRisk * 10);
  
  // Scale to 0-100 (max possible raw is 50+30+10 = 90, min is -10)
  // Let's just clamp and scale roughly
  return Math.min(100, Math.max(0, (rawScore + 10) * (100 / 100)));
};

export const scanMarket = (
  decision: DecisionResult,
  price: number,
  zones: any
): ScannedSetup[] => {
  const candidates = generateTradeCandidates(price, zones);
  
  const scanned = candidates.map(candidate => {
    const prob = calculateWinProbability(decision, candidate.entry, zones);
    const { evValue, evPercent } = calculateEV(prob, candidate.entry, candidate.stop, candidate.take);
    const risk = Math.abs(candidate.entry - candidate.stop);
    const reward = Math.abs(candidate.take - candidate.entry);
    const rr = risk > 0 ? reward / risk : 0;
    
    const score = calculateSetupScore(evPercent, prob * 100, rr);
    
    let confidence: 'HIGH' | 'MODERATE' | 'LOW' = 'LOW';
    if (score > 80) confidence = 'HIGH';
    else if (score >= 60) confidence = 'MODERATE';

    return {
      ...candidate,
      probability: Math.round(prob * 100),
      ev: evValue,
      evPercent,
      rr: Number(rr.toFixed(2)),
      score: Math.round(score),
      confidence,
      label: (candidate as any).label
    };
  });

  // Filter Quality:
  // EV > 0, prob >= 50%, RR >= 1.3
  const filtered = scanned.filter(s => s.ev > 0 && s.probability >= 50 && s.rr >= 1.3);

  // Ranking: Highest score first
  return filtered.sort((a, b) => b.score - a.score);
};
