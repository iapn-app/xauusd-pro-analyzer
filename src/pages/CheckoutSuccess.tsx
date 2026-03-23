import React, { useEffect, useState } from 'react';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { handleCheckoutSuccess, StripePlan, getPlanLabel } from '../services/stripeService';
import { authService, User } from '../services/authService';

interface CheckoutSuccessProps {
  onGoToDashboard: () => void;
  onUserUpdate: (user: User) => void;
}

export function CheckoutSuccess({ onGoToDashboard, onUserUpdate }: CheckoutSuccessProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [planLabel, setPlanLabel] = useState<string>('');

  useEffect(() => {
    const processSuccess = async () => {
      try {
        // Obter plano da URL (hash)
        // Ex: #checkout-success?plan=pro
        const hash = window.location.hash;
        const urlParams = new URLSearchParams(hash.split('?')[1] || '');
        const plan = urlParams.get('plan') as StripePlan | null;

        const currentUser = await authService.getCurrentUser();
        if (!currentUser) {
          throw new Error("Usuário não autenticado.");
        }

        const updatedUser = await handleCheckoutSuccess(currentUser, plan);
        onUserUpdate(updatedUser);
        
        // Use the plan from the URL or the updated user to show the label
        const displayPlan = updatedUser.subscriptionPlan || plan;
        if (displayPlan) {
          setPlanLabel(getPlanLabel(displayPlan as StripePlan));
        }
      } catch (err: any) {
        setError(err.message || "Erro ao processar assinatura.");
      } finally {
        setLoading(false);
      }
    };

    processSuccess();
  }, [onUserUpdate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
        <div className="bg-zinc-900 border border-red-800 p-8 rounded-2xl max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-red-500 mb-4">Erro no Pagamento</h2>
          <p className="text-zinc-400 mb-8">{error}</p>
          <button 
            onClick={onGoToDashboard}
            className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-bold transition-colors"
          >
            Voltar para Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      <div className="bg-zinc-900 border border-emerald-800/50 p-8 rounded-2xl max-w-md w-full text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-emerald-400"></div>
        
        <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={40} className="text-emerald-500" />
        </div>
        
        <h2 className="text-3xl font-bold text-white mb-2">Assinatura Ativada!</h2>
        <p className="text-zinc-400 mb-6">
          Seu plano <strong className="text-emerald-400">{planLabel}</strong> foi ativado com sucesso.
        </p>
        
        <div className="bg-black/50 p-4 rounded-xl mb-8 text-left">
          <p className="text-sm text-zinc-500 mb-2">O que você ganha agora:</p>
          <ul className="space-y-2 text-sm text-zinc-300">
            <li className="flex items-center gap-2">
              <CheckCircle2 size={14} className="text-emerald-500" />
              Acesso total aos sinais institucionais
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 size={14} className="text-emerald-500" />
              Análise Quantitativa desbloqueada
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 size={14} className="text-emerald-500" />
              Sem limites de uso diário
            </li>
          </ul>
        </div>

        <button 
          onClick={onGoToDashboard}
          className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
        >
          Ir para Dashboard
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
}
