import { DecisionResult } from './decisionEngine';
import { ScannedSetup } from './scannerEngine';
import { MarketSnapshot } from '../types/market';

export type AlertSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface MarketAlert {
  id: string;
  type: 'OPPORTUNITY' | 'CONFIDENCE' | 'RISK' | 'BREAKOUT' | 'REVERSAL';
  message: string;
  severity: AlertSeverity;
  timestamp: Date;
}

/**
 * Alert Engine for XAUUSD
 * Monitors market changes and generates intelligent alerts
 */

export const detectEvents = (
  currentSnapshot: MarketSnapshot,
  previousSnapshot: MarketSnapshot | null,
  currentDecision: DecisionResult | null,
  previousDecision: DecisionResult | null,
  bestSetup: ScannedSetup | null
): MarketAlert[] => {
  const alerts: MarketAlert[] = [];
  const now = new Date();

  if (!currentSnapshot) return [];

  // 1. OPORTUNIDADE DETECTADA & ALTA CONFIANÇA
  if (bestSetup) {
    if (bestSetup.score > 80) {
      alerts.push({
        id: `confidence-${now.getTime()}`,
        type: 'CONFIDENCE',
        message: `ALTA CONFIANÇA: Setup ${bestSetup.label} com score ${bestSetup.score}% detectado.`,
        severity: 'HIGH',
        timestamp: now
      });
    } else if (bestSetup.score > 70 && bestSetup.ev > 0) {
      alerts.push({
        id: `opportunity-${now.getTime()}`,
        type: 'OPPORTUNITY',
        message: `OPORTUNIDADE: Setup ${bestSetup.label} identificado com EV positivo.`,
        severity: 'MEDIUM',
        timestamp: now
      });
    }
  }

  // 2. RISCO ELEVADO
  if (currentSnapshot.volatility === 'HIGH') {
    alerts.push({
      id: `risk-vol-${now.getTime()}`,
      type: 'RISK',
      message: `RISCO ELEVADO: Alta volatilidade detectada no mercado.`,
      severity: 'HIGH',
      timestamp: now
    });
  }

  // 3. BREAKOUT
  if (previousSnapshot) {
    // Basic breakout detection (simplified)
    const currentPrice = currentSnapshot.price;
    const prevPrice = previousSnapshot.price;
    
    // We would need the actual zones here for a better check, 
    // but we can infer from price movement if it crosses a threshold
    // For now, let's use a significant price move as a proxy or if we have zones
  }

  // 4. REVERSÃO
  if (currentDecision && previousDecision) {
    if (currentDecision.signal !== previousDecision.signal && previousDecision.signal !== 'NEUTRAL') {
      alerts.push({
        id: `reversal-${now.getTime()}`,
        type: 'REVERSAL',
        message: `MUDANÇA DE TENDÊNCIA: Sinal mudou de ${previousDecision.signal} para ${currentDecision.signal}.`,
        severity: 'HIGH',
        timestamp: now
      });
    }
  }

  // 5. SCORE JUMP (Event detection)
  if (currentDecision && previousDecision) {
    if (currentDecision.score > 80 && previousDecision.score < 60) {
      alerts.push({
        id: `score-jump-${now.getTime()}`,
        type: 'CONFIDENCE',
        message: `FORTE OPORTUNIDADE DETECTADA: Score institucional saltou de ${previousDecision.score} para ${currentDecision.score}.`,
        severity: 'CRITICAL',
        timestamp: now
      });
    }
  }

  return alerts;
};

/**
 * Prioritizes and filters alerts
 */
export const processAlerts = (newAlerts: MarketAlert[], existingAlerts: MarketAlert[]): MarketAlert[] => {
  // Filter out duplicates (same type and message within a short timeframe)
  const uniqueNewAlerts = newAlerts.filter(newAlert => {
    return !existingAlerts.some(existing => 
      existing.type === newAlert.type && 
      existing.message === newAlert.message &&
      (new Date().getTime() - existing.timestamp.getTime() < 300000) // 5 minutes cache
    );
  });

  const combined = [...uniqueNewAlerts, ...existingAlerts].slice(0, 10);

  // Sort by severity priority
  const severityMap: Record<AlertSeverity, number> = {
    'CRITICAL': 0,
    'HIGH': 1,
    'MEDIUM': 2,
    'LOW': 3
  };

  return combined.sort((a, b) => {
    if (severityMap[a.severity] !== severityMap[b.severity]) {
      return severityMap[a.severity] - severityMap[b.severity];
    }
    return b.timestamp.getTime() - a.timestamp.getTime();
  });
};
