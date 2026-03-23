import { MarketSnapshot } from '../types/market';

export const validateMarketDataQuality = (snapshot: MarketSnapshot): { isValid: boolean; issues: string[] } => {
  const issues: string[] = [];
  
  if (snapshot.price <= 0) issues.push('Preço inválido');
  if (snapshot.candles.length === 0) issues.push('Sem dados de candles');
  
  return {
    isValid: issues.length === 0,
    issues
  };
};
