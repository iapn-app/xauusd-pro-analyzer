import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, LogIn, UserPlus, TrendingUp, ShieldCheck, ArrowRight, Zap, Target, BarChart3 } from 'lucide-react';
import { authService, User, ADMIN_BOOTSTRAP } from '../services/authService';

interface AuthPageProps {
  onAuthSuccess: (user: User) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isReset, setIsReset] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (isReset) {
        await authService.resetPassword(email);
        setSuccess('E-mail de recuperação enviado com sucesso! Verifique sua caixa de entrada.');
        setIsReset(false);
        setIsLogin(true);
        return;
      }

      const user = isLogin 
        ? await authService.login(email, password)
        : await authService.register(email, password);
      
      onAuthSuccess(user);
    } catch (err: any) {
      let msg = err.message || 'Ocorreu um erro inesperado.';
      
      if (msg.includes('User already registered')) {
        msg = "Este e-mail já está cadastrado. Por favor, faça login.";
        setIsLogin(true);
      }
      
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col lg:flex-row font-sans selection:bg-emerald-500/30 overflow-hidden">
      {/* Left Side: Branding & Features (Hidden on Mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-center p-20 bg-zinc-900/30 border-r border-zinc-800/50 overflow-hidden">
        {/* Animated Background Elements */}
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-0 left-0 w-[800px] h-[800px] bg-emerald-500/5 blur-[150px] rounded-full -translate-x-1/2 -translate-y-1/2"
        />

        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="flex items-center gap-3 mb-12"
          >
            <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-emerald-500/20">
              <TrendingUp size={24} className="text-black" />
            </div>
            <span className="text-2xl font-black tracking-tighter">XAUUSD <span className="text-emerald-500">PRO</span></span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-5xl md:text-6xl font-bold text-white tracking-tight mb-8 leading-[1.1]"
          >
            Acesse sua central <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-600">
              institucional
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-xl text-zinc-400 max-w-lg mb-12 leading-relaxed"
          >
            Entre para visualizar sinais, setups e inteligência operacional do XAUUSD com vantagem matemática real.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="grid grid-cols-2 gap-6"
          >
            {[
              { icon: Zap, label: "Scanner Pro", desc: "Setups automáticos" },
              { icon: Target, label: "EV Positivo", desc: "Vantagem real" },
              { icon: BarChart3, label: "Quant Analysis", desc: "Dados precisos" },
              { icon: ShieldCheck, label: "Institutional", desc: "Grade bancária" }
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl hover:border-emerald-500/30 transition-colors group">
                <div className="mt-1">
                  <item.icon size={18} className="text-emerald-500 group-hover:scale-110 transition-transform" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white mb-0.5">{item.label}</p>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">{item.desc}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Bottom Label */}
        <div className="absolute bottom-12 left-20 text-[10px] text-zinc-600 font-mono uppercase tracking-widest">
          © 2026 XAUUSD PRO • Institutional Grade Analytics
        </div>
      </div>

      {/* Right Side: Auth Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
        {/* Background Glow for Mobile */}
        <div className="lg:hidden absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-md h-96 bg-emerald-500/10 blur-[120px] rounded-full -z-10" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Mobile Logo */}
          <div className="lg:hidden flex flex-col items-center mb-12">
            <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mb-4 shadow-2xl shadow-emerald-500/20">
              <TrendingUp size={32} className="text-black" />
            </div>
            <h1 className="text-2xl font-black tracking-tighter text-white">XAUUSD PRO</h1>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[2.5rem] shadow-2xl shadow-black/50">
            <div className="flex p-1 bg-zinc-950 rounded-2xl mb-8 border border-zinc-800/50">
              <button 
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${isLogin ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                Entrar
              </button>
              <button 
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${!isLogin ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                Criar Conta
              </button>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">
                {isReset ? 'Recuperar Senha' : isLogin ? 'Bem-vindo de volta' : 'Comece agora'}
              </h2>
              <p className="text-zinc-500 text-sm">
                {isReset 
                  ? 'Enviaremos um link para você redefinir sua senha' 
                  : isLogin 
                    ? 'Acesse sua conta institucional' 
                    : 'Crie sua conta e receba 7 dias de Trial Premium'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">E-mail Profissional</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-emerald-500 transition-colors" size={18} />
                  <input 
                    type="email" 
                    required
                    placeholder="seu@email.com"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-zinc-700"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {!isReset && (
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Senha de Acesso</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-emerald-500 transition-colors" size={18} />
                    <input 
                      type="password" 
                      required
                      placeholder="••••••••"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-zinc-700"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <AnimatePresence mode="wait">
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-xs font-bold"
                  >
                    {error}
                  </motion.div>
                )}
                {success && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-500 text-xs font-bold"
                  >
                    {success}
                  </motion.div>
                )}
              </AnimatePresence>

              <button 
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-emerald-500 text-black font-black rounded-2xl hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                ) : (
                  <>
                    {isReset ? 'ENVIAR LINK' : isLogin ? 'ACESSAR DASHBOARD' : 'CRIAR CONTA PREMIUM'}
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 text-center flex flex-col gap-4">
              {isReset ? (
                <button 
                  onClick={() => setIsReset(false)}
                  className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors font-medium"
                >
                  Voltar para o login
                </button>
              ) : (
                <>
                  {isLogin && (
                    <button 
                      onClick={() => setIsReset(true)}
                      className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors font-medium"
                    >
                      Esqueceu sua senha?
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="mt-8 flex items-center justify-center gap-6 text-zinc-600">
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-emerald-500/50" />
              <span className="text-[10px] font-bold uppercase tracking-widest">SSL Secure</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap size={14} className="text-emerald-500/50" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Instant Access</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
