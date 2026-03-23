import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';
import { Candle } from '../types/candles';
import { formatTime } from '../utils/dataFormatters';

interface Props {
  data: Candle[];
}

export const MarketChartCard = ({ data }: Props) => (
  <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
    <h2 className="text-xl font-semibold mb-4 text-white">Gráfico Principal (XAUUSD)</h2>
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data.map(c => ({ ...c, time: formatTime(c.timestamp) }))}>
          <XAxis dataKey="time" stroke="#71717a" />
          <YAxis domain={['auto', 'auto']} stroke="#71717a" />
          <Tooltip contentStyle={{ backgroundColor: '#18181b', border: 'none' }} />
          <Line type="monotone" dataKey="close" stroke="#f59e0b" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  </div>
);
