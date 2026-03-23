import React from 'react';
import { Candle } from '../types/candles';
import { calculateDynamicKeyLevels } from '../utils/analysisHelpers';

interface Props {
  candles: Candle[];
  price: number;
}

export const KeyLevelsPanel = ({ candles, price }: Props) => {
  const levels = calculateDynamicKeyLevels(candles);
  
  return (
    <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
      <h2 className="text-xl font-semibold mb-4 text-white">Zonas Técnicas</h2>
      <div className="space-y-3 text-sm">
        <div className="flex justify-between"><span>Resistência Principal</span><span className="font-mono text-red-400">{levels.resistanceMain.toFixed(2)}</span></div>
        <div className="flex justify-between"><span>Resistência Secundária</span><span className="font-mono text-red-500">{levels.resistanceSecondary.toFixed(2)}</span></div>
        <div className="flex justify-between"><span>Preço Atual</span><span className="font-mono text-amber-500">{price.toFixed(2)}</span></div>
        <div className="flex justify-between"><span>Suporte Principal</span><span className="font-mono text-emerald-400">{levels.supportMain.toFixed(2)}</span></div>
        <div className="flex justify-between"><span>Suporte Secundário</span><span className="font-mono text-emerald-500">{levels.supportSecondary.toFixed(2)}</span></div>
      </div>
    </div>
  );
};
