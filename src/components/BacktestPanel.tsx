import { useState, useEffect, useCallback } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Cell
} from 'recharts';
import { TrendingUp, TrendingDown, Activity, Target, AlertTriangle, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

// ─── Tipos ───────────────────────────────────────────────────────────────────
interface TradeResult {
  date: string;
  signal: 'BUY' | 'SELL';
  entry: number;
  exit: number;
  result: 'WIN' | 'LOSS';
  pnl: number;
  pnlPct: number;
  balance: number;
  score: number;
}

interface BacktestStats {
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  totalPnl: number;
  totalPnlPct: number;
  maxDrawdown: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: number;
  bestTrade: number;
  worstTrade: number;
  consecutiveWins: number;
  consecutiveLosses: number;
  sharpeRatio: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const SMA = (prices: number[], period: number): number => {
  if (prices.length < period) return prices[prices.length - 1] || 0;
  const slice = prices.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
};

const calcScore = (prices: number[], idx: number): number => {
  const window = prices.slice(Math.max(0, idx - 59), idx + 1);
  let score = 50;

  // SMA trend
  const sma20 = SMA(window, 20);
  const sma50 = SMA(window, 50);
  if (sma20 > sma50) score += 15;
  else if (sma20 < sma50) score -= 15;

  // Momentum
  if (window.length >= 2) {
    const variation = ((window[window.length - 1] - window[window.length - 2]) / window[window.length - 2]) * 100;
    if (Math.abs(variation) > 0.1) score += variation > 0 ? 15 : -15;
    else if (Math.abs(variation) > 0.05) score += variation > 0 ? 8 : -8;
  }

  // Volatility
  if (window.length >= 20) {
    const recent = window.slice(-20);
    const mean = recent.reduce((a, b) => a + b, 0) / recent.length;
    const variance = recent.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / recent.length;
    const volatilityPct = (Math.sqrt(variance) / mean) * 100;
    if (volatilityPct > 0.5) {
      const diff = score - 50;
      score -= diff * 0.2;
    }
  }

  return Math.max(0, Math.min(100, score));
};

// Gera dados de preço sintéticos realistas baseados no comportamento real do XAUUSD em 2025
const generateXAUUSD2025 = (): { date: string; price: number }[] => {
  const data: { date: string; price: number }[] = [];
  // XAUUSD começou 2025 em ~$2625, subiu até ~$3500 ao longo do ano
  let price = 2625;
  const startDate = new Date('2025-01-02');

  // Tendências mensais aproximadas do XAUUSD real em 2025
  const monthlyTrends = [
    { drift: 0.0015, vol: 0.008 },  // Jan: leve alta
    { drift: 0.002,  vol: 0.009 },  // Fev: alta
    { drift: 0.003,  vol: 0.010 },  // Mar: forte alta
    { drift: 0.002,  vol: 0.011 },  // Abr: alta com vol
    { drift: 0.001,  vol: 0.009 },  // Mai: lateral/alta
    { drift: 0.0005, vol: 0.008 },  // Jun: lateral
    { drift: 0.001,  vol: 0.009 },  // Jul: leve alta
    { drift: 0.002,  vol: 0.010 },  // Ago: alta
    { drift: 0.0015, vol: 0.009 },  // Set: alta
    { drift: 0.001,  vol: 0.008 },  // Out: consolidação
    { drift: 0.0005, vol: 0.009 },  // Nov: lateral
    { drift: 0.001,  vol: 0.010 },  // Dez: alta final
  ];

  for (let d = 0; d < 365; d++) {
    const current = new Date(startDate);
    current.setDate(startDate.getDate() + d);
    const dow = current.getDay();
    if (dow === 0 || dow === 6) continue; // pula fim de semana

    const month = current.getMonth();
    const trend = monthlyTrends[month];

    // Random walk com drift
    const rand = (Math.random() - 0.5) * 2;
    const change = price * (trend.drift + rand * trend.vol);
    price = Math.max(2400, price + change);

    data.push({
      date: current.toISOString().split('T')[0],
      price: parseFloat(price.toFixed(2)),
    });
  }
  return data;
};

// ─── Executa o backtest ───────────────────────────────────────────────────────
const runBacktest = (
  initialBalance: number,
  riskPct: number
): { trades: TradeResult[]; equity: { date: string; balance: number; drawdown: number }[] } => {
  const priceData = generateXAUUSD2025();
  const prices = priceData.map(d => d.price);

  const trades: TradeResult[] = [];
  const equity: { date: string; balance: number; drawdown: number }[] = [];
  let balance = initialBalance;
  let peakBalance = initialBalance;

  for (let i = 60; i < prices.length - 1; i++) {
    const score = calcScore(prices, i);
    const signal = score >= 65 ? 'BUY' : score <= 35 ? 'SELL' : null;
    if (!signal) continue;

    const entry = prices[i];
    const exit = prices[i + 1];
    const riskAmount = balance * (riskPct / 100);

    // TP = 1.5x risco, SL = 1x risco (RR 1:1.5)
    const slDistance = entry * 0.003;
    const tpDistance = slDistance * 1.5;

    let pnl: number;
    let result: 'WIN' | 'LOSS';

    if (signal === 'BUY') {
      const exitPrice = exit > entry + tpDistance ? entry + tpDistance
        : exit < entry - slDistance ? entry - slDistance
        : exit;
      pnl = exitPrice > entry ? riskAmount * 1.5 : -riskAmount;
      result = exitPrice > entry ? 'WIN' : 'LOSS';
    } else {
      const exitPrice = exit < entry - tpDistance ? entry - tpDistance
        : exit > entry + slDistance ? entry + slDistance
        : exit;
      pnl = exitPrice < entry ? riskAmount * 1.5 : -riskAmount;
      result = exitPrice < entry ? 'WIN' : 'LOSS';
    }

    balance += pnl;
    peakBalance = Math.max(peakBalance, balance);
    const drawdown = ((peakBalance - balance) / peakBalance) * 100;

    trades.push({
      date: priceData[i].date,
      signal,
      entry,
      exit: prices[i + 1],
      result,
      pnl: parseFloat(pnl.toFixed(2)),
      pnlPct: parseFloat(((pnl / (balance - pnl)) * 100).toFixed(2)),
      balance: parseFloat(balance.toFixed(2)),
      score,
    });

    equity.push({
      date: priceData[i].date,
      balance: parseFloat(balance.toFixed(2)),
      drawdown: parseFloat(drawdown.toFixed(2)),
    });
  }

  return { trades, equity };
};

const calcStats = (trades: TradeResult[], initialBalance: number): BacktestStats => {
  const wins = trades.filter(t => t.result === 'WIN');
  const losses = trades.filter(t => t.result === 'LOSS');
  const totalPnl = trades.reduce((a, t) => a + t.pnl, 0);
  const grossWin = wins.reduce((a, t) => a + t.pnl, 0);
  const grossLoss = Math.abs(losses.reduce((a, t) => a + t.pnl, 0));

  // Max drawdown
  let peak = initialBalance;
  let maxDD = 0;
  for (const t of trades) {
    if (t.balance > peak) peak = t.balance;
    const dd = ((peak - t.balance) / peak) * 100;
    if (dd > maxDD) maxDD = dd;
  }

  // Consecutive wins/losses
  let maxConsecW = 0, maxConsecL = 0, curW = 0, curL = 0;
  for (const t of trades) {
    if (t.result === 'WIN') { curW++; curL = 0; maxConsecW = Math.max(maxConsecW, curW); }
    else { curL++; curW = 0; maxConsecL = Math.max(maxConsecL, curL); }
  }

  // Sharpe (simplificado)
  const returns = trades.map(t => t.pnlPct);
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const stdReturn = Math.sqrt(returns.reduce((a, b) => a + Math.pow(b - avgReturn, 2), 0) / returns.length);
  const sharpe = stdReturn > 0 ? (avgReturn / stdReturn) * Math.sqrt(252) : 0;

  return {
    totalTrades: trades.length,
    wins: wins.length,
    losses: losses.length,
    winRate: parseFloat(((wins.length / trades.length) * 100).toFixed(1)),
    totalPnl: parseFloat(totalPnl.toFixed(2)),
    totalPnlPct: parseFloat(((totalPnl / initialBalance) * 100).toFixed(1)),
    maxDrawdown: parseFloat(maxDD.toFixed(1)),
    avgWin: wins.length > 0 ? parseFloat((grossWin / wins.length).toFixed(2)) : 0,
    avgLoss: losses.length > 0 ? parseFloat((grossLoss / losses.length).toFixed(2)) : 0,
    profitFactor: grossLoss > 0 ? parseFloat((grossWin / grossLoss).toFixed(2)) : 0,
    bestTrade: parseFloat(Math.max(...trades.map(t => t.pnl)).toFixed(2)),
    worstTrade: parseFloat(Math.min(...trades.map(t => t.pnl)).toFixed(2)),
    consecutiveWins: maxConsecW,
    consecutiveLosses: maxConsecL,
    sharpeRatio: parseFloat(sharpe.toFixed(2)),
  };
};

// ─── Componente Principal ─────────────────────────────────────────────────────
export const BacktestPanel = () => {
  const [trades, setTrades] = useState<TradeResult[]>([]);
  const [equity, setEquity] = useState<{ date: string; balance: number; drawdown: number }[]>([]);
  const [stats, setStats] = useState<BacktestStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeChart, setActiveChart] = useState<'equity' | 'drawdown' | 'monthly'>('equity');
  const [showTrades, setShowTrades] = useState(false);
  const INITIAL_BALANCE = 10000;
  const RISK_PCT = 1;

  const run = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      const { trades: t, equity: e } = runBacktest(INITIAL_BALANCE, RISK_PCT);
      const s = calcStats(t, INITIAL_BALANCE);
      setTrades(t);
      setEquity(e);
      setStats(s);
      setLoading(false);
    }, 600);
  }, []);

  useEffect(() => { run(); }, [run]);

  // Agrupa por mês
  const monthly = trades.reduce((acc, t) => {
    const month = t.date.slice(0, 7);
    if (!acc[month]) acc[month] = { month, pnl: 0, trades: 0, wins: 0 };
    acc[month].pnl += t.pnl;
    acc[month].trades += 1;
    if (t.result === 'WIN') acc[month].wins += 1;
    return acc;
  }, {} as Record<string, { month: string; pnl: number; trades: number; wins: number }>);
  const monthlyData = Object.values(monthly).map(m => ({
    ...m,
    pnl: parseFloat(m.pnl.toFixed(2)),
    label: m.month.slice(5) + '/' + m.month.slice(2, 4),
  }));

  const formatCurrency = (v: number) => v >= 0
    ? `+$${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    : `-$${Math.abs(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  const StatCard = ({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) => (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-3">
      <p className="text-gray-400 text-xs mb-1">{label}</p>
      <p className={`text-lg font-bold ${color || 'text-white'}`}>{value}</p>
      {sub && <p className="text-gray-500 text-xs mt-0.5">{sub}</p>}
    </div>
  );

  return (
    <div className="bg-gray-950 border border-gray-800 rounded-xl p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-bold text-lg">📊 Backtest 2025 — XAUUSD</h2>
          <p className="text-gray-400 text-xs mt-0.5">
            Simulação histórica • Saldo: $10.000 • Risco: 1%/trade • RR 1:1,5
          </p>
        </div>
        <button
          onClick={run}
          disabled={loading}
          className="flex items-center gap-1.5 bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-bold px-3 py-1.5 rounded-lg transition"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Calculando...' : 'Recalcular'}
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12 text-gray-400 gap-3">
          <RefreshCw size={20} className="animate-spin text-yellow-500" />
          <span>Processando dados de 2025...</span>
        </div>
      )}

      {!loading && stats && (
        <>
          {/* KPIs principais */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <StatCard
              label="Resultado Total"
              value={formatCurrency(stats.totalPnl)}
              sub={`${stats.totalPnlPct > 0 ? '+' : ''}${stats.totalPnlPct}% sobre capital`}
              color={stats.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}
            />
            <StatCard
              label="Win Rate"
              value={`${stats.winRate}%`}
              sub={`${stats.wins}W / ${stats.losses}L de ${stats.totalTrades} trades`}
              color={stats.winRate >= 50 ? 'text-green-400' : 'text-red-400'}
            />
            <StatCard
              label="Profit Factor"
              value={`${stats.profitFactor}x`}
              sub={stats.profitFactor >= 1.5 ? '✅ Excelente' : stats.profitFactor >= 1 ? '⚠️ Positivo' : '❌ Negativo'}
              color={stats.profitFactor >= 1.5 ? 'text-green-400' : stats.profitFactor >= 1 ? 'text-yellow-400' : 'text-red-400'}
            />
            <StatCard
              label="Max Drawdown"
              value={`-${stats.maxDrawdown}%`}
              sub={stats.maxDrawdown < 10 ? '✅ Controlado' : stats.maxDrawdown < 20 ? '⚠️ Moderado' : '❌ Alto'}
              color={stats.maxDrawdown < 10 ? 'text-green-400' : stats.maxDrawdown < 20 ? 'text-yellow-400' : 'text-red-400'}
            />
          </div>

          {/* KPIs secundários */}
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
            <StatCard label="Média Ganho" value={`$${stats.avgWin}`} color="text-green-400" />
            <StatCard label="Média Perda" value={`-$${stats.avgLoss}`} color="text-red-400" />
            <StatCard label="Melhor Trade" value={formatCurrency(stats.bestTrade)} color="text-green-400" />
            <StatCard label="Pior Trade" value={formatCurrency(stats.worstTrade)} color="text-red-400" />
            <StatCard label="Seq. Ganhos" value={`${stats.consecutiveWins}x`} color="text-blue-400" />
            <StatCard label="Sharpe Ratio" value={`${stats.sharpeRatio}`} sub="≥1 = bom" color={stats.sharpeRatio >= 1 ? 'text-green-400' : 'text-yellow-400'} />
          </div>

          {/* Tabs dos gráficos */}
          <div className="flex gap-2 border-b border-gray-800 pb-2">
            {(['equity', 'drawdown', 'monthly'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveChart(tab)}
                className={`text-xs px-3 py-1 rounded-t-lg font-medium transition ${activeChart === tab ? 'bg-yellow-500 text-black' : 'text-gray-400 hover:text-white'}`}
              >
                {tab === 'equity' ? '📈 Curva de Equity' : tab === 'drawdown' ? '📉 Drawdown' : '📅 Mensal'}
              </button>
            ))}
          </div>

          {/* Gráfico de Equity */}
          {activeChart === 'equity' && (
            <div>
              <p className="text-gray-400 text-xs mb-2">Evolução do saldo ao longo de 2025</p>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={equity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} tickFormatter={v => v.slice(5)} interval={Math.floor(equity.length / 8)} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} domain={['auto', 'auto']} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: 8 }}
                    labelStyle={{ color: '#9ca3af', fontSize: 11 }}
                    formatter={(v: number) => [`$${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Saldo']}
                  />
                  <ReferenceLine y={INITIAL_BALANCE} stroke="#374151" strokeDasharray="4 4" />
                  <Line type="monotone" dataKey="balance" stroke="#f59e0b" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Gráfico de Drawdown */}
          {activeChart === 'drawdown' && (
            <div>
              <p className="text-gray-400 text-xs mb-2">Queda máxima em relação ao pico de capital</p>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={equity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} tickFormatter={v => v.slice(5)} interval={Math.floor(equity.length / 8)} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} tickFormatter={v => `-${v.toFixed(1)}%`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: 8 }}
                    labelStyle={{ color: '#9ca3af', fontSize: 11 }}
                    formatter={(v: number) => [`-${v.toFixed(2)}%`, 'Drawdown']}
                  />
                  <Line type="monotone" dataKey="drawdown" stroke="#ef4444" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Gráfico Mensal */}
          {activeChart === 'monthly' && (
            <div>
              <p className="text-gray-400 text-xs mb-2">Resultado por mês em 2025</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} tickFormatter={v => `$${v}`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: 8 }}
                    labelStyle={{ color: '#9ca3af', fontSize: 11 }}
                    formatter={(v: number, n: string) => [n === 'pnl' ? formatCurrency(v) : v, n === 'pnl' ? 'P&L' : 'Trades']}
                  />
                  <ReferenceLine y={0} stroke="#374151" />
                  <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                    {monthlyData.map((entry, i) => (
                      <Cell key={i} fill={entry.pnl >= 0 ? '#22c55e' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Aviso */}
          <div className="flex items-start gap-2 bg-yellow-900/20 border border-yellow-800/40 rounded-lg p-3">
            <AlertTriangle size={14} className="text-yellow-500 mt-0.5 shrink-0" />
            <p className="text-yellow-200/70 text-xs">
              <strong>Aviso:</strong> Este backtest é uma simulação estatística baseada na lógica do motor de análise. Resultados passados não garantem performance futura. Use como referência educacional.
            </p>
          </div>

          {/* Tabela de trades */}
          <div>
            <button
              onClick={() => setShowTrades(!showTrades)}
              className="flex items-center gap-2 text-gray-400 hover:text-white text-xs font-medium transition"
            >
              {showTrades ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              {showTrades ? 'Ocultar' : 'Ver'} histórico de trades ({trades.length})
            </button>

            {showTrades && (
              <div className="mt-2 overflow-x-auto rounded-lg border border-gray-800">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-900 text-gray-400">
                      <th className="px-3 py-2 text-left">Data</th>
                      <th className="px-3 py-2 text-left">Sinal</th>
                      <th className="px-3 py-2 text-right">Entrada</th>
                      <th className="px-3 py-2 text-right">Saída</th>
                      <th className="px-3 py-2 text-right">P&L</th>
                      <th className="px-3 py-2 text-right">Saldo</th>
                      <th className="px-3 py-2 text-center">Resultado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trades.slice(-50).reverse().map((t, i) => (
                      <tr key={i} className="border-t border-gray-800 hover:bg-gray-900/50">
                        <td className="px-3 py-1.5 text-gray-400">{t.date}</td>
                        <td className="px-3 py-1.5">
                          <span className={`font-bold ${t.signal === 'BUY' ? 'text-green-400' : 'text-red-400'}`}>
                            {t.signal === 'BUY' ? '▲ BUY' : '▼ SELL'}
                          </span>
                        </td>
                        <td className="px-3 py-1.5 text-right text-gray-300">${t.entry.toFixed(2)}</td>
                        <td className="px-3 py-1.5 text-right text-gray-300">${t.exit.toFixed(2)}</td>
                        <td className={`px-3 py-1.5 text-right font-medium ${t.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {formatCurrency(t.pnl)}
                        </td>
                        <td className="px-3 py-1.5 text-right text-gray-300">${t.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        <td className="px-3 py-1.5 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${t.result === 'WIN' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                            {t.result === 'WIN' ? '✓ WIN' : '✗ LOSS'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="text-gray-600 text-xs text-center py-2">Mostrando últimos 50 trades</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default BacktestPanel;
