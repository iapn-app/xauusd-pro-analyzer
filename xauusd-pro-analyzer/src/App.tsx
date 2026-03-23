import React, { useState, useEffect, useMemo } from 'react';
import { TrendingUp, Activity, AlertTriangle, CheckCircle2, Circle, DollarSign, Target, BarChart3, Clock, Newspaper, ArrowUp, ArrowDown, RefreshCw } from 'lucide-react';
import { MarketChartCard } from './components/MarketChartCard';
import { TimeframePanel } from './components/TimeframePanel';
import { KeyLevelsPanel } from './components/KeyLevelsPanel';
import { RecommendationPanel } from './components/RecommendationPanel';
import { MarketOverviewPanel } from './components/MarketOverviewPanel';
import { SmartAlertsPanel } from './components/SmartAlertsPanel';
import { FeedStatusPanel } from './components/FeedStatusPanel';
import { MarketHealthPanel } from './components/MarketHealthPanel';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { getMarketSnapshot, getMultiTimeframeData } from './services/marketDataService';
import { getEconomicEvents } from './services/economicCalendarService';
import { MarketSnapshot } from './types/market';
import { EconomicEvent } from './types/events';
import { calculateSetupScore, classifySetup, getTradeRecommendation } from './utils/tradingHelpers';
import { formatNumberSafe, getRiskProfile } from './utils/tradingUtils';
import * as TradingEngine from './services/tradingEngine';
import { calculateDecision, DecisionResult } from './services/decisionEngine';
import { calculateDynamicKeyLevels } from './utils/analysisHelpers';
import { performQuantAnalysis, calculateWinProbability, calculateEV } from './services/quantEngine';
import { scanMarket, ScannedSetup } from './services/scannerEngine';
import { detectEvents, processAlerts, MarketAlert } from './services/alertEngine';
import { authService, User } from './services/authService';
import { AuthModal } from './components/AuthModal';
import { User as UserIcon, LogIn, Crown, LogOut, Shield } from 'lucide-react';
import { UpgradePage } from './pages/Upgrade';
import { SplashScreen } from './components/SplashScreen';
import { AuthPage } from './pages/Auth';
import { AdminPage } from './pages/Admin';
import { CheckoutSuccess } from './pages/CheckoutSuccess';
import { CheckoutCancel } from './pages/CheckoutCancel';

interface ChecklistItem { id: number; label: string; done: boolean; }
interface BestHourItem { time: string; value: number; }
interface SimulationTrade {
  id: string;
  entry: number;
  exit: number;
  lot: number;
  direction: 'BUY' | 'SELL';
  result: number;
  balanceAfter: number;
  timestamp: Date;
}

const BEST_HOURS: BestHourItem[] = [
  { time: '08:00', value: 65 },
  { time: '09:00', value: 85 },
  { time: '10:00', value: 95 },
  { time: '11:00', value: 75 },
  { time: '14:00', value: 80 },
  { time: '15:00', value: 70 },
];

