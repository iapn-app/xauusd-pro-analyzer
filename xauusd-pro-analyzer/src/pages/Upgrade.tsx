import React from 'react';
import { motion } from 'motion/react';
import { 
  CheckCircle2, 
  Zap, 
  Crown, 
  ShieldCheck, 
  TrendingUp, 
  AlertCircle, 
  ArrowRight,
  BarChart3,
  Target,
  Clock,
  ChevronLeft
} from 'lucide-react';
import { createCheckout, StripePlan } from '../services/stripeService';
import { UserPlan } from '../services/authService';

interface Props {
  onBack: () => void;
}

export const UpgradePage: React.FC<Props> = ({ onBack }) => {
  const handleUpgrade = async (plan: StripePlan) => {
    await createCheckout(plan);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-emerald-500/30">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button 
            onClick={onBack}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors group"
          >
            <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Voltar ao Painel</span>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <TrendingUp size={18} className="text-black" />
            </div>
            <span className="font-bold tracking-tight">XAUUSD PRO</span>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-emerald-500/10 blur-[120px] rounded-full -z-10" />
        
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-6">
              Acesso Institucional
            </span>
            <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight mb-6 leading-[1.1]">
              Pare de operar no escuro <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-600">
                no XAUUSD
              </span>
            </h1>
            <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              Sistema institucional que só mostra trades com vantagem matemática (EV positivo). 
              Opere como os grandes bancos, com dados reais e precisão cirúrgica.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button 
                onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                className="w-full sm:w-auto px-8 py-4 bg-emerald-500 text-black font-bold rounded-2xl hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 group"
              >
                COMEÇAR AGORA
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <div className="flex flex-col items-start gap-1">
                <div className="flex items-center gap-2 text-zinc-400 text-sm">
                  <ShieldCheck size={16} className="text-emerald-500" />
                  7 dias de Trial Grátis
                </div>
                <div className="flex items-center gap-2 text-zinc-500 text-[10px] uppercase tracking-widest font-bold">
                  <Clock size={12} />
                  Liberação Imediata
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-24 bg-zinc-900/30 border-y border-zinc-800/50 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-8 leading-tight">
                Por que 95% dos traders <br />
                <span className="text-red-500">perdem dinheiro?</span>
              </h2>
              <div className="space-y-6">
                {[
                  { title: "Falta de Estratégia", desc: "Operar baseado em 'feeling' ou indicadores atrasados que não mostram a intenção do mercado." },
                  { title: "Controle Emocional", desc: "Entrar por medo de ficar de fora (FOMO) ou tentar recuperar perdas sem confirmação técnica." },
                  { title: "Entradas Erradas", desc: "Ignorar a liquidez institucional e entrar justamente onde os grandes players estão stopando o varejo." }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="mt-1">
                      <AlertCircle className="text-red-500" size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-white mb-1">{item.title}</h4>
                      <p className="text-zinc-500 text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl relative">
              <div className="absolute -top-4 -right-4 bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-xl text-red-500 text-xs font-bold">
                O Erro Comum
              </div>
              <div className="space-y-4 opacity-50 grayscale">
                <div className="h-4 w-3/4 bg-zinc-800 rounded-full" />
                <div className="h-4 w-1/2 bg-zinc-800 rounded-full" />
                <div className="h-32 w-full bg-zinc-800 rounded-2xl" />
                <div className="h-4 w-full bg-zinc-800 rounded-full" />
              </div>
              <div className="mt-8 pt-8 border-t border-zinc-800 flex items-center justify-between">
                <span className="text-zinc-500 text-sm">Resultado Médio</span>
                <span className="text-red-500 font-mono font-bold">-12.4% / mês</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">A Solução Profissional</h2>
            <p className="text-zinc-400">Ferramentas de elite para quem busca consistência real.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: BarChart3, title: "Scanner Automático", desc: "Varredura 24/5 em busca de padrões de alta probabilidade.", color: "text-blue-500" },
              { icon: Zap, title: "EV Positivo", desc: "Cálculo matemático de Valor Esperado para cada entrada sugerida.", color: "text-amber-500" },
              { icon: Target, title: "Probabilidade Real", desc: "Baseado em dados históricos e fluxo de ordens institucional.", color: "text-emerald-500" },
              { icon: ShieldCheck, title: "Alertas Inteligentes", desc: "Notificações diretas quando o setup perfeito se forma.", color: "text-purple-500" }
            ].map((item, i) => (
              <div key={i} className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl hover:border-emerald-500/30 transition-colors group">
                <div className={`w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <item.icon className={item.color} size={24} />
                </div>
                <h4 className="text-lg font-bold text-white mb-2">{item.title}</h4>
                <p className="text-zinc-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Proof Section */}
      <section className="py-24 bg-emerald-500/5 border-y border-emerald-500/10 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 text-center">
              <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest mb-2">Winrate Médio</p>
              <h3 className="text-5xl font-bold text-emerald-500 font-mono">72.4%</h3>
              <p className="text-zinc-400 text-xs mt-4">Baseado em 1.200 trades simulados (M5/M15)</p>
            </div>
            <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 text-center">
              <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest mb-2">ROI Mensal</p>
              <h3 className="text-5xl font-bold text-emerald-500 font-mono">+18.2%</h3>
              <p className="text-zinc-400 text-xs mt-4">Média conservadora com risco de 1% por trade</p>
            </div>
            <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 text-center">
              <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest mb-2">Profit Factor</p>
              <h3 className="text-5xl font-bold text-emerald-500 font-mono">2.84</h3>
              <p className="text-zinc-400 text-xs mt-4">Relação entre lucro bruto e prejuízo bruto</p>
            </div>
          </div>
          
          <div className="mt-12 bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden">
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
              <h4 className="font-bold text-white">Histórico Recente (Simulado)</h4>
              <span className="text-xs text-zinc-500">Últimos 5 Sinais</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-800/50 text-zinc-500 uppercase text-[10px] font-bold">
                  <tr>
                    <th className="px-6 py-3">Data</th>
                    <th className="px-6 py-3">Tipo</th>
                    <th className="px-6 py-3">Entrada</th>
                    <th className="px-6 py-3">Resultado</th>
                    <th className="px-6 py-3">Pips</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {[
                    { date: "19/03 14:20", type: "BUY", entry: "2652.40", res: "WIN", pips: "+42" },
                    { date: "19/03 10:15", type: "SELL", entry: "2660.10", res: "WIN", pips: "+38" },
                    { date: "18/03 16:45", type: "BUY", entry: "2648.20", res: "LOSS", pips: "-15" },
                    { date: "18/03 09:30", type: "BUY", entry: "2642.00", res: "WIN", pips: "+55" },
                    { date: "17/03 15:10", type: "SELL", entry: "2655.80", res: "WIN", pips: "+29" }
                  ].map((trade, i) => (
                    <tr key={i} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="px-6 py-4 text-zinc-400">{trade.date}</td>
                      <td className="px-6 py-4 font-bold">{trade.type}</td>
                      <td className="px-6 py-4 font-mono">{trade.entry}</td>
                      <td className={`px-6 py-4 font-bold ${trade.res === 'WIN' ? 'text-emerald-500' : 'text-red-500'}`}>{trade.res}</td>
                      <td className={`px-6 py-4 font-mono ${trade.pips.startsWith('+') ? 'text-emerald-500' : 'text-red-500'}`}>{trade.pips}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Escolha seu Plano</h2>
            <p className="text-zinc-400">Invista na sua consistência operacional.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* FREE */}
            <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl flex flex-col">
              <div className="mb-8">
                <h4 className="text-xl font-bold text-white mb-2">FREE</h4>
                <p className="text-zinc-500 text-sm">Para iniciantes</p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white">$0</span>
                  <span className="text-zinc-500 text-sm">/mês</span>
                </div>
              </div>
              <ul className="space-y-4 mb-10 flex-1">
                <li className="flex items-center gap-3 text-sm text-zinc-400">
                  <CheckCircle2 size={18} className="text-emerald-500" />
                  Gráfico em tempo real
                </li>
                <li className="flex items-center gap-3 text-sm text-zinc-400">
                  <CheckCircle2 size={18} className="text-emerald-500" />
                  Calculadora básica
                </li>
                <li className="flex items-center gap-3 text-sm text-zinc-600 line-through">
                  Scanner de Sinais
                </li>
                <li className="flex items-center gap-3 text-sm text-zinc-600 line-through">
                  Cálculo de EV
                </li>
              </ul>
              <button 
                onClick={onBack}
                className="w-full py-4 rounded-2xl border border-zinc-800 text-zinc-400 font-bold hover:bg-zinc-800 transition-colors"
              >
                PLANO ATUAL
              </button>
            </div>

            {/* PRO */}
            <div className="bg-zinc-900 border-2 border-amber-500/50 p-8 rounded-3xl flex flex-col relative scale-105 shadow-2xl shadow-amber-500/10">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-500 text-black text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-widest">
                Mais Popular
              </div>
              <div className="mb-8">
                <h4 className="text-xl font-bold text-white mb-2">PRO</h4>
                <p className="text-zinc-500 text-sm">Para traders consistentes</p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white">R$ 49</span>
                  <span className="text-zinc-500 text-sm">/mês</span>
                </div>
              </div>
              <ul className="space-y-4 mb-10 flex-1">
                <li className="flex items-center gap-3 text-sm text-zinc-300">
                  <CheckCircle2 size={18} className="text-amber-500" />
                  Scanner Automático
                </li>
                <li className="flex items-center gap-3 text-sm text-zinc-300">
                  <CheckCircle2 size={18} className="text-amber-500" />
                  Cálculo de EV+
                </li>
                <li className="flex items-center gap-3 text-sm text-zinc-300">
                  <CheckCircle2 size={18} className="text-amber-500" />
                  Análise Quantitativa
                </li>
                <li className="flex items-center gap-3 text-sm text-zinc-600 line-through">
                  Alertas em Tempo Real
                </li>
              </ul>
              <button 
                onClick={() => handleUpgrade('pro')}
                className="w-full py-4 rounded-2xl bg-amber-500 text-black font-bold hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/20"
              >
                UPGRADE PRO
              </button>
            </div>

            {/* PREMIUM */}
            <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl flex flex-col">
              <div className="mb-8">
                <h4 className="text-xl font-bold text-white mb-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">PREMIUM</h4>
                <p className="text-zinc-500 text-sm">Acesso total e exclusivo</p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white">R$ 97</span>
                  <span className="text-zinc-500 text-sm">/mês</span>
                </div>
              </div>
              <ul className="space-y-4 mb-10 flex-1">
                <li className="flex items-center gap-3 text-sm text-zinc-300">
                  <CheckCircle2 size={18} className="text-purple-500" />
                  Tudo do Plano PRO
                </li>
                <li className="flex items-center gap-3 text-sm text-zinc-300">
                  <CheckCircle2 size={18} className="text-purple-500" />
                  Alertas em Tempo Real
                </li>
                <li className="flex items-center gap-3 text-sm text-zinc-300">
                  <CheckCircle2 size={18} className="text-purple-500" />
                  Simulador Avançado
                </li>
                <li className="flex items-center gap-3 text-sm text-zinc-300">
                  <CheckCircle2 size={18} className="text-purple-500" />
                  Suporte Prioritário
                </li>
              </ul>
              <button 
                onClick={() => handleUpgrade('premium')}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold hover:from-purple-500 hover:to-pink-500 transition-all shadow-lg shadow-purple-500/20"
              >
                UPGRADE PREMIUM
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Urgency Section */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto bg-emerald-500 rounded-[2rem] p-12 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2" />
          <h2 className="text-3xl font-black text-black mb-4 uppercase tracking-tight">Comece seu Trial agora</h2>
          <p className="text-emerald-950 font-medium mb-8">
            7 dias grátis com acesso total — depois acesso limitado ao plano FREE. <br />
            Não perca a chance de transformar seus resultados.
          </p>
          <button 
            onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
            className="px-10 py-4 bg-black text-white font-bold rounded-2xl hover:bg-zinc-900 transition-all shadow-xl"
          >
            ATIVAR 7 DIAS GRÁTIS
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-zinc-900 px-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-6 opacity-50">
          <TrendingUp size={18} className="text-emerald-500" />
          <span className="font-bold tracking-tight text-white">XAUUSD PRO ANALYZER</span>
        </div>
        <p className="text-zinc-600 text-xs max-w-xl mx-auto leading-relaxed">
          O mercado financeiro envolve riscos. Resultados passados não garantem ganhos futuros. 
          Use as ferramentas como auxílio analítico, nunca como recomendação direta de investimento.
        </p>
        <div className="mt-8 text-zinc-700 text-[10px] uppercase tracking-widest font-bold">
          © 2026 XAUUSD PRO — Todos os direitos reservados
        </div>
      </footer>
    </div>
  );
};
