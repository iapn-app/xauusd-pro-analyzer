import React from 'react';
import { getTrendForTimeframe } from '../services/decisionEngine';

interface Props {
  multiTimeframeData: Record<string, any>;
}

export const TimeframePanel = ({ multiTimeframeData }: Props) => {
  const timeframes = ['5min', '15min', '1h', '4h'];
  const labels: Record<string, string> = {
    '5min': 'M5',
    '15min': 'M15',
    '1h': 'H1',
    '4h': 'H4'
  };

  return (
    <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
      <h2 className="text-xl font-semibold mb-4 text-white">Multi-Timeframe</h2>
      <div className="grid grid-cols-2 gap-4">
        {timeframes.map(tf => {
          const candles = multiTimeframeData[tf]?.candles || [];
          const trend = getTrendForTimeframe(candles);
          
          return (
            <div key={tf} className="bg-zinc-800 p-4 rounded-xl">
              <p className="text-zinc-400 font-bold">{labels[tf]}</p>
              <p className={`text-sm font-bold ${
                trend === 'Bullish' ? 'text-emerald-500' : 
                trend === 'Bearish' ? 'text-red-500' : 
                'text-amber-500'
              }`}>
                {trend}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
