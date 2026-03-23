import React from 'react';
import { Wifi, Clock, Database, BarChart3 } from 'lucide-react';
import { MarketSnapshot } from '../types/market';

interface Props {
  snapshot: MarketSnapshot | null;
  loading: boolean;
}

export const FeedStatusPanel = ({ snapshot, loading }: Props) => {
  const status = loading ? 'Carregando...' : snapshot ? 'Live' : 'Fallback';
  const color = loading ? 'text-zinc-400' : snapshot ? 'text-emerald-500' : 'text-amber-500';

  return (
    <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
      <h2 className="text-xl font-semibold mb-4 text-white">Status do Feed</h2>
      <div className="space-y-3 text-sm">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2"><Wifi size={16} /><span>Status</span></div>
          <span className={`font-mono ${color}`}>{status}</span>
        </div>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2"><Clock size={16} /><span>Última Atualização</span></div>
          <span className="font-mono text-zinc-300">{snapshot ? snapshot.lastUpdate.toLocaleTimeString() : '---'}</span>
        </div>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2"><Database size={16} /><span>Fonte</span></div>
          <span className="font-mono text-zinc-300">TwelveData</span>
        </div>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2"><BarChart3 size={16} /><span>Timeframe</span></div>
          <span className="font-mono text-zinc-300">{snapshot?.timeframe || '---'}</span>
        </div>
      </div>
    </div>
  );
};
