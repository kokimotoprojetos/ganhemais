'use client';

import { useState, useCallback, useEffect } from 'react';
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
  Lock,
  LogOut
} from 'lucide-react';
import { useEarnings } from '@/hooks/use-earnings';
import { AuthScreen } from '@/components/auth-screen';
import { YouTubeTask } from '@/components/youtube-task';
import { PibTasks } from '@/components/pib-tasks';
import { BookOpen } from 'lucide-react';
import { DepositModal } from '@/components/deposit-modal';
import { YOUTUBE_VIDEOS, PIB_TASKS } from '@/lib/tasks-data';

type Tab = 'painel' | 'carteira' | 'planos' | 'convites';

const Page = () => {
  // Referral handling moved down

  const { stats, addEarning, completeTask, dailyCheckIn, canCheckIn, isLoading, inviteUser, withdraw, upgradePlan, deposit, isAuthenticated, logout } = useEarnings();
  const [activeTab, setActiveTab] = useState<Tab>('painel');
  const [showNotification, setShowNotification] = useState<string | null>(null);
  const [pendingRef, setPendingRef] = useState<string | null>(null);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const handleAuthSuccess = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ganhemais_pending_ref');
    }
    setPendingRef(null);
  }, []);

  // Clear referral after login success
  useEffect(() => {
    if (isAuthenticated && pendingRef) {
      const timer = setTimeout(() => handleAuthSuccess(), 0);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, pendingRef, handleAuthSuccess]);

  // Show error UI if Clerk fails to load within timeout
  useEffect(() => {
    if (!isLoading) return;
    const timer = setTimeout(() => setLoadingTimeout(true), 8000);
    return () => clearTimeout(timer);
  }, [isLoading]);

  const [activeDay, setActiveDay] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const savedDay = localStorage.getItem('ganhemais_active_day');
      if (savedDay) {
        const parsed = parseInt(savedDay);
        if (parsed >= 1 && parsed <= 20) return parsed;
      }
    }
    return (new Date().getDate() - 1) % 20 + 1;
  });

  const handleSetActiveDay = (day: number) => {
    setActiveDay(day);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ganhemais_active_day', day.toString());
    }
  };

  // Capture referral code on mount
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const ref = urlParams.get('ref');
      if (ref) {
        localStorage.setItem('ganhemais_pending_ref', ref);
        timer = setTimeout(() => setPendingRef(ref), 0);
      } else {
        const savedRef = localStorage.getItem('ganhemais_pending_ref');
        if (savedRef) {
          timer = setTimeout(() => setPendingRef(savedRef), 0);
        }
      }
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, []);


  const isDayUnlocked = useCallback((dayNum: number): boolean => {
    if (dayNum === 1) return true;
    for (let d = 1; d < dayNum; d++) {
      const dayVideos = YOUTUBE_VIDEOS.filter(v => v.day === d);
      const dayPib = PIB_TASKS.find(p => p.day === d);
      const allVideosCompleted = dayVideos.every(v => stats.completedTasks.includes(v.id));
      const pibCompleted = dayPib ? stats.completedTasks.includes(dayPib.id) : true;
      if (!allVideosCompleted || !pibCompleted) return false;
    }
    return true;
  }, [stats.completedTasks]);

  // Deposit / subscription modal state
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [depositPredefinedAmount, setDepositPredefinedAmount] = useState<number | null>(null);
  const [depositPredefinedPlan, setDepositPredefinedPlan] = useState<'Silver' | 'Gold' | null>(null);

  const handleOpenDeposit = (amount: number | null = null, plan: 'Silver' | 'Gold' | null = null) => {
    setDepositPredefinedAmount(amount);
    setDepositPredefinedPlan(plan);
    setIsDepositModalOpen(true);
  };

  const handleDepositSuccess = async (amount: number, plan?: 'Silver' | 'Gold') => {
    if (plan) {
      await upgradePlan(plan);
      triggerNotification(`Parabéns! Plano ${plan} assinado com sucesso via Pix!`);
    } else {
      await deposit(amount);
      triggerNotification(`Depósito de R$ ${amount.toFixed(2)} confirmado!`);
    }
  };

  const handleSubscribePlan = async (plan: 'Silver' | 'Gold', price: number) => {
    if (stats.balance >= price) {
      const confirmPurchase = window.confirm(`Você possui R$ ${stats.balance.toFixed(2)} de saldo. Deseja assinar o plano ${plan} usando R$ ${price.toFixed(2)} do seu saldo de carteira?`);
      if (confirmPurchase) {
        await withdraw(price);
        await upgradePlan(plan);
        triggerNotification(`Assinatura do plano ${plan} ativada usando seu saldo!`);
      } else {
        handleOpenDeposit(price, plan);
      }
    } else {
      handleOpenDeposit(price, plan);
    }
  };

  const triggerNotification = useCallback((msg: string) => {
    setShowNotification(msg);
    setTimeout(() => setShowNotification(null), 3000);
  }, []);

  const handleDailyCheckIn = async () => {
    if (await dailyCheckIn()) {
      triggerNotification('Recompensa coletada!');
    } else {
      triggerNotification('Check-in já realizado hoje.');
    }
  };

  const handleTaskComplete = async (taskIdOrReward: string | number, reward?: number) => {
    if (typeof taskIdOrReward === 'string') {
      const actualReward = reward || 0;
      if (await completeTask(taskIdOrReward, actualReward)) {
        triggerNotification(`R$ ${actualReward.toFixed(2)} adicionados ao seu saldo!`);
      }
    } else {
      await addEarning(taskIdOrReward);
      triggerNotification(`R$ ${taskIdOrReward.toFixed(2)} adicionados ao seu saldo!`);
    }
  };

  const handleInvite = async () => {
    await inviteUser();
    triggerNotification('Novo convite simulado: +R$ 2,00!');
  };

  const copyRefLink = () => {
    const refCode = stats.referralCode || 'codigo';
    const link = typeof window !== 'undefined' ? `${window.location.origin}/?ref=${refCode}` : `https://ganhemais.app/?ref=${refCode}`;
    navigator.clipboard.writeText(link);
    triggerNotification('Link de convite copiado!');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-emerald-500 rounded-full opacity-20 blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500 rounded-full opacity-15 blur-[120px] pointer-events-none"></div>
        <div className="z-10 max-w-md w-full mx-4 bg-slate-900/80 border border-yellow-500/30 backdrop-blur-xl p-8 rounded-[2rem] shadow-2xl flex flex-col items-center gap-5 border-b-4 border-b-yellow-500">
          <div className="w-14 h-14 bg-yellow-500/10 border-2 border-yellow-500/30 rounded-2xl flex items-center justify-center">
            <svg className="w-7 h-7 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <div className="text-center">
            <h2 className="text-xl font-black text-white mb-2">Falha ao Inicializar Login</h2>
            <p className="text-slate-400 text-xs font-semibold leading-relaxed font-medium">O sistema de login (Clerk) não conseguiu carregar. Isso normalmente acontece quando as variáveis de ambiente não estão configuradas corretamente na Vercel ou quando o site não foi reimplantado após configurá-las.</p>
          </div>
          <div className="w-full bg-slate-950/60 rounded-2xl p-4 text-xs font-mono text-slate-300 space-y-2 border border-slate-800">
            <p className="text-yellow-400 font-bold">Como resolver na Vercel:</p>
            <p>1. Settings → Environment Variables</p>
            <p>2. Adicione: <span className="text-white">NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</span></p>
            <p>3. Adicione: <span className="text-white">CLERK_SECRET_KEY</span></p>
            <p>4. <span className="text-emerald-400 font-bold">Deployments → Redeploy</span></p>
          </div>
          <button onClick={() => window.location.reload()} className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black rounded-2xl text-sm transition-all cursor-pointer">Tentar Novamente</button>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <AuthScreen pendingRef={pendingRef} onAuthSuccess={handleAuthSuccess} />
    );
  }

  return (
    <>
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col h-screen fixed left-0 top-0">
        <div className="p-8 flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white font-bold shrink-0">
            <Zap className="w-5 h-5 fill-current" />
          </div>
          <span className="text-xl font-black tracking-tighter italic">GanheMais</span>
        </div>
        <nav className="space-y-2 px-4">
          {[{ id: 'painel', icon: LayoutDashboard, label: 'Painel' }, { id: 'carteira', icon: CreditCard, label: 'Carteira' }, { id: 'planos', icon: Rocket, label: 'Planos' }, { id: 'convites', icon: UserPlus, label: 'Convites' }].map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as Tab)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === tab.id ? 'bg-emerald-50 text-emerald-700' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}>
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </nav>
        <div className="mt-auto p-8 flex flex-col gap-4">
          <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-2xl">
            <p className="text-[10px] text-slate-400 mb-1 uppercase tracking-widest font-black">Nível {stats.plan}</p>
            <p className="text-xs font-medium opacity-80 mb-3">{stats.plan === 'Basic' ? 'Upgrade para ganhar 2x mais' : 'Aproveite seus benefícios VIP'}</p>
            <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: stats.plan === 'Basic' ? '30%' : stats.plan === 'Silver' ? '60%' : '100%' }} className="bg-emerald-400 h-full" />
            </div>
          </div>
          <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-red-500 hover:bg-red-50 hover:text-red-600 transition-all cursor-pointer">
            <LogOut className="w-5 h-5 text-red-500" />
            Sair da Conta
          </button>
        </div>
      </aside>
      {/* Mobile Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 flex justify-around py-3 md:hidden shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
        {[{ id: 'painel', icon: LayoutDashboard, label: 'Painel' }, { id: 'carteira', icon: CreditCard, label: 'Carteira' }, { id: 'planos', icon: Rocket, label: 'Planos' }, { id: 'convites', icon: UserPlus, label: 'Convites' }].map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as Tab)} className={`flex flex-col items-center gap-1 transition-all cursor-pointer ${activeTab === tab.id ? 'text-emerald-600 font-black scale-105' : 'text-slate-400 font-medium'}`}>
            <tab.icon className="w-5 h-5 shrink-0" />
            <span className="text-[10px] tracking-tight">{tab.label}</span>
          </button>
        ))}
      </nav>
      {/* Main Content Area */}
      <main className="md:ml-64 flex-1 flex flex-col overflow-y-auto p-4 sm:p-6 md:p-8 pb-24 md:pb-8">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 md:mb-10">
          <div className="flex items-center justify-between w-full sm:w-auto">
            <div className="flex items-center gap-2 md:hidden">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white font-bold shrink-0">
                <Zap className="w-5 h-5 fill-current" />
              </div>
              <span className="text-xl font-black tracking-tighter italic">GanheMais</span>
            </div>
            <div className="hidden md:block">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                {activeTab === 'painel' && 'Painel de Ganhos'}
                {activeTab === 'carteira' && 'Minha Carteira'}
                {activeTab === 'planos' && 'Planos de Upgrade'}
                {activeTab === 'convites' && 'Indique e Ganhe'}
              </h1>
              <p className="text-slate-500 font-medium text-sm">Bem-vindo de volta, investidor.</p>
            </div>
            {/* Status indicator and Logout on mobile */}
            <div className="md:hidden flex items-center gap-2 shrink-0">
              <div className="bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-full flex items-center gap-2 shadow-sm">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">3.842 Online</span>
              </div>
              <button onClick={logout} className="w-8 h-8 bg-red-50 hover:bg-red-100 text-red-500 border border-red-100 rounded-full flex items-center justify-center shadow-sm cursor-pointer transition-colors" title="Sair">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
          {/* Title for active tab on mobile */}
          <div className="md:hidden w-full bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              {activeTab === 'painel' && 'Painel de Ganhos'}
              {activeTab === 'carteira' && 'Minha Carteira'}
              {activeTab === 'planos' && 'Planos de Upgrade'}
              {activeTab === 'convites' && 'Indique e Ganhe'}
            </h2>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1 flex items-center gap-2">Saldo: <span className="text-emerald-600">R$ {stats.balance.toFixed(2)}</span> • Plano: <span className="text-indigo-600">{stats.plan}</span></p>
          </div>
          {/* Online count and Logout for desktop */}
          <div className="hidden md:flex items-center gap-4">
            <div className="bg-white border border-slate-200 px-4 py-2.5 rounded-full flex items-center gap-3 shadow-sm">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
              <span className="text-xs font-black uppercase tracking-widest text-slate-600">3.842 Online</span>
            </div>
            <button onClick={logout} className="flex items-center gap-2 bg-white hover:bg-red-50 text-slate-600 hover:text-red-600 border border-slate-200 hover:border-red-200 px-4 py-2.5 rounded-full text-xs font-black transition-all cursor-pointer shadow-sm">
              <LogOut className="w-4 h-4 text-red-500" />
              SAIR
            </button>
          </div>
        </header>
        <AnimatePresence mode="wait">
          {activeTab === 'painel' && (
            <motion.div key="painel" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
              {/* ... rest of painel content ... */}
            </motion.div>
          )}
          {activeTab === 'carteira' && (
            <motion.div key="carteira" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }} className="max-w-4xl mx-auto w-full space-y-8">
              {/* ... carteira content ... */}
            </motion.div>
          )}
          {activeTab === 'planos' && (
            <motion.div key="planos" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-10">
              {/* ... planos content ... */}
            </motion.div>
          )}
          {activeTab === 'convites' && (
            <motion.div key="convites" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
              {/* ... convites content ... */}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <DepositModal isOpen={isDepositModalOpen} onClose={() => setIsDepositModalOpen(false)} predefinedAmount={depositPredefinedAmount} predefinedPlan={depositPredefinedPlan} onSuccess={handleDepositSuccess} />
    </>
  );
};

export default Page;
