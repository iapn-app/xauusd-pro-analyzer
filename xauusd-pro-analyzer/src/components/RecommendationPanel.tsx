import React from 'react';
import { DecisionResult } from '../services/decisionEngine';
import { authService, User } from '../services/authService';
import { createCheckout } from '../services/stripeService';

interface Props {
  decision: (DecisionResult & { quant?: any }) | null;
  user: User | null;
  onUpgrade: () => void;
}

export const RecommendationPanel = ({ decision, user, onUpgrade }: Props) => {
  const hasEVAccess = authService.checkAccess('ev', user);
  const hasScannerAccess = authService.checkAccess('scanner', user);

  if (!decision) {
    return (
      <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
        <h2 className="text-xl font-semibold mb-4 text-white">Recomendação Operacional</h2>
        <div className="text-center py-4">
          <div className="text-4xl font-bold mb-2 text-zinc-500">WAIT</div>
          <p className="text-zinc-400">Aguardando análise institucional...</p>
        </div>
      </div>
    );
  }

  const { quant } = decision;
  const isNeutral = decision.signal === 'NEUTRAL';

  return (
    <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 relative overflow-hidden">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-white">Recomendação Operacional</h2>
        <span className="text-xs font-mono text-zinc-500">INSTITUTIONAL GRADE</span>
      </div>
      
      <div className="text-center py-4">
        <div className={`text-5xl font-black mb-2 tracking-tighter ${
          decision.signal === 'BUY' ? 'text-emerald-500' : 
          decision.signal === 'SELL' ? 'text-red-500' : 
          'text-amber-500'
        }`}>
          {isNeutral ? 'WAIT' : decision.signal}
        </div>

        {isNeutral && (
          <div className="mb-4">
            <p className="text-xs font-bold text-amber-500/80 uppercase tracking-widest">
              {decision.reasons.find(r => r.includes('TRADE DESCARTADO'))?.split(':')[1]?.trim() || 'Aguardando Melhor Setup'}
            </p>
          </div>
        )}

        {quant && (
          <div className="grid grid-cols-3 gap-2 mb-4 mt-2 relative">
            <div className="bg-zinc-800/50 p-2 rounded-lg border border-zinc-700/50">
              <p className="text-[10px] text-zinc-500 uppercase font-bold">Probabilidade</p>
              <p className={`text-lg font-black ${quant.probability >= 60 ? 'text-emerald-400' : 'text-zinc-300'}`}>
                {quant.probability}%
              </p>
            </div>
            <div className="bg-zinc-800/50 p-2 rounded-lg border border-zinc-700/50 relative">
              <p className="text-[10px] text-zinc-500 uppercase font-bold">EV (%)</p>
              {hasEVAccess ? (
                <p className={`text-lg font-black ${quant.evPercent > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {quant.evPercent > 0 ? '+' : ''}{Math.round(quant.evPercent)}%
                </p>
              ) : (
                <button 
                  onClick={() => createCheckout('pro')}
                  className="flex flex-col items-center group w-full"
                >
                  <p className="text-lg font-black text-zinc-600 blur-[3px] group-hover:blur-none transition-all">+0%</p>
                  <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-amber-500 bg-zinc-900/80 rounded-lg group-hover:bg-zinc-900/60 transition-colors">PRO</span>
                </button>
              )}
            </div>
            <div className="bg-zinc-800/50 p-2 rounded-lg border border-zinc-700/50">
              <p className="text-[10px] text-zinc-500 uppercase font-bold">Score</p>
              <p className="text-lg font-black text-zinc-300">
                {decision.score}
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-32 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 ${
                decision.confidence > 70 ? 'bg-emerald-500' : 
                decision.confidence > 40 ? 'bg-amber-500' : 
                'bg-red-500'
              }`}
              style={{ width: `${decision.confidence}%` }}
            ></div>
          </div>
          <span className="text-xs font-bold text-zinc-400">{decision.confidence}% Confiança</span>
        </div>

        {(quant?.setup || (quant?.entry && quant?.stop)) && decision.signal !== 'NEUTRAL' && (
          <div className="bg-zinc-950/50 p-3 rounded-xl border border-zinc-800 mb-4 text-left relative">
            <p className="text-[10px] text-zinc-500 uppercase font-bold mb-2">Setup Institucional Automático</p>
            {hasScannerAccess ? (
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <p className="text-[9px] text-zinc-600 uppercase">Entrada</p>
                  <p className="text-xs font-mono text-zinc-300">{(quant.setup?.entry || quant.entry).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-[9px] text-red-900 uppercase">Stop Loss</p>
                  <p className="text-xs font-mono text-red-500/80">{(quant.setup?.stop || quant.stop).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-[9px] text-emerald-900 uppercase">Take Profit</p>
                  <p className="text-xs font-mono text-emerald-500/80">{(quant.setup?.take || quant.take).toFixed(2)}</p>
                </div>
              </div>
            ) : (
              <button 
                onClick={() => createCheckout('pro')}
                className="py-2 text-center w-full group"
              >
                <p className="text-[10px] text-amber-500 font-bold group-hover:text-amber-400 transition-colors">DISPONÍVEL NO PLANO PRO</p>
                <div className="grid grid-cols-3 gap-2 blur-[4px] opacity-20 group-hover:opacity-40 transition-all mt-1">
                  <div className="h-8 bg-zinc-800 rounded"></div>
                  <div className="h-8 bg-zinc-800 rounded"></div>
                  <div className="h-8 bg-zinc-800 rounded"></div>
                </div>
              </button>
            )}
          </div>
        )}
        
        <div className="space-y-2 text-left mt-4 border-t border-zinc-800 pt-4">
          {decision.reasons.map((reason, i) => (
            <p key={i} className="text-xs text-zinc-400 flex items-start gap-2">
              <span className="text-emerald-500 mt-0.5">•</span>
              {reason}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
};
