import React from 'react';
import { XCircle, ArrowLeft } from 'lucide-react';

interface CheckoutCancelProps {
  onGoToPlans: () => void;
}

export function CheckoutCancel({ onGoToPlans }: CheckoutCancelProps) {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl max-w-md w-full text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-zinc-600 to-zinc-500"></div>
        
        <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle size={40} className="text-zinc-500" />
        </div>
        
        <h2 className="text-3xl font-bold text-white mb-2">Pagamento Cancelado</h2>
        <p className="text-zinc-400 mb-8">
          Sua assinatura não foi concluída. Nenhuma cobrança foi realizada no seu cartão.
        </p>

        <button 
          onClick={onGoToPlans}
          className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
        >
          <ArrowLeft size={20} />
          Voltar para Planos
        </button>
      </div>
    </div>
  );
}
