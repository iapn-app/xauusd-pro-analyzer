import React from 'react';
import { MarketSnapshot } from '../types/market';

interface Props {
  snapshot: MarketSnapshot | null;
}

export const MarketOverviewPanel = ({ snapshot }: Props) => {
  if (!snapshot) return null;

  const direction = snapshot.variationPercent > 0 ? 'Alta' : 'Baixa';
  const force = Math.abs(snapshot.variationPercent) > 0.5 ? 'Forte' : 'Moderada';
  const condition = Math.abs(snapshot.variationPercent) < 0.1 ? 'Lateral' : 'Tendencial';
  const approach = snapshot.variationPercent > 0 ? 'Scalp Comprado' : 'Scalp Vendido';

  return (
    <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
      <h2 className="text-xl font-semibold mb-4 text-white">Panorama do Mercado</h2>
      <div className="space-y-3 text-sm text-zinc-400">
        <div className="flex justify-between">
          <span>Direção Dominante</span>
          <span className={snapshot.variationPercent > 0 ? 'text-emerald-500' : 'text-red-500'}>{direction}</span>
        </div>
        <div className="flex justify-between">
          <span>Força do Movimento</span>
          <span className={force === 'Forte' ? 'text-amber-500' : 'text-zinc-400'}>{force}</span>
        </div>
        <div className="flex justify-between">
          <span>Condição</span>
          <span className="text-white">{condition}</span>
        </div>
        <div className="flex justify-between">
          <span>Abordagem</span>
          <span className="text-amber-500">{approach}</span>
        </div>
      </div>
    </div>
  );
};
