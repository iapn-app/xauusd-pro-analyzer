export interface MarketData {
  price: number;
  variation: number;
  variationPercent: number;
  high: number;
  low: number;
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  volatility: 'LOW' | 'MEDIUM' | 'HIGH';
  session: 'ASIA' | 'LONDON' | 'NY';
  lastUpdate: Date;
}

export interface EconomicEvent {
  id: string;
  name: string;
  time: string;
  impact: 'LOW' | 'MEDIUM' | 'HIGH';
  currency: string;
}

export interface TradeSetup {
  entry: number;
  stopLoss: number;
  takeProfit: number;
  direction: 'BUY' | 'SELL';
  riskPercent: number;
  balance: number;
}

export interface TradeRecommendation {
  score: number;
  classification: 'RUIM' | 'ACEITÁVEL' | 'BOM' | 'EXCELENTE';
  recommendation: 'BUY' | 'SELL' | 'WAIT' | 'NO TRADE';
}