export default function App() {
  const [user, setUser] = useState<User | null>({
    id: 'fake-user-id',
    email: 'admin@xauusd.pro',
    plan: 'premium',
    isAdmin: true,
    isVip: true,
    isLifetime: true,
    role: 'admin',
    createdAt: new Date(),
    trialStart: null,
    trialEnd: null,
    subscriptionStatus: 'active',
    subscriptionPlan: 'premium',
    subscriptionStartedAt: null,
  });
  const [isSplashVisible, setIsSplashVisible] = useState(true);
  const [view, setView] = useState<'dashboard' | 'upgrade' | 'admin' | 'checkout-success' | 'checkout-cancel'>('dashboard');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [snapshot, setSnapshot] = useState<MarketSnapshot | null>(null);
  const [multiTimeframeData, setMultiTimeframeData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [economicEvents, setEconomicEvents] = useState<EconomicEvent[]>([]);
  const [alerts, setAlerts] = useState<MarketAlert[]>([]);
  const [prevSnapshot, setPrevSnapshot] = useState<MarketSnapshot | null>(null);
  const [prevDecision, setPrevDecision] = useState<DecisionResult | null>(null);

  useEffect(() => {
    // Initialize user
    authService.getCurrentUser().then(setUser);

    // Listen for auth state changes
    const { data: authListener } = authService.onAuthStateChange((updatedUser) => {
      setUser(updatedUser);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Centralized Market State
  const marketState = useMemo(() => ({
    price: snapshot?.price || 0,
    lastUpdate: snapshot?.lastUpdate || new Date(),
    isValid: !!snapshot && !loading && !error,
    candles: snapshot?.candles || [],
    variation: snapshot?.variation || 0,
    variationPercent: snapshot?.variationPercent || 0,
    sentiment: snapshot?.sentiment || 'NEUTRAL',
    volatility: snapshot?.volatility || 'MEDIUM'
  }), [snapshot, loading, error]);

  const decision = useMemo(() => {
    if (!snapshot || Object.keys(multiTimeframeData).length === 0) return null;
    
    const zones = calculateDynamicKeyLevels(snapshot.candles);
    const highImpactNews = economicEvents.some(e => e.impact === 'HIGH');

    return calculateDecision({
      price: snapshot.price,
      historicalData: Object.keys(multiTimeframeData).reduce((acc, tf) => {
        acc[tf] = multiTimeframeData[tf].candles;
        return acc;
      }, {} as any),
      zones,
      volatility: snapshot.volatility,
      session: snapshot.session,
      newsImpact: highImpactNews ? 'HIGH' : 'LOW'
    });
  }, [snapshot, multiTimeframeData, economicEvents]);

  const quantAnalysis = useMemo(() => {
    if (!snapshot || !decision) return null;
    const zones = calculateDynamicKeyLevels(snapshot.candles);
    return performQuantAnalysis(decision, snapshot.price, zones);
  }, [snapshot, decision]);

  // Scanner Engine Integration
  const scannedOpportunities = useMemo(() => {
    if (!snapshot || !decision) return [];
    const zones = calculateDynamicKeyLevels(snapshot.candles);
    return scanMarket(decision, snapshot.price, zones);
  }, [snapshot, decision]);

  // Final Institutional Recommendation (Decision + Quant + Scanner)
  const finalRecommendation = useMemo(() => {
    if (!decision || !quantAnalysis) return null;

    const topSetup = scannedOpportunities.length > 0 ? scannedOpportunities[0] : null;

    let signal = decision.signal;
    let confidence = decision.confidence;
    const reasons = [...decision.reasons];

    // Use top setup if available and better than current decision
    if (topSetup && topSetup.score > 70) {
      signal = topSetup.direction;
      confidence = topSetup.score;
      reasons.unshift(`OPORTUNIDADE SCANNER: ${topSetup.label} detectado com score ${topSetup.score}.`);
    }

    // EV Filter
    if (quantAnalysis.ev < 0 || quantAnalysis.probability < 50) {
      if (!topSetup || topSetup.score < 60) {
        signal = 'NEUTRAL';
        let reason = 'Aguardando Setup';
        if (quantAnalysis.ev < 0) reason = 'EV negativo';
        else if (quantAnalysis.probability < 50) reason = 'Baixa probabilidade';
        
        // Check if "Fora de zona" is applicable (far from main zones)
        const zones = calculateDynamicKeyLevels(snapshot.candles);
        const threshold = snapshot.price * 0.002; // 0.2%
        const nearZone = Math.abs(snapshot.price - zones.supportMain) < threshold || 
                         Math.abs(snapshot.price - zones.resistanceMain) < threshold;
        
        if (!nearZone) reason = 'Fora de zona';

        reasons.push(`TRADE DESCARTADO: ${reason}`);
      }
    }

    // EV Boost
    if (quantAnalysis.evPercent > 20) {
      confidence = Math.min(100, confidence + 10);
      reasons.push("ALTA VANTAGEM MATEMÁTICA: EV superior a 20% do risco.");
    }

    return {
      ...decision,
      signal,
      confidence,
      reasons,
      quant: topSetup || quantAnalysis
    };
  }, [decision, quantAnalysis, scannedOpportunities]);

  // Alert Engine Integration
  useEffect(() => {
    if (!snapshot || !finalRecommendation) return;

    const newEvents = detectEvents(
      snapshot,
      prevSnapshot,
      finalRecommendation,
      prevDecision,
      scannedOpportunities.length > 0 ? scannedOpportunities[0] : null
    );

    if (newEvents.length > 0) {
      setAlerts(prev => processAlerts(newEvents, prev));
    }

    setPrevSnapshot(snapshot);
    setPrevDecision(finalRecommendation);
  }, [snapshot, finalRecommendation, scannedOpportunities]);

  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    { id: 1, label: 'Mercado Aberto', done: true },
    { id: 2, label: 'Ativo: XAUUSD', done: true },
    { id: 3, label: 'Time Frame: M5', done: true },
    { id: 4, label: 'Horário Validado', done: false },
    { id: 5, label: 'Setup Validado', done: false },
    { id: 6, label: 'Risco Definido', done: false },
  ]);

  // Fimathe State
  const [fimathe, setFimathe] = useState({ balance: 10000, risk: 1, entry: 2650, sl: 2645, tp: 2660, dir: 'BUY' as 'BUY' | 'SELL' });
  const [fimatheResult, setFimatheResult] = useState<any>(null);
  const [fimatheValidation, setFimatheValidation] = useState<TradingEngine.ValidationResult | null>(null);

  // Auto-setup integration for Fimathe
  useEffect(() => {
    if (quantAnalysis?.setup) {
      setFimathe(prev => ({
        ...prev,
        entry: quantAnalysis.setup.entry,
        sl: quantAnalysis.setup.stop,
        tp: quantAnalysis.setup.take,
        dir: quantAnalysis.setup.direction
      }));
    }
  }, [quantAnalysis?.setup]);

  // Simulator State
  const [simulator, setSimulator] = useState({ capital: 10000, risk: 1, entry: 2650, exit: 2660, lot: 0.1, dir: 'BUY' as 'BUY' | 'SELL', sl: 2645 });
  const [simulationTrades, setSimulationTrades] = useState<SimulationTrade[]>([]);
  
  // Auto-check trial/coupon expiration
  useEffect(() => {
    const checkAuthStatus = async () => {
      const currentUser = await authService.getCurrentUser();
      if (JSON.stringify(currentUser) !== JSON.stringify(user)) {
        setUser(currentUser);
      }
    };
    const interval = setInterval(checkAuthStatus, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [user]);

  // Handle hash routing for checkout
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#checkout-success')) {
        setView('checkout-success');
      } else if (hash.startsWith('#checkout-cancel')) {
        setView('checkout-cancel');
      } else if (hash === '#upgrade') {
        setView('upgrade');
      } else if (hash === '#admin') {
        setView('admin');
      } else {
        setView('dashboard');
      }
    };

    // Check initial hash
    handleHashChange();

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Risk State
  const [risk, setRisk] = useState({ maxDailyLoss: 5, maxWeeklyLoss: 10 }); // in %
  const riskProfile = useMemo(() => getRiskProfile(fimathe.risk), [fimathe.risk]);

  // Derived Simulation Metrics
  const simMetrics = useMemo(() => {
    if (simulationTrades.length === 0) return { winRate: 0, roi: 0, profitFactor: 0, totalPnL: 0, currentBalance: simulator.capital };
    
    const wins = simulationTrades.filter(t => t.result > 0);
    const losses = simulationTrades.filter(t => t.result < 0);
    const totalProfit = wins.reduce((acc, t) => acc + t.result, 0);
    const totalLoss = Math.abs(losses.reduce((acc, t) => acc + t.result, 0));
    const totalPnL = simulationTrades.reduce((acc, t) => acc + t.result, 0);
    
    return {
      winRate: (wins.length / simulationTrades.length) * 100,
      roi: (totalPnL / simulator.capital) * 100,
      profitFactor: totalLoss === 0 ? totalProfit : totalProfit / totalLoss,
      totalPnL,
      currentBalance: simulator.capital + totalPnL
    };
  }, [simulationTrades, simulator.capital]);

  // Risk Limits Check
  const riskStatus = useMemo(() => {
    const dailyPnL = simulationTrades
      .filter(t => t.timestamp.toDateString() === new Date().toDateString())
      .reduce((acc, t) => acc + t.result, 0);
    
    // Weekly PnL (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const weeklyPnL = simulationTrades
      .filter(t => t.timestamp >= sevenDaysAgo)
      .reduce((acc, t) => acc + t.result, 0);

    return TradingEngine.checkRiskLimits(dailyPnL, weeklyPnL, simulator.capital);
  }, [simulationTrades, simulator.capital]);

  // Fetch Market Snapshot (every 60s)
  useEffect(() => {
    const fetchSnapshot = async () => {
      try {
        const data = await getMarketSnapshot('5min');
        setSnapshot(data);
        setError(null);
      } catch (error) {
        setError('Erro ao carregar dados do mercado');
        console.error('MARKET DATA ERROR:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSnapshot();
    const interval = setInterval(fetchSnapshot, 60000);
    return () => clearInterval(interval);
  }, []);

  // Fetch Multi-Timeframe Data
  useEffect(() => {
    const fetchMulti = async () => {
      try {
        const data = await getMultiTimeframeData();
        setMultiTimeframeData(data);
      } catch (err) {
        console.error('Error fetching multi-timeframe:', err);
      }
    };
    
    // Pequeno atraso inicial para não competir com o snapshot principal
    const initialTimeout = setTimeout(fetchMulti, 15000);
    const interval = setInterval(fetchMulti, 300000); // 5 min
    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, []);

  // Fetch Events
  useEffect(() => {
    getEconomicEvents().then(setEconomicEvents).catch(console.error);
  }, []);

  const handleCalculateFimathe = () => {
    const posSize = TradingEngine.calculatePositionSize(fimathe.balance, fimathe.risk, fimathe.entry, fimathe.sl);
    const rr = TradingEngine.calculateRiskReward(fimathe.entry, fimathe.sl, fimathe.tp);
    const validation = TradingEngine.validateTrade(fimathe.risk, rr.ratio);
    
    setFimatheResult({ ...posSize, ...rr });
    setFimatheValidation(validation);
  };

  const fimatheQuant = useMemo(() => {
    if (!decision || !snapshot) return null;
    const zones = calculateDynamicKeyLevels(snapshot.candles);
    const prob = calculateWinProbability(decision, fimathe.entry, zones);
    const ev = calculateEV(prob, fimathe.entry, fimathe.sl, fimathe.tp);
    return { prob: Math.round(prob * 100), ...ev };
  }, [decision, snapshot, fimathe.entry, fimathe.sl, fimathe.tp]);

  const simulatorQuant = useMemo(() => {
    if (!decision || !snapshot) return null;
    const zones = calculateDynamicKeyLevels(snapshot.candles);
    const prob = calculateWinProbability(decision, simulator.entry, zones);
    const ev = calculateEV(prob, simulator.entry, simulator.sl, simulator.exit);
    return { prob: Math.round(prob * 100), ...ev };
  }, [decision, snapshot, simulator.entry, simulator.sl, simulator.exit]);

  const handleCalculateSimulatorLot = () => {
    const posSize = TradingEngine.calculatePositionSize(simulator.capital, simulator.risk, simulator.entry, simulator.sl);
    setSimulator({ ...simulator, lot: posSize.recommendedLotSize });
  };

  const handleLoadBestSetup = () => {
    const best = scannedOpportunities[0];
    if (best) {
      setSimulator(prev => ({
        ...prev,
        entry: best.entry,
        sl: best.stop,
        exit: best.take,
        dir: best.direction
      }));
    }
  };

  const handleAddSimulationTrade = () => {
    if (riskStatus.isBlocked) {
      alert('LIMITE DE RISCO ATINGIDO: Operações bloqueadas.');
      return;
    }

    const pnl = TradingEngine.calculatePnL(simulator.entry, simulator.exit, simulator.lot, simulator.dir);
    const newTrade: SimulationTrade = {
      id: Math.random().toString(36).substr(2, 9),
      entry: simulator.entry,
      exit: simulator.exit,
      lot: simulator.lot,
      direction: simulator.dir,
      result: pnl.profit,
      balanceAfter: simMetrics.currentBalance + pnl.profit,
      timestamp: new Date()
    };
    
    setSimulationTrades([newTrade, ...simulationTrades]);
  };

  const clearSimulation = () => {
    setSimulationTrades([]);
  };

  const toggleChecklist = (id: number) => {
    setChecklist(checklist.map(item => item.id === id ? { ...item, done: !item.done } : item));
  };

  const handleLogout = async () => {
    // TEMPORARY BYPASS: Do not actually logout
    // await authService.logout();
    // setUser(null);
    // setView('dashboard');
    window.location.reload();
  };

  if (isSplashVisible) {
    return <SplashScreen onFinish={() => setIsSplashVisible(false)} />;
  }

  // TEMPORARY BYPASS: Do not render AuthPage
  // if (!user) {
  //   return <AuthPage onAuthSuccess={(u) => setUser(u)} />;
  // }

  if (view === 'admin' && user?.isAdmin) {
    return <AdminPage onBack={() => { window.location.hash = ''; setView('dashboard'); }} onUserUpdate={setUser} />;
  }

  if (view === 'upgrade') {
    return <UpgradePage onBack={() => { window.location.hash = ''; setView('dashboard'); }} />;
  }

  if (view === 'checkout-success') {
    return <CheckoutSuccess onGoToDashboard={() => { window.location.hash = ''; setView('dashboard'); }} onUserUpdate={setUser} />;
  }

  if (view === 'checkout-cancel') {
    return <CheckoutCancel onGoToPlans={() => { window.location.hash = '#upgrade'; setView('upgrade'); }} />;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 md:p-8 font-sans">
      {/* DEBUG BANNER */}
      <div className="bg-red-500 text-white text-center py-1 font-bold text-sm tracking-widest mb-4 rounded-lg">
        DEBUG MODE ATIVO
      </div>

      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight">XAUUSD PRO ANALYZER</h1>
          <p className="text-zinc-400">Painel Operacional MT5</p>
        </div>

        <div className="flex items-center gap-3">
          {user?.isAdmin && (
            <button 
              onClick={() => setView('admin')}
              className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-500 px-3 py-1.5 md:px-4 md:py-2 rounded-xl font-bold text-[10px] md:text-xs hover:bg-red-500/20 transition-all"
            >
              <Shield size={14} />
              <span className="hidden sm:inline">ADMIN PANEL</span>
              <span className="sm:hidden">ADMIN</span>
            </button>
          )}

          {user && user.plan !== 'premium' && !user.isVip && (
            <button 
              onClick={() => setView('upgrade')}
              className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 text-black px-3 py-1.5 md:px-4 md:py-2 rounded-xl font-bold text-[10px] md:text-xs hover:from-amber-400 hover:to-amber-500 transition-all shadow-lg shadow-amber-500/10 animate-pulse"
            >
              <Crown size={14} />
              <span className="hidden sm:inline">UPGRADE</span>
              <span className="sm:hidden">PRO</span>
            </button>
          )}
          
          <button 
            onClick={() => setIsAuthModalOpen(true)}
            className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-2xl hover:bg-zinc-800 transition-all group"
          >
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-white">{user?.email?.split('@')[0]}</p>
              <p className={`text-[8px] font-black uppercase tracking-widest ${
                user?.isAdmin ? 'text-red-500' :
                user?.isVip ? 'text-emerald-400' :
                user?.plan === 'premium' ? 'text-purple-500' :
                user?.plan === 'pro' ? 'text-amber-500' :
                user?.plan === 'trial' ? 'text-emerald-500' :
                'text-zinc-500'
              }`}>
                {user?.isAdmin ? 'ADMIN' : user?.isVip ? 'VIP PREMIUM' : user?.plan?.toUpperCase()}
              </p>
            </div>
            <div className="w-10 h-10 bg-emerald-500/10 rounded-full flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
              <UserIcon className="text-emerald-500" size={20} />
            </div>
          </button>

          <button 
            onClick={handleLogout}
            className="w-10 h-10 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-500 transition-all"
            title="Sair"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6 mb-8">
          <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 flex items-center justify-between">
            <span className="text-zinc-400">XAUUSD</span>
            <span className="text-xl font-mono text-amber-500">
              {loading ? '...' : error ? 'Erro' : `$${snapshot?.price.toFixed(2) || '---'}`}
            </span>
          </div>
          <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 flex items-center justify-between">
            <span className="text-zinc-400">Variação</span>
            <span className={`text-xl font-mono ${snapshot && snapshot.variation >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {loading ? '...' : error ? '---' : `${snapshot?.variationPercent.toFixed(2)}%`}
            </span>
          </div>
          <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 flex items-center justify-between">
            <span className="text-zinc-400">Sentimento</span>
            <span className="text-xl font-mono text-emerald-500">
              {loading ? '...' : error ? '---' : snapshot?.sentiment || '---'}
            </span>
          </div>
          <div className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 flex items-center justify-between">
            <span className="text-zinc-400">Sessão</span>
            <span className="text-xl font-mono text-zinc-100">{snapshot?.session || '---'}</span>
          </div>
        </div>

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <MarketChartCard data={marketState.candles} />
          <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <KeyLevelsPanel candles={marketState.candles} price={marketState.price} />
            <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
              <h2 className="text-xl font-semibold mb-4 text-white">Calculadora Fimathe</h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-zinc-500">Saldo ($)</label>
                  <input type="number" className="bg-zinc-800 p-2 rounded-lg w-full" value={fimathe.balance} onChange={e => setFimathe({...fimathe, balance: Number(e.target.value)})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-zinc-500">Risco (%)</label>
                  <input type="number" className={`bg-zinc-800 p-2 rounded-lg w-full ${fimathe.risk > 2 ? 'border border-red-500 text-red-500' : ''}`} value={fimathe.risk} onChange={e => setFimathe({...fimathe, risk: Number(e.target.value)})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-zinc-500">Entrada</label>
                  <input type="number" className="bg-zinc-800 p-2 rounded-lg w-full" value={fimathe.entry} onChange={e => setFimathe({...fimathe, entry: Number(e.target.value)})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-zinc-500">Stop Loss</label>
                  <input type="number" className="bg-zinc-800 p-2 rounded-lg w-full" value={fimathe.sl} onChange={e => setFimathe({...fimathe, sl: Number(e.target.value)})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-zinc-500">Take Profit</label>
                  <input type="number" className="bg-zinc-800 p-2 rounded-lg w-full" value={fimathe.tp} onChange={e => setFimathe({...fimathe, tp: Number(e.target.value)})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-zinc-500">Direção</label>
                  <select className="bg-zinc-800 p-2 rounded-lg w-full" value={fimathe.dir} onChange={e => setFimathe({...fimathe, dir: e.target.value as 'BUY' | 'SELL'})}>
                    <option>BUY</option>
                    <option>SELL</option>
                  </select>
                </div>
              </div>
              <button onClick={handleCalculateFimathe} className="w-full bg-amber-500 text-black font-bold py-3 rounded-xl mt-4">CALCULAR SETUP</button>
              
              {fimatheResult && (
                <div className="mt-4 p-4 bg-zinc-800 rounded-xl text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Risco em $:</span>
                    <span className="font-mono">${formatNumberSafe(fimatheResult.riskAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Dist. SL (Points):</span>
                    <span className="font-mono">{formatNumberSafe(fimatheResult.stopDistancePoints, 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">R:R:</span>
                    <span className={`font-mono ${fimatheResult.ratio < 1.5 ? 'text-red-500' : 'text-emerald-500'}`}>{formatNumberSafe(fimatheResult.ratio)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-zinc-700">
                    <span className="font-bold text-white">Lote Sugerido:</span>
                    <span className="font-bold text-amber-500 text-lg">{formatNumberSafe(fimatheResult.recommendedLotSize, 2)}</span>
                  </div>

                  {fimatheQuant && (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div className="bg-zinc-900/50 p-2 rounded-lg border border-zinc-700/50">
                        <p className="text-[9px] text-zinc-500 uppercase">Probabilidade</p>
                        <p className="text-xs font-bold text-emerald-400">{fimatheQuant.prob}%</p>
                      </div>
                      <div className="bg-zinc-900/50 p-2 rounded-lg border border-zinc-700/50">
                        <p className="text-[9px] text-zinc-500 uppercase">EV (Matemático)</p>
                        <p className={`text-xs font-bold ${fimatheQuant.evValue > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {fimatheQuant.evValue > 0 ? '+' : ''}{fimatheQuant.evValue}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  <button 
                    onClick={() => {
                      setSimulator({
                        ...simulator,
                        entry: fimathe.entry,
                        exit: fimathe.tp,
                        sl: fimathe.sl,
                        lot: fimatheResult.recommendedLotSize,
                        dir: fimathe.dir
                      });
                      alert('Setup enviado para o Simulador!');
                    }}
                    className="w-full bg-zinc-700 text-white font-bold py-2 rounded-lg mt-2 text-xs hover:bg-zinc-600 transition-colors"
                  >
                    ENVIAR PARA SIMULADOR
                  </button>
                  
                  {fimatheValidation && (
                    <div className={`mt-2 p-2 rounded-lg text-xs ${fimatheValidation.status === 'OK' ? 'bg-emerald-900/30 text-emerald-400' : 'bg-red-900/30 text-red-400'}`}>
                      <div className="flex items-center gap-2 font-bold mb-1">
                        {fimatheValidation.status === 'OK' ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                        {fimatheValidation.status === 'OK' ? 'SETUP VALIDADO' : 'ALERTA DE RISCO'}
                      </div>
                      {fimatheValidation.messages.map((msg, i) => <p key={i}>• {msg}</p>)}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-white">Simulador de Operação</h2>
                {scannedOpportunities.length > 0 && (
                  <button 
                    onClick={() => {
                      if (authService.checkAccess('scanner', user)) {
                        handleLoadBestSetup();
                      } else {
                        setIsAuthModalOpen(true);
                      }
                    }}
                    className="text-[10px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-1 rounded-md hover:bg-emerald-500/20 transition-colors font-bold flex items-center gap-1 relative overflow-hidden group"
                  >
                    <Target size={10} />
                    CARREGAR MELHOR SETUP
                    {!authService.checkAccess('scanner', user) && (
                      <div className="absolute inset-0 bg-zinc-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[8px] font-black text-amber-500">PRO</span>
                      </div>
                    )}
                  </button>
                )}
              </div>
              
              {simulatorQuant && (
                <div className="flex gap-2 mb-4 relative">
                  <div className="flex-1 bg-zinc-800/50 p-2 rounded-lg border border-zinc-700/50 flex justify-between items-center">
                    <span className="text-[9px] text-zinc-500 uppercase font-bold">Prob. Real</span>
                    <span className="text-xs font-mono text-emerald-400 font-bold">{simulatorQuant.prob}%</span>
                  </div>
                  <div className="flex-1 bg-zinc-800/50 p-2 rounded-lg border border-zinc-700/50 flex justify-between items-center relative group">
                    <span className="text-[9px] text-zinc-500 uppercase font-bold">EV Setup</span>
                    {authService.checkAccess('ev', user) ? (
                      <span className={`text-xs font-mono font-bold ${simulatorQuant.evValue > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {simulatorQuant.evValue > 0 ? '+' : ''}{simulatorQuant.evValue}
                      </span>
                    ) : (
                      <button 
                        onClick={() => setIsAuthModalOpen(true)}
                        className="text-xs font-mono font-bold text-zinc-600 blur-[2px] group-hover:blur-none transition-all"
                      >
                        +0.00
                        <span className="absolute inset-0 flex items-center justify-center text-[8px] font-black text-amber-500 bg-zinc-900/80 rounded opacity-0 group-hover:opacity-100 transition-opacity">PRO</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-zinc-500">Entrada</label>
                  <input type="number" className="bg-zinc-800 p-2 rounded-lg w-full" value={simulator.entry} onChange={e => setSimulator({...simulator, entry: Number(e.target.value)})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-zinc-500">Saída</label>
                  <input type="number" className="bg-zinc-800 p-2 rounded-lg w-full" value={simulator.exit} onChange={e => setSimulator({...simulator, exit: Number(e.target.value)})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-zinc-500">Stop Loss</label>
                  <input type="number" className="bg-zinc-800 p-2 rounded-lg w-full" value={simulator.sl} onChange={e => setSimulator({...simulator, sl: Number(e.target.value)})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-zinc-500">Risco (%)</label>
                  <input type="number" className="bg-zinc-800 p-2 rounded-lg w-full" value={simulator.risk} onChange={e => setSimulator({...simulator, risk: Number(e.target.value)})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-zinc-500">Lote</label>
                  <div className="flex gap-1">
                    <input type="number" step="0.01" className="bg-zinc-800 p-2 rounded-lg w-full" value={simulator.lot} onChange={e => setSimulator({...simulator, lot: Number(e.target.value)})} />
                    <button onClick={handleCalculateSimulatorLot} className="bg-zinc-700 p-2 rounded-lg hover:bg-zinc-600" title="Calcular Lote">
                      <RefreshCw size={14} />
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-zinc-500">Direção</label>
                  <select className="bg-zinc-800 p-2 rounded-lg w-full" value={simulator.dir} onChange={e => setSimulator({...simulator, dir: e.target.value as 'BUY' | 'SELL'})}>
                    <option>BUY</option>
                    <option>SELL</option>
                  </select>
                </div>
              </div>
              <button 
                onClick={handleAddSimulationTrade} 
                disabled={riskStatus.isBlocked}
                className={`w-full font-bold py-3 rounded-xl mt-4 transition-colors ${riskStatus.isBlocked ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed' : 'bg-emerald-500 text-black hover:bg-emerald-400'}`}
              >
                EXECUTAR TRADE
              </button>
              
              <div className="mt-6 grid grid-cols-3 gap-2">
                <div className="bg-zinc-800 p-2 rounded-lg text-center">
                  <p className="text-[10px] text-zinc-500 uppercase">Winrate</p>
                  <p className="text-sm font-bold text-emerald-500">{simMetrics.winRate.toFixed(1)}%</p>
                </div>
                <div className="bg-zinc-800 p-2 rounded-lg text-center">
                  <p className="text-[10px] text-zinc-500 uppercase">ROI</p>
                  <p className={`text-sm font-bold ${simMetrics.roi >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{simMetrics.roi.toFixed(2)}%</p>
                </div>
                <div className="bg-zinc-800 p-2 rounded-lg text-center">
                  <p className="text-[10px] text-zinc-500 uppercase">P. Factor</p>
                  <p className="text-sm font-bold text-amber-500">{simMetrics.profitFactor.toFixed(2)}</p>
                </div>
              </div>

              <div className="mt-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-xs font-bold text-zinc-400 uppercase">Histórico Recente</h3>
                  <button onClick={clearSimulation} className="text-[10px] text-zinc-500 hover:text-zinc-300">LIMPAR</button>
                </div>
                <div className="max-h-40 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {simulationTrades.length === 0 ? (
                    <p className="text-center text-zinc-600 text-xs py-4 italic">Nenhum trade executado</p>
                  ) : (
                    simulationTrades.map(trade => (
                      <div key={trade.id} className="bg-zinc-800/50 p-2 rounded-lg flex justify-between items-center text-xs border border-zinc-800">
                        <div>
                          <span className={`font-bold ${trade.direction === 'BUY' ? 'text-emerald-500' : 'text-red-500'}`}>{trade.direction}</span>
                          <span className="ml-2 text-zinc-400">{trade.lot} lot @ {trade.entry}</span>
                        </div>
                        <div className={`font-mono font-bold ${trade.result >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                          {trade.result >= 0 ? '+' : ''}${trade.result.toFixed(2)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-white">Gestão de Risco Profissional</h2>
              {riskStatus.isBlocked && (
                <div className="flex items-center gap-2 bg-red-950 text-red-400 px-3 py-1 rounded-lg text-xs font-bold border border-red-800 animate-pulse">
                  <AlertTriangle size={14} />
                  OPERAÇÕES BLOQUEADAS
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-zinc-800 p-4 rounded-xl">
                <p className="text-zinc-400 text-sm mb-1">Perfil de Risco</p>
                <p className={`text-xl font-bold ${riskProfile.color}`}>{riskProfile.label}</p>
                <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-wider">Baseado no risco por trade</p>
              </div>
              <div className="bg-zinc-800 p-4 rounded-xl">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-zinc-400 text-sm">Limite Diário</p>
                  <span className={`text-xs font-bold ${riskStatus.dailyStatus === 'BLOCKED' ? 'text-red-500' : 'text-emerald-500'}`}>{riskStatus.dailyStatus}</span>
                </div>
                <div className="flex items-end gap-2">
                  <p className="text-xl font-bold text-white">{risk.maxDailyLoss}%</p>
                  <p className="text-xs text-zinc-500 mb-1">(${formatNumberSafe(riskStatus.dailyLimit)})</p>
                </div>
                <div className="w-full bg-zinc-700 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${riskStatus.dailyStatus === 'BLOCKED' ? 'bg-red-500' : 'bg-amber-500'}`} 
                    style={{ width: `${Math.min(100, (Math.abs(Math.min(0, simulationTrades.filter(t => t.timestamp.toDateString() === new Date().toDateString()).reduce((acc, t) => acc + t.result, 0))) / riskStatus.dailyLimit) * 100)}%` }}
                  ></div>
                </div>
              </div>
              <div className="bg-zinc-800 p-4 rounded-xl">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-zinc-400 text-sm">Limite Semanal</p>
                  <span className={`text-xs font-bold ${riskStatus.weeklyStatus === 'BLOCKED' ? 'text-red-500' : 'text-emerald-500'}`}>{riskStatus.weeklyStatus}</span>
                </div>
                <div className="flex items-end gap-2">
                  <p className="text-xl font-bold text-white">{risk.maxWeeklyLoss}%</p>
                  <p className="text-xs text-zinc-500 mb-1">(${formatNumberSafe(riskStatus.weeklyLimit)})</p>
                </div>
                <div className="w-full bg-zinc-700 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${riskStatus.weeklyStatus === 'BLOCKED' ? 'bg-red-500' : 'bg-emerald-500'}`} 
                    style={{ width: `${Math.min(100, (Math.abs(Math.min(0, simulationTrades.reduce((acc, t) => acc + t.result, 0))) / riskStatus.weeklyLimit) * 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
            
            {riskStatus.isBlocked && (
              <div className="mt-4 p-4 bg-red-950/30 border border-red-800 rounded-xl">
                <p className="text-red-400 text-sm font-bold flex items-center gap-2">
                  <AlertTriangle size={18} />
                  ALERTA CRÍTICO: Limite de perda institucional atingido. 
                </p>
                <p className="text-red-500/70 text-xs mt-1">
                  Sua conta atingiu o limite máximo de drawdown permitido para o período. Novas operações simuladas estão bloqueadas para preservar o capital psicológico e financeiro.
                </p>
              </div>
            )}
          </section>

          <section className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
            <h2 className="text-xl font-semibold mb-4 text-white">Melhores Horários</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={BEST_HOURS}>
                  <XAxis dataKey="time" stroke="#71717a" />
                  <YAxis stroke="#71717a" />
                  <Tooltip contentStyle={{ backgroundColor: '#18181b', border: 'none' }} />
                  <Bar dataKey="value">
                    {BEST_HOURS.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.value > 80 ? '#f59e0b' : '#52525b'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>

        <aside className="space-y-8">
          <FeedStatusPanel snapshot={snapshot} loading={loading} />
          <MarketHealthPanel snapshot={snapshot} />
          <RecommendationPanel 
            decision={finalRecommendation} 
            user={user} 
            onUpgrade={() => setView('upgrade')} 
          />
          <TimeframePanel multiTimeframeData={multiTimeframeData} />
          <MarketOverviewPanel snapshot={snapshot} />
          <SmartAlertsPanel 
            snapshot={snapshot} 
            alerts={alerts} 
            user={user} 
            onUpgrade={() => setView('upgrade')} 
          />
          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
            <h2 className="text-xl font-semibold mb-4 text-white">Checklist Operacional</h2>
            {checklist.map(item => (
              <div key={item.id} className="flex items-center gap-3 py-2 cursor-pointer" onClick={() => toggleChecklist(item.id)}>
                {item.done ? <CheckCircle2 className="text-emerald-500" /> : <Circle className="text-zinc-600" />}
                <span className={item.done ? 'text-zinc-100' : 'text-zinc-400'}>{item.label}</span>
              </div>
            ))}
          </div>

          <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
            <h2 className="text-xl font-semibold mb-4 text-white">Notícias e Eventos</h2>
            <div className="space-y-3">
              {economicEvents.map(event => (
                <div key={event.id} className={`p-3 rounded-lg flex justify-between items-center ${event.impact === 'HIGH' ? 'bg-red-950 border border-red-800' : 'bg-zinc-800'}`}>
                  <span>{event.name}</span>
                  <span className="font-mono">{event.time}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-red-950 border border-red-800 rounded-lg text-red-400 flex items-center gap-2">
              <AlertTriangle size={20} />
              ALERTA DE VOLATILIDADE: Movimento forte esperado
            </div>
          </div>
        </aside>
      </main>
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        user={user}
        onUserChange={setUser}
        onUpgradeClick={() => setView('upgrade')}
      />
    </div>
  );
}
