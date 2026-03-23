import React, { useState } from 'react';
import { X, Mail, Lock, ShieldCheck, Zap, Crown, LogOut } from 'lucide-react';
import { authService, User, UserPlan } from '../services/authService';
import { createCheckout, StripePlan } from '../services/stripeService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onUserChange: (user: User | null) => void;
  user: User | null;
  onUpgradeClick?: () => void;
}

export const AuthModal = ({ isOpen, onClose, onUserChange, user, onUpgradeClick }: Props) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const userData = isLogin 
        ? await authService.login(email, password)
        : await authService.register(email, password);
      onUserChange(userData);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    onUserChange(null);
    onClose();
  };

  const handleUpgrade = async (plan: StripePlan) => {
    setLoading(true);
    try {
      await createCheckout(plan);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    setError(null);
    setCouponSuccess(null);
    try {
      const updatedUser = await authService.applyCoupon(couponCode);
      onUserChange(updatedUser);
      setCouponSuccess(`Cupom ${couponCode} aplicado com sucesso!`);
      setCouponCode('');
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (user) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-3xl p-8 relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-white">
            <X size={20} />
          </button>

          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="text-emerald-500" size={32} />
            </div>
            <h2 className="text-2xl font-bold text-white">Minha Conta</h2>
            <p className="text-zinc-400 text-sm">{user.email}</p>
            <div className="mt-2 flex flex-col items-center gap-2">
              <div className="flex gap-2">
                {user.isAdmin && (
                  <span className="px-3 py-1 rounded-full text-[10px] font-black bg-red-500 text-white uppercase tracking-widest">
                    ADMIN
                  </span>
                )}
                {user.isVip && (
                  <span className="px-3 py-1 rounded-full text-[10px] font-black bg-emerald-400 text-black uppercase tracking-widest">
                    VIP PREMIUM
                  </span>
                )}
                {!user.isAdmin && !user.isVip && (
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                    user.plan === 'premium' ? 'bg-purple-500 text-white' :
                    user.plan === 'pro' ? 'bg-amber-500 text-black' :
                    user.plan === 'trial' ? 'bg-emerald-500 text-black' :
                    'bg-zinc-800 text-zinc-400'
                  }`}>
                    PLANO {user.plan}
                  </span>
                )}
              </div>
              {user.plan === 'trial' && user.trialEnd && !user.isLifetime && (
                <p className="text-[10px] text-emerald-500 font-bold">
                  Trial expira em: {new Date(user.trialEnd).toLocaleDateString()}
                </p>
              )}
              {user.isLifetime && (
                <p className="text-[10px] text-purple-500 font-bold uppercase tracking-tighter">
                  Acesso Vitalício Ativo
                </p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-zinc-800/50 p-4 rounded-2xl border border-zinc-800">
              <h3 className="text-xs font-bold text-zinc-500 uppercase mb-3">Possui um Cupom?</h3>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="CÓDIGO"
                  className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  value={couponCode}
                  onChange={e => setCouponCode(e.target.value.toUpperCase())}
                />
                <button 
                  onClick={handleApplyCoupon}
                  className="bg-emerald-500 text-black text-xs font-bold px-4 py-2 rounded-xl hover:bg-emerald-400 transition-colors"
                >
                  APLICAR
                </button>
              </div>
              {couponSuccess && <p className="text-emerald-500 text-[10px] mt-2 font-bold">{couponSuccess}</p>}
              {error && <p className="text-red-500 text-[10px] mt-2 font-bold">{error}</p>}
            </div>

            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Upgrade de Plano</h3>
              {onUpgradeClick && (
                <button 
                  onClick={() => {
                    onClose();
                    onUpgradeClick();
                  }}
                  className="text-[10px] font-bold text-emerald-500 hover:text-emerald-400 underline uppercase tracking-widest"
                >
                  Ver Detalhes dos Planos
                </button>
              )}
            </div>
            
            <button 
              onClick={() => handleUpgrade('pro')}
              disabled={user.plan === 'pro' || user.plan === 'premium'}
              className={`w-full p-4 rounded-2xl border flex items-center justify-between transition-all ${
                user.plan === 'pro' ? 'border-amber-500 bg-amber-500/10' : 'border-zinc-800 bg-zinc-800/50 hover:border-amber-500/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Zap className="text-amber-500" size={20} />
                <div className="text-left">
                  <p className="font-bold text-white">Plano PRO</p>
                  <p className="text-[10px] text-zinc-500">Scanner + EV Liberado</p>
                </div>
              </div>
              <span className="text-sm font-bold text-amber-500">$49/mês</span>
            </button>

            <button 
              onClick={() => handleUpgrade('premium')}
              disabled={user.plan === 'premium'}
              className={`w-full p-4 rounded-2xl border flex items-center justify-between transition-all ${
                user.plan === 'premium' ? 'border-purple-500 bg-purple-500/10' : 'border-zinc-800 bg-zinc-800/50 hover:border-purple-500/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Crown className="text-purple-500" size={20} />
                <div className="text-left">
                  <p className="font-bold text-white">Plano PREMIUM</p>
                  <p className="text-[10px] text-zinc-500">Alertas em Tempo Real + Full Access</p>
                </div>
              </div>
              <span className="text-sm font-bold text-purple-500">$99/mês</span>
            </button>
          </div>

          <button 
            onClick={handleLogout}
            className="w-full mt-8 flex items-center justify-center gap-2 text-zinc-500 hover:text-red-500 transition-colors text-sm font-bold"
          >
            <LogOut size={16} />
            SAIR DA CONTA
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-3xl p-8 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-white">
          <X size={20} />
        </button>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white">{isLogin ? 'Bem-vindo de volta' : 'Crie sua conta'}</h2>
          <p className="text-zinc-400 text-sm">Acesse o poder institucional do XAUUSD</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs text-zinc-500 ml-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
              <input 
                type="email" 
                required
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="seu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-zinc-500 ml-1">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
              <input 
                type="password" 
                required
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && <p className="text-red-500 text-xs text-center font-bold">{error}</p>}

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 text-black font-bold py-4 rounded-xl hover:bg-emerald-400 transition-colors disabled:opacity-50"
          >
            {loading ? 'PROCESSANDO...' : isLogin ? 'ENTRAR' : 'CRIAR CONTA'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-xs text-zinc-500 hover:text-white transition-colors"
          >
            {isLogin ? 'Não tem conta? Registre-se agora' : 'Já tem conta? Faça login'}
          </button>
        </div>
      </div>
    </div>
  );
};
