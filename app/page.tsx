'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wallet, 
  Calendar, 
  PlayCircle, 
  TrendingUp, 
  CheckCircle2, 
  Gift, 
  LayoutDashboard,
  CreditCard,
  UserPlus,
  Rocket,
  ChevronRight,
  ArrowUpRight,
  ArrowDownLeft,
  Copy,
  Star,
  Zap,
  Lock
} from 'lucide-react';
import { useEarnings } from '@/hooks/use-earnings';
import { YouTubeTask } from '@/components/youtube-task';
import { PibTasks } from '@/components/pib-tasks';
import { BookOpen } from 'lucide-react';


type Tab = 'painel' | 'carteira' | 'planos' | 'convites';

export default function HomePage() {
  const { stats, addEarning, completeTask, dailyCheckIn, canCheckIn, isLoading, inviteUser, withdraw, upgradePlan } = useEarnings();
  const [activeTab, setActiveTab] = useState<Tab>('painel');
  const [showNotification, setShowNotification] = useState<string | null>(null);

  const triggerNotification = useCallback((msg: string) => {
    setShowNotification(msg);
    setTimeout(() => setShowNotification(null), 3000);
  }, []);

  const handleDailyCheckIn = () => {
    if (dailyCheckIn()) {
      triggerNotification('Recompensa de R$ 2,00 coletada!');
    } else {
      triggerNotification('Check-in já realizado hoje.');
    }
  };

  const handleTaskComplete = (taskIdOrReward: string | number, reward?: number) => {
    if (typeof taskIdOrReward === 'string') {
      const actualReward = reward || 0;
      if (completeTask(taskIdOrReward, actualReward)) {
        triggerNotification(`R$ ${actualReward.toFixed(2)} adicionados ao seu saldo!`);
      }
    } else {
      addEarning(taskIdOrReward);
      triggerNotification(`R$ ${taskIdOrReward.toFixed(2)} adicionados ao seu saldo!`);
    }
  };

  const handleInvite = () => {
    inviteUser();
    triggerNotification('Novo convite simulado: +R$ 2,00!');
  };

  const copyRefLink = () => {
    navigator.clipboard.writeText(`https://ganhemais.app/ref/rodrigo123`);
    triggerNotification('Link de convite copiado!');
  };

  if (isLoading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full"
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900 overflow-hidden">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0">
        <div className="p-8">
          <div className="flex items-center gap-2 mb-10 overflow-hidden">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white font-bold shrink-0">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <span className="text-xl font-black tracking-tighter italic">GanheMais</span>
          </div>
          <nav className="space-y-2">
            {[
              { id: 'painel', icon: LayoutDashboard, label: 'Painel' },
              { id: 'carteira', icon: CreditCard, label: 'Carteira' },
              { id: 'planos', icon: Rocket, label: 'Planos' },
              { id: 'convites', icon: UserPlus, label: 'Convites' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
                  activeTab === tab.id 
                    ? 'bg-emerald-50 text-emerald-700' 
                    : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
        
        <div className="mt-auto p-8">
          <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-2xl">
            <p className="text-[10px] text-slate-400 mb-1 uppercase tracking-widest font-black">Nível {stats.plan}</p>
            <p className="text-xs font-medium opacity-80 mb-3">
              {stats.plan === 'Basic' ? 'Upgrade para ganhar 2x mais' : 'Aproveite seus benefícios VIP'}
            </p>
            <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: stats.plan === 'Basic' ? '30%' : stats.plan === 'Silver' ? '60%' : '100%' }}
                className="bg-emerald-400 h-full"
              />
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-y-auto p-8">
        {/* Header */}
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Painel de Ganhos</h1>
            <p className="text-slate-500 font-medium">Bem-vindo de volta, investidor.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-white border border-slate-200 px-4 py-2.5 rounded-full flex items-center gap-3 shadow-sm">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
              <span className="text-xs font-black uppercase tracking-widest text-slate-600">3.842 Online</span>
            </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'painel' && (
            <motion.div 
              key="painel"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              {/* Balance & Hero */}
              <div className="grid grid-cols-12 gap-6">
                <div className="col-span-8 bg-white border border-slate-200 rounded-[2.5rem] p-10 flex flex-col justify-between shadow-xl shadow-slate-200/40 border-b-4">
                  <div>
                    <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] mb-4">Saldo Disponível</p>
                    <h2 className="text-7xl font-black tracking-tighter text-slate-900 flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-slate-300">R$</span>
                      {stats.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </h2>
                  </div>
                  <div className="flex gap-4 mt-12">
                    <button 
                      onClick={() => setActiveTab('carteira')}
                      className="px-10 py-4 bg-emerald-500 text-white rounded-2xl font-black shadow-2xl shadow-emerald-200 hover:bg-emerald-600 transition-all flex items-center gap-3"
                    >
                      SACAR VIA PIX <ArrowUpRight className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => setActiveTab('carteira')}
                      className="px-10 py-4 bg-slate-50 text-slate-600 border border-slate-200 rounded-2xl font-black hover:bg-slate-100 transition-all"
                    >
                      EXTRATO
                    </button>
                  </div>
                </div>
                
                <div className="col-span-4 bg-emerald-600 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-emerald-100">
                  <div className="relative z-10 h-full flex flex-col">
                    <div className="bg-emerald-500 w-12 h-12 rounded-2xl flex items-center justify-center mb-6 shadow-xl">
                      <Calendar className="w-6 h-6" />
                    </div>
                    <h3 className="text-2xl font-black mb-2 tracking-tight">Check-in</h3>
                    <p className="text-emerald-100 text-sm mb-auto opacity-80 leading-relaxed font-medium">Bônus de R$ 2,00 liberado a cada 24 horas.</p>
                    <motion.button 
                      whileHover={canCheckIn() ? { scale: 1.02 } : {}}
                      whileTap={canCheckIn() ? { scale: 0.98 } : {}}
                      disabled={!canCheckIn()}
                      onClick={handleDailyCheckIn}
                      className={`w-full py-5 rounded-2xl font-black text-lg shadow-2xl transition-all ${
                        canCheckIn() 
                          ? 'bg-white text-emerald-700 cursor-pointer shadow-white/20' 
                          : 'bg-emerald-700/50 text-emerald-300/50 cursor-not-allowed shadow-none'
                      }`}
                    >
                      {canCheckIn() ? 'RESGATAR R$ 2,00' : 'COLETADO'}
                    </motion.button>
                  </div>
                  <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-emerald-500 rounded-full opacity-30 blur-3xl"></div>
                </div>
              </div>

              {/* Tasks Section */}
              <div>
                <div className="flex justify-between items-end mb-6">
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Vídeos do Dia</h3>
                  <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg text-xs font-black">
                    <Zap className="w-3.5 h-3.5 fill-current" /> {stats.plan === 'Basic' ? `${Math.max(0, 3 - stats.completedTasks.length)} tarefas restantes` : 'Ilimitado'}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-8">
                  <YouTubeTask 
                    videoId="dQw4w9WgXcQ" 
                    reward={0.50} 
                    title="Promoção Tech" 
                    isCompleted={stats.completedTasks.includes("dQw4w9WgXcQ")}
                    onComplete={(reward) => handleTaskComplete("dQw4w9WgXcQ", reward)} 
                  />
                  <YouTubeTask 
                    videoId="jNQXAC9IVRw" 
                    reward={0.75} 
                    title="Review Investimento" 
                    isCompleted={stats.completedTasks.includes("jNQXAC9IVRw")}
                    onComplete={(reward) => handleTaskComplete("jNQXAC9IVRw", reward)} 
                  />
                  {stats.plan === 'Basic' ? (
                    <div className="bg-slate-100 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center p-8 text-center gap-3">
                      <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center text-slate-400">
                        <Star className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-400 text-sm mb-1">Vídeo Exclusivo</p>
                        <p className="text-[10px] text-slate-400 font-medium italic">Disponível nos planos Prata/Ouro</p>
                      </div>
                      <button 
                        onClick={() => setActiveTab('planos')}
                        className="text-xs font-black text-indigo-600 bg-indigo-50 px-4 py-2 rounded-xl mt-2"
                      >
                        UPGRADE
                      </button>
                    </div>
                  ) : (
                    <YouTubeTask 
                      videoId="M7lc1UVf-VE" 
                      reward={1.50} 
                      title="Aula Especial VIP" 
                      isCompleted={stats.completedTasks.includes("M7lc1UVf-VE")}
                      onComplete={(reward) => handleTaskComplete("M7lc1UVf-VE", reward)} 
                    />
                  )}
                </div>
              </div>

              {/* PIB & Economics Tasks */}
              <div className="pt-4">
                <div className="flex justify-between items-end mb-6">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Desafios de PIB & Economia Real</h3>
                    <p className="text-sm font-medium text-slate-500 mt-1">Responda a perguntas econômicas e ganhe por responder pesquisas reais.</p>
                  </div>
                  <div className="flex items-center gap-2 text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg text-xs font-black">
                    <BookOpen className="w-3.5 h-3.5" /> 100% Educativo
                  </div>
                </div>
                <PibTasks 
                  completedTasks={stats.completedTasks} 
                  onComplete={handleTaskComplete} 
                />
              </div>
            </motion.div>
          )}

          {activeTab === 'carteira' && (
            <motion.div 
              key="carteira"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="max-w-4xl mx-auto w-full space-y-8"
            >
              <div className="bg-white border border-slate-200 rounded-[2.5rem] p-12 shadow-2xl border-b-8 border-b-emerald-500">
                <div className="flex justify-between items-start mb-16">
                  <div>
                    <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] mb-4">Total na Carteira</p>
                    <h2 className="text-6xl font-black tracking-tighter text-slate-900">
                      R$ {stats.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </h2>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] mb-4">Total Ganho</p>
                    <p className="text-2xl font-black text-emerald-600">R$ {stats.totalEarned.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <button 
                    onClick={() => {
                      if (stats.balance >= 20) {
                        withdraw(stats.balance);
                        triggerNotification('Saque solicitado com sucesso via PIX!');
                      } else {
                        triggerNotification('Saldo mínimo para saque: R$ 20,00');
                      }
                    }}
                    className="flex items-center justify-center gap-4 bg-slate-900 text-white p-6 rounded-[2rem] font-black text-lg shadow-2xl hover:bg-slate-800 transition-all group"
                  >
                    <ArrowUpRight className="w-6 h-6 text-emerald-400 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    SACAR SALDO
                  </button>
                  <button 
                    onClick={() => triggerNotification('Sistema de depósito via PIX em manutenção.')}
                    className="flex items-center justify-center gap-4 bg-emerald-50 text-emerald-700 border-2 border-emerald-100 p-6 rounded-[2rem] font-black text-lg shadow-xl hover:bg-emerald-100 transition-all group"
                  >
                    <ArrowDownLeft className="w-6 h-6 text-emerald-600 group-hover:-translate-x-1 group-hover:translate-y-1 transition-transform" />
                    DEPOSITAR
                  </button>
                </div>

                <div className="mt-12 pt-12 border-t border-slate-100">
                  <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">Últimas Transações</h4>
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-xl ${i % 2 === 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                            {i % 2 === 0 ? <CheckCircle2 className="w-5 h-5" /> : <PlayCircle className="w-5 h-5" />}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 text-sm">{i % 2 === 0 ? 'Check-in Diário' : 'Visualização de Vídeo'}</p>
                            <p className="text-[10px] text-slate-400 font-medium italic">Há {i * 15} minutos</p>
                          </div>
                        </div>
                        <span className="text-emerald-600 font-black text-lg">+R$ {i % 2 === 0 ? '2,00' : '0,50'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'planos' && (
            <motion.div 
              key="planos"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-10"
            >
              <div className="text-center max-w-2xl mx-auto mb-16">
                <h2 className="text-4xl font-black tracking-tight text-slate-900 mb-4">Escolha seu Plano</h2>
                <p className="text-slate-500 font-medium">Desbloqueie tarefas ilimitadas e multiplique seus ganhos diários agora mesmo.</p>
              </div>

              <div className="grid grid-cols-3 gap-8">
                {/* Basic Plan */}
                <div className={`bg-white border-2 rounded-[2.5rem] p-10 flex flex-col relative transition-all ${stats.plan === 'Basic' ? 'border-emerald-500 shadow-2xl' : 'border-slate-100 opacity-80'}`}>
                  {stats.plan === 'Basic' && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-6 py-1 rounded-full text-[10px] font-black tracking-widest uppercase">ATUAL</div>
                  )}
                  <h4 className="text-slate-400 font-black text-[10px] uppercase tracking-widest mb-2">Plano Grátis</h4>
                  <p className="text-3xl font-black mb-8 text-slate-900 italic tracking-tighter">Básico</p>
                  <ul className="space-y-4 mb-12 flex-1 text-sm font-medium text-slate-500">
                    <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-500" /> 3 Tarefas por dia</li>
                    <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-500" /> Check-in R$ 2,00</li>
                    <li className="flex items-center gap-3 opacity-30"><Lock className="w-5 h-5" /> Saque sem prioridade</li>
                  </ul>
                  <button disabled className="w-full py-4 bg-slate-100 text-slate-400 rounded-2xl font-black text-sm">INCLUSO</button>
                </div>

                {/* Silver Plan */}
                <div className={`bg-white border-2 rounded-[2.5rem] p-10 flex flex-col relative transition-all shadow-xl ${stats.plan === 'Silver' ? 'border-emerald-500' : 'border-slate-100 hover:border-indigo-200'}`}>
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-6 py-1 rounded-full text-[10px] font-black tracking-widest uppercase">POPULAR</div>
                  <h4 className="text-slate-400 font-black text-[10px] uppercase tracking-widest mb-2">Acesso Silver</h4>
                  <p className="text-3xl font-black mb-1 text-slate-900 italic tracking-tighter">Premium</p>
                  <div className="flex items-baseline gap-1 mb-8">
                    <span className="text-xl font-bold">R$</span>
                    <span className="text-4xl font-black">29,90</span>
                    <span className="text-slate-400 text-xs font-bold leading-normal">/mês</span>
                  </div>
                  <ul className="space-y-4 mb-12 flex-1 text-sm font-medium text-slate-600">
                    <li className="flex items-center gap-3 font-bold"><CheckCircle2 className="w-5 h-5 text-indigo-500" /> 15 Tarefas por dia</li>
                    <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-indigo-500" /> Check-in de R$ 5,00</li>
                    <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-indigo-500" /> Saque priorizado</li>
                  </ul>
                  <button 
                    onClick={() => {
                      upgradePlan('Silver');
                      triggerNotification('Plano Silver assinado com sucesso!');
                    }}
                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all"
                  >
                    ASSINAR AGORA
                  </button>
                </div>

                {/* Gold Plan */}
                <div className="bg-slate-900 rounded-[2.5rem] p-10 flex flex-col text-white shadow-2xl relative">
                  <h4 className="text-amber-400 font-black text-[10px] uppercase tracking-widest mb-2">Poder Máximo</h4>
                  <p className="text-3xl font-black mb-1 italic tracking-tighter text-amber-500 flex items-center gap-2">Elite <Star className="w-6 h-6 fill-amber-500" /></p>
                  <div className="flex items-baseline gap-1 mb-8">
                    <span className="text-xl font-bold opacity-60">R$</span>
                    <span className="text-4xl font-black">97,00</span>
                    <span className="text-slate-500 text-xs font-bold leading-normal">/anual</span>
                  </div>
                  <ul className="space-y-4 mb-12 flex-1 text-sm font-medium text-slate-300">
                    <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-400" /> Tarefas ILIMITADAS</li>
                    <li className="flex items-center gap-3 font-black text-emerald-400"><CheckCircle2 className="w-5 h-5" /> Bônus fixo de 20%</li>
                    <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-400" /> Suporte 24h VIP</li>
                  </ul>
                  <button 
                    onClick={() => {
                      upgradePlan('Gold');
                      triggerNotification('Bem-vindo à Elite GanheMais!');
                    }}
                    className="w-full py-4 bg-white text-slate-900 rounded-2xl font-black text-sm shadow-xl shadow-white/5 hover:bg-slate-100 transition-all"
                  >
                    TORNE-SE ELITE
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'convites' && (
            <motion.div 
              key="convites"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-4xl mx-auto w-full"
            >
              <div className="bg-emerald-600 rounded-[3rem] p-16 text-white text-center relative overflow-hidden shadow-[0_40px_80px_rgba(16,185,129,0.2)]">
                <div className="relative z-10">
                  <div className="w-24 h-24 bg-white/10 rounded-[2rem] flex items-center justify-center mx-auto mb-8 backdrop-blur-xl border border-white/20">
                    <UserPlus className="w-10 h-10" />
                  </div>
                  <h2 className="text-5xl font-black tracking-tight mb-4">Ganhe R$ 2,00 na Hora!</h2>
                  <p className="text-emerald-100 text-lg mb-12 max-w-md mx-auto font-medium leading-relaxed opacity-90">
                    Cada amigo que entrar pelo seu link você ganha dinheiro instantâneo no seu saldo disponível.
                  </p>
                  
                  <div className="bg-white/10 p-2 rounded-3xl backdrop-blur-md max-w-md mx-auto flex items-center gap-2 border border-white/20">
                    <div className="flex-1 px-6 font-bold text-sm overflow-hidden text-ellipsis whitespace-nowrap opacity-60">
                      ganhemais.app/ref/rodrigo123
                    </div>
                    <button 
                      onClick={copyRefLink}
                      className="bg-white text-emerald-700 px-8 py-4 rounded-2xl font-black text-xs shadow-xl shadow-emerald-900/10 hover:bg-emerald-50 transition-all flex items-center gap-2"
                    >
                      <Copy className="w-4 h-4" /> COPIAR LINK
                    </button>
                  </div>

                  <div className="mt-16 flex items-center justify-center gap-12 pt-16 border-t border-white/10">
                    <div className="text-center">
                      <p className="text-4xl font-black mb-1">{stats.invites}</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-emerald-300">Amigos Concluidos</p>
                    </div>
                    <div className="text-center">
                      <p className="text-4xl font-black mb-1">R$ {(stats.invites * 2).toFixed(2)}</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-emerald-300">Total Ganho</p>
                    </div>
                  </div>

                  <button 
                    onClick={handleInvite}
                    className="mt-12 text-[10px] font-black text-emerald-300 hover:text-white transition-colors"
                  >
                    Simular novo convidado (Apenas para teste)
                  </button>
                </div>
                
                {/* Background Shapes */}
                <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-500 rounded-full opacity-30 -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-400 rounded-full opacity-20 translate-x-1/2 translate-y-1/2 blur-3xl"></div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Notifications */}
      <AnimatePresence>
        {showNotification && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed bottom-10 left-0 right-0 flex justify-center z-[100] pointer-events-none"
          >
            <div className="bg-slate-900 border border-slate-800 text-white px-8 py-5 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.4)] flex items-center gap-4">
              <div className="bg-emerald-500 p-2 rounded-full shadow-lg shadow-emerald-500/30">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm font-black tracking-tight">{showNotification}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
