import React from 'react';
import { AlertTriangle, Info, Zap, ShieldAlert, TrendingUp, Lock } from 'lucide-react';
import { MarketSnapshot } from '../types/market';
import { MarketAlert } from '../services/alertEngine';
import { authService, User } from '../services/authService';
import { createCheckout } from '../services/stripeService';

interface Props {
  snapshot: MarketSnapshot | null;
  alerts: MarketAlert[];
  user: User | null;
  onUpgrade: () => void;
}

export const SmartAlertsPanel = ({ snapshot, alerts: realAlerts, user, onUpgrade }: Props) => {
  const hasAlertsAccess = authService.checkAccess('alerts', user);

  if (!snapshot) return null;

  const getAlertIcon = (type: string, severity: string) => {
    switch (type) {
      case 'OPPORTUNITY': return <Zap size={18} className="text-emerald-400" />;
      case 'CONFIDENCE': return <TrendingUp size={18} className="text-blue-400" />;
      case 'RISK': return <ShieldAlert size={18} className="text-red-400" />;
      case 'BREAKOUT': return <Zap size={18} className="text-amber-400" />;
      case 'REVERSAL': return <TrendingUp size={18} className="text-purple-400" />;
      default: return <Info size={18} className="text-zinc-400" />;
    }
  };

  const getAlertStyle = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-950/30 border-red-800 text-red-400 animate-pulse';
      case 'HIGH': return 'bg-amber-950/20 border-amber-800/50 text-amber-400';
      case 'MEDIUM': return 'bg-blue-950/20 border-blue-800/50 text-blue-400';
      default: return 'bg-zinc-800 border-zinc-700 text-zinc-300';
    }
  };

  // If no real alerts, show some basic ones or a default message
  const displayAlerts = realAlerts.length > 0 ? realAlerts : [
    {
      id: 'default',
      type: 'INFO',
      message: 'Mercado em Condições Normais',
      severity: 'LOW',
      timestamp: new Date()
    }
  ];

  return (
    <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 relative">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-white">Alertas Inteligentes</h2>
        {!hasAlertsAccess && (
          <span className="text-[10px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded font-bold">PREMIUM</span>
        )}
      </div>

      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar relative">
        {hasAlertsAccess ? (
          displayAlerts.map((alert) => (
            <div 
              key={alert.id} 
              className={`p-3 rounded-lg flex items-start gap-3 border transition-all ${getAlertStyle(alert.severity)}`}
            >
              <div className="mt-0.5">
                {getAlertIcon(alert.type, alert.severity)}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium leading-tight">{alert.message}</p>
                <p className="text-[9px] opacity-50 mt-1 uppercase font-mono">
                  {alert.timestamp.toLocaleTimeString()} • {alert.severity}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-700 flex flex-col items-center justify-center py-8 text-center">
              <Lock size={24} className="text-zinc-600 mb-2" />
              <p className="text-sm font-bold text-zinc-400">Alertas em Tempo Real Bloqueados</p>
              <p className="text-[10px] text-zinc-500 mt-1">Disponível apenas para assinantes PREMIUM</p>
              <button 
                onClick={() => createCheckout('premium')}
                className="mt-4 text-[10px] bg-amber-500 text-black px-4 py-1.5 rounded-full font-bold hover:bg-amber-400 transition-colors"
              >
                UPGRADE PARA PREMIUM
              </button>
            </div>
            <div className="p-3 rounded-lg bg-zinc-800/20 border border-zinc-800/50 opacity-20 blur-[2px] pointer-events-none">
              <div className="h-4 w-3/4 bg-zinc-700 rounded mb-2"></div>
              <div className="h-2 w-1/4 bg-zinc-700 rounded"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
