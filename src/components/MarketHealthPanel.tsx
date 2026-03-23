import React from 'react';
import { Activity, ShieldCheck, AlertTriangle } from 'lucide-react';
import { MarketSnapshot } from '../types/market';
import { validateMarketDataQuality } from '../utils/validators';

interface Props {
  snapshot: MarketSnapshot | null;
}

export const MarketHealthPanel = ({ snapshot }: Props) => {
  if (!snapshot) return null;
  
  const { isValid, issues } = validateMarketDataQuality(snapshot);
  
  const healthStatus = isValid ? 'Premium' : issues.length > 2 ? 'Crítica' : 'Aceitável';
  const color = isValid ? 'text-emerald-500' : issues.length > 2 ? 'text-red-500' : 'text-amber-500';

  return (
    <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
      <h2 className="text-xl font-semibold mb-4 text-white">Integridade do Mercado</h2>
      <div className="flex items-center gap-4 mb-4">
        <div className={`p-3 rounded-full bg-zinc-800 ${color}`}>
          {isValid ? <ShieldCheck size={24} /> : <AlertTriangle size={24} />}
        </div>
        <div>
          <p className="text-zinc-400 text-sm">Status</p>
          <p className={`text-xl font-bold ${color}`}>{healthStatus}</p>
        </div>
      </div>
      <div className="space-y-2 text-sm text-zinc-400">
        <p>Consistência: {isValid ? 'Boa' : 'Baixa'}</p>
        <p>Estabilidade: {isValid ? 'Alta' : 'Variável'}</p>
        {issues.length > 0 && (
          <p className="text-red-400 text-xs mt-2">Alertas: {issues.join(', ')}</p>
        )}
      </div>
    </div>
  );
};
