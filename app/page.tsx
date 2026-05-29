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
  LogOut,
  Users,
  Clock,
  Download,
  AlertTriangle,
  Crown
} from 'lucide-react';


import { useEarnings } from '@/hooks/use-earnings';
import { AuthScreen } from '@/components/auth-screen';
import { YouTubeTask } from '@/components/youtube-task';
import { PibTasks } from '@/components/pib-tasks';
import { BookOpen } from 'lucide-react';
import { DepositModal } from '@/components/deposit-modal';
import { WithdrawModal } from '@/components/withdraw-modal';
import { BonusWithdrawModal } from '@/components/bonus-withdraw-modal';
import { MegaBonusPopup } from '@/components/mega-bonus-popup';
import { YOUTUBE_VIDEOS, PIB_TASKS } from '@/lib/tasks-data';

type Tab = 'painel' | 'carteira' | 'planos' | 'convites' | 'equipe';

const Page = () => {
  // Referral handling moved down

  const { stats, team, pendingWithdrawals, addEarning, completeTask, dailyCheckIn, canCheckIn, isLoading, inviteUser, withdraw, withdrawBonus, upgradePlan, purchasePlanWithBalance, deposit, depositBalance, bonusBalance, inviteBonus, isAuthenticated, appDownloaded, trackAppDownload, logout, megaBonusActive, megaBonusClaimed, claimMegaBonus, dismissMegaBonus } = useEarnings();
  const [activeTab, setActiveTab] = useState<Tab>('painel');
  const [showNotification, setShowNotification] = useState<string | null>(null);
  const [pendingRef, setPendingRef] = useState<string | null>(null);
  const [showWelcomeModal, setShowWelcomeModal] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('ganhemais_welcome_seen') !== 'true';
    }
    return false;
  });

  const handleCloseWelcome = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('ganhemais_welcome_seen', 'true');
    }
    setShowWelcomeModal(false);
  };
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
        // If there is no ref parameter in the URL, we show the standard login UI
        timer = setTimeout(() => setPendingRef(null), 0);
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
  const [depositPredefinedPlan, setDepositPredefinedPlan] = useState<'Silver' | 'Gold' | 'Diamond' | null>(null);

  // Withdraw modal state
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [isBonusModalOpen, setIsBonusModalOpen] = useState(false);

  // Custom subscription modal state
  const [confirmSubModal, setConfirmSubModal] = useState<{ isOpen: boolean; plan: 'Silver' | 'Gold' | 'Diamond' | null; price: number }>({
    isOpen: false,
    plan: null,
    price: 0
  });

  const handleWithdrawSuccess = async (amount: number) => {
    const success = await withdraw(amount);
    if (success) {
      triggerNotification(`Saque de R$ ${amount.toFixed(2)} solicitado com sucesso!`);
    }
    return success;
  };

  const handleBonusWithdrawSuccess = async (amount: number) => {
    const success = await withdrawBonus(amount);
    if (success) {
      triggerNotification(`Saque de bônus de R$ ${amount.toFixed(2)} solicitado com sucesso!`);
    }
    return success;
  };

  const handleOpenDeposit = (amount: number | null = null, plan: 'Silver' | 'Gold' | 'Diamond' | null = null) => {
    setDepositPredefinedAmount(amount);
    setDepositPredefinedPlan(plan);
    setIsDepositModalOpen(true);
  };

  const handleDepositSuccess = async (amount: number, plan?: 'Silver' | 'Gold' | 'Diamond') => {
    if (plan) {
      await upgradePlan(plan);
      triggerNotification(`Parabéns! Plano ${plan} assinado com sucesso via Pix!`);
    } else {
      await deposit(amount);
      triggerNotification(`Depósito de R$ ${amount.toFixed(2)} confirmado!`);
    }
  };

  const handleSubscribePlan = async (plan: 'Silver' | 'Gold' | 'Diamond', price: number) => {
    if (depositBalance >= price) {
      setConfirmSubModal({ isOpen: true, plan, price });
    } else {
      handleOpenDeposit(price, plan);
    }
  };

  const handleConfirmPurchaseWithBalance = async () => {
    const { plan, price } = confirmSubModal;
    if (plan && price) {
      setConfirmSubModal({ isOpen: false, plan: null, price: 0 });
      const success = await purchasePlanWithBalance(plan, price);
      if (success) {
        triggerNotification(`Assinatura do plano ${plan} ativada usando seu saldo!`);
      }
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
    triggerNotification(`Novo convite simulado: +R$ ${inviteBonus.toFixed(2)}!`);
  };

  const copyRefLink = () => {
    const refCode = stats.referralCode || 'codigo';
    const link = typeof window !== 'undefined' ? `${window.location.origin}/?ref=${refCode}` : `https://replioganhemais.com/?ref=${refCode}`;
    navigator.clipboard.writeText(link);
    triggerNotification('Link de convite copiado!');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-emerald-500 rounded-full opacity-20 blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500 rounded-full opacity-15 blur-[120px] pointer-events-none"></div>
        <div className="z-10 flex flex-col items-center gap-4">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
            className="w-14 h-14 border-4 border-slate-800 border-t-emerald-500 rounded-full shadow-2xl"
          />
          <p className="text-slate-400 text-xs font-black tracking-widest uppercase animate-pulse">Carregando dados...</p>
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
          <div className="w-8 h-8 flex items-center justify-center shrink-0">
            <img src="/ICONE4.png" alt="GanheMais Logo" className="w-full h-full object-contain" />
          </div>
          <span className="text-xl font-black tracking-tighter italic">Replio GanheMais</span>
        </div>
        <nav className="space-y-2 px-4">
          {[
            { id: 'painel', icon: LayoutDashboard, label: 'Painel' },
            { id: 'carteira', icon: CreditCard, label: 'Carteira' },
            { id: 'planos', icon: Rocket, label: 'Planos' },
            { id: 'convites', icon: UserPlus, label: 'Convites' },
            { id: 'equipe', icon: Users, label: 'Equipe' }
          ].map((tab) => (
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
        {[
          { id: 'painel', icon: LayoutDashboard, label: 'Painel' },
          { id: 'carteira', icon: CreditCard, label: 'Carteira' },
          { id: 'planos', icon: Rocket, label: 'Planos' },
          { id: 'convites', icon: UserPlus, label: 'Convites' },
          { id: 'equipe', icon: Users, label: 'Equipe' }
        ].map((tab) => (
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
              <div className="w-8 h-8 flex items-center justify-center shrink-0">
                <img src="/ICONE4.png" alt="GanheMais Logo" className="w-full h-full object-contain" />
              </div>
              <span className="text-xl font-black tracking-tighter italic">Replio GanheMais</span>
            </div>
            <div className="hidden md:block">
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                {activeTab === 'painel' && 'Painel de Ganhos'}
                {activeTab === 'carteira' && 'Minha Carteira'}
                {activeTab === 'planos' && 'Planos de Upgrade'}
                {activeTab === 'convites' && 'Indique e Ganhe'}
                {activeTab === 'equipe' && 'Minha Equipe'}
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
              {activeTab === 'equipe' && 'Minha Equipe'}
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
            <motion.div 
              key="painel"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              {/* Balance & Hero */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="col-span-1 md:col-span-8 bg-white border border-slate-200 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 flex flex-col justify-between shadow-xl shadow-slate-200/40 border-b-4">
                  <div>
                    <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] mb-4">Saldo Disponível</p>
                    <h2 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tighter text-slate-900 flex items-baseline gap-2">
                      <span className="text-xl font-bold text-slate-300">R$</span>
                      {stats.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </h2>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 mt-8 md:mt-12">
                    <button 
                      onClick={() => setActiveTab('carteira')}
                      className="px-6 md:px-10 py-4 bg-emerald-500 text-white rounded-2xl font-black shadow-lg hover:bg-emerald-600 transition-all flex items-center justify-center gap-3 cursor-pointer text-sm md:text-base"
                    >
                      SACAR VIA PIX <ArrowUpRight className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => setActiveTab('carteira')}
                      className="px-6 md:px-10 py-4 bg-slate-50 text-slate-600 border border-slate-200 rounded-2xl font-black hover:bg-slate-100 transition-all cursor-pointer text-sm md:text-base"
                    >
                      EXTRATO
                    </button>
                  </div>
                </div>
                
                <div className="col-span-1 md:col-span-4 bg-emerald-600 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 text-white relative overflow-hidden shadow-2xl shadow-emerald-100">
                  <div className="relative z-10 h-full flex flex-col justify-between">
                    <div>
                      <div className="bg-emerald-500 w-12 h-12 rounded-2xl flex items-center justify-center mb-6 shadow-xl">
                        <Calendar className="w-6 h-6" />
                      </div>
                      <h3 className="text-xl md:text-2xl font-black mb-2 tracking-tight">Check-in</h3>
                      <p className="text-emerald-100 text-xs md:text-sm mb-6 opacity-80 leading-relaxed font-medium">Bônus de R$ 2,00 liberado a cada 24 horas.</p>
                    </div>
                    <motion.button 
                      whileHover={canCheckIn() ? { scale: 1.02 } : {}}
                      whileTap={canCheckIn() ? { scale: 0.98 } : {}}
                      disabled={!canCheckIn()}
                      onClick={handleDailyCheckIn}
                      className={`w-full py-4.5 rounded-2xl font-black text-sm md:text-lg shadow-2xl transition-all cursor-pointer ${
                        canCheckIn() 
                          ? 'bg-white text-emerald-700 shadow-white/20' 
                          : 'bg-emerald-700/50 text-emerald-300/50 cursor-not-allowed shadow-none'
                      }`}
                    >
                      {canCheckIn() ? 'RESGATAR R$ 2,00' : 'COLETADO'}
                    </motion.button>
                  </div>
                  <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-emerald-500 rounded-full opacity-30 blur-3xl"></div>
                </div>
              </div>

              {/* Day Selector Journey */}
              <div className="bg-white border border-slate-200 rounded-[2rem] md:rounded-[2.5rem] p-5 md:p-8 shadow-md">
                <h3 className="text-lg md:text-xl font-black text-slate-900 tracking-tight mb-2">Jornada de 20 Dias de Tarefas</h3>
                <p className="text-xs md:text-sm font-medium text-slate-500 mb-6">Selecione o dia para realizar os seus desafios diários e resgatar suas recompensas.</p>
                <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                  {Array.from({ length: 20 }, (_, i) => {
                    const dayNum = i + 1;
                    const isSelected = activeDay === dayNum;
                    const todayDayNum = (new Date().getDate() - 1) % 20 + 1;
                    const isToday = todayDayNum === dayNum;
                    
                    // Progress calculations
                    const dayVideos = YOUTUBE_VIDEOS.filter(v => v.day === dayNum);
                    const dayPib = PIB_TASKS.find(p => p.day === dayNum);
                    const completedDayVideos = dayVideos.filter(v => stats.completedTasks.includes(v.id)).length;
                    const completedDayPib = dayPib && stats.completedTasks.includes(dayPib.id) ? 1 : 0;
                    const totalDone = completedDayVideos + completedDayPib;
                    const totalTasks = dayVideos.length + (dayPib ? 1 : 0);
                    const isFullyCompleted = totalDone === totalTasks;

                    const unlocked = isDayUnlocked(dayNum);

                    let btnStyle = "border-slate-100 bg-white text-slate-700 hover:border-slate-300";
                    if (isSelected) {
                      btnStyle = "border-emerald-500 bg-emerald-500 text-white shadow-lg shadow-emerald-500/20";
                    } else if (isFullyCompleted) {
                      btnStyle = "border-emerald-500/30 bg-emerald-50/50 text-emerald-700";
                    } else if (!unlocked) {
                      btnStyle = "border-slate-100 bg-slate-50 text-slate-400 opacity-60 hover:border-slate-200 cursor-not-allowed";
                    }

                    return (
                      <button
                        key={dayNum}
                        onClick={() => handleSetActiveDay(dayNum)}
                        className={`px-5 py-3.5 rounded-[2.5rem] border-2 font-black text-sm transition-all shrink-0 flex flex-col items-center gap-1 min-w-[105px] cursor-pointer ${btnStyle}`}
                      >
                        <div className="flex items-center gap-1.5">
                          {!unlocked && <Lock className="w-3 h-3 text-slate-400 shrink-0" />}
                          <span>Dia {dayNum}</span>
                          {isToday && (
                            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full ${isSelected ? 'bg-white text-emerald-600' : 'bg-emerald-500 text-white animate-pulse'}`}>HOJE</span>
                          )}
                        </div>
                        <span className={`text-[9px] font-bold ${isSelected ? 'text-emerald-100' : unlocked ? 'text-slate-400' : 'text-slate-300'}`}>
                          {unlocked ? `${totalDone}/${totalTasks} Concluído` : 'Bloqueado'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Limit Banner */}
              {(() => {
                const today = new Date().toDateString();
                const completedToday = stats.lastTaskDate === today ? (stats.completedTodayCount || 0) : 0;
                const maxTasks = stats.plan === 'Basic' ? 5 : stats.plan === 'Silver' ? 15 : Infinity;
                const remainingTasks = maxTasks - completedToday;

                if (stats.plan !== 'Gold' && stats.plan !== 'Diamond' && remainingTasks <= 0) {
                  return (
                    <div className="bg-amber-500/10 border-2 border-amber-500/20 rounded-[2.5rem] p-6 text-amber-800 flex flex-col sm:flex-row items-center justify-between shadow-sm gap-4 animate-bounce">
                      <div className="flex gap-4 items-center">
                        <div className="p-3 bg-amber-500 text-white rounded-2xl shrink-0">
                          <Zap className="w-6 h-6 fill-current" />
                        </div>
                        <div>
                          <h4 className="font-black text-slate-800">Limite Diário de Tarefas Atingido</h4>
                          <p className="text-sm font-medium text-slate-600 leading-normal mt-0.5">
                            Você já concluiu o limite diário de {maxTasks} tarefas do plano {stats.plan === 'Basic' ? 'Básico' : 'Silver'}.
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setActiveTab('planos')}
                        className="px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black rounded-xl transition-all cursor-pointer whitespace-nowrap"
                      >
                        FAZER UPGRADE AGORA
                      </button>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Tasks Section / Lock Check */}
              {!isDayUnlocked(activeDay) ? (
                <div className="bg-white border border-slate-200 rounded-[2rem] md:rounded-[2.5rem] p-6 sm:p-10 md:p-16 text-center shadow-md flex flex-col items-center max-w-xl mx-auto space-y-6 my-6 md:my-10 animate-fade-in">
                  <div className="w-20 h-20 bg-slate-100 border-2 border-slate-200 text-slate-400 rounded-full flex items-center justify-center shadow-inner">
                    <Lock className="w-10 h-10" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">Dia Bloqueado</h3>
                    <p className="text-slate-500 text-sm leading-relaxed font-medium">
                      Para realizar as tarefas do **Dia {activeDay}**, você precisa primeiro concluir todas as tarefas (vídeos e questionários) do **Dia {activeDay - 1}**.
                    </p>
                  </div>
                  <button 
                    onClick={() => handleSetActiveDay(activeDay - 1)}
                    className="px-8 py-4.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer flex items-center gap-2 group"
                  >
                    IR PARA O DIA {activeDay - 1}
                    <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </button>
                </div>
              ) : (
                <>
                  {/* Tasks Section */}
                  <div>
                    <div className="flex justify-between items-end mb-6">
                      <h3 className="text-xl font-black text-slate-900 tracking-tight">Vídeos do Dia</h3>
                      <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg text-xs font-black">
                        <Zap className="w-3.5 h-3.5 fill-current" /> {(() => {
                          const today = new Date().toDateString();
                          const completedToday = stats.lastTaskDate === today ? (stats.completedTodayCount || 0) : 0;
                          const maxTasks = stats.plan === 'Basic' ? 5 : stats.plan === 'Silver' ? 15 : Infinity;
                          const remainingTasks = maxTasks - completedToday;
                          return (stats.plan === 'Gold' || stats.plan === 'Diamond') ? 'Ilimitado' : `${Math.max(0, remainingTasks)} tarefas restantes hoje`;
                        })()}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      {YOUTUBE_VIDEOS.filter(v => v.day === activeDay).map((video) => (
                        <YouTubeTask 
                          key={video.id}
                          videoId={video.videoId} 
                          reward={video.reward} 
                          title={video.title} 
                          isCompleted={stats.completedTasks.includes(video.id)}
                          onComplete={(reward) => handleTaskComplete(video.id, reward)} 
                        />
                      ))}
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
                      activeDay={activeDay}
                    />
                  </div>
                </>
              )}
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
              <div className="bg-white border border-slate-200 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 shadow-2xl border-b-8 border-b-emerald-500">
                
                {/* Balance Split Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 md:mb-12">
                  
                  {/* Left Column: Account Balance */}
                  <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                    <div>
                      <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] mb-2">Saldo da Conta (Geral)</p>
                      <h3 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
                        R$ {stats.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-6">
                      <button 
                        onClick={() => setIsWithdrawModalOpen(true)}
                        className="flex items-center justify-center gap-2 bg-slate-900 text-white py-4 px-2 rounded-xl font-black text-xs shadow-md hover:bg-slate-800 transition-all group cursor-pointer"
                      >
                        <ArrowUpRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform shrink-0" />
                        SACAR SALDO
                      </button>
                      <button 
                        onClick={() => handleOpenDeposit()}
                        className="flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 border-2 border-emerald-100 py-4 px-2 rounded-xl font-black text-xs hover:bg-emerald-100 transition-all group cursor-pointer"
                      >
                        <ArrowDownLeft className="w-4 h-4 text-emerald-600 group-hover:-translate-x-0.5 group-hover:translate-y-0.5 transition-transform shrink-0" />
                        DEPOSITAR
                      </button>
                    </div>
                  </div>

                  {/* Right Column: Bonus Balance */}
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50/30 border border-amber-100 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <Gift className="w-4 h-4 text-amber-600 animate-pulse" />
                        <p className="text-amber-600 font-black text-[10px] uppercase tracking-[0.2em]">Saldo Bônus (Primeiro Depósito)</p>
                      </div>
                      <h3 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
                        R$ {bonusBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </h3>
                    </div>
                    <div className="mt-6">
                      <button 
                        onClick={() => setIsBonusModalOpen(true)}
                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white py-4 px-4 rounded-xl font-black text-xs shadow-md hover:brightness-110 transition-all group cursor-pointer"
                      >
                        <ArrowUpRight className="w-4 h-4 text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform shrink-0" />
                        SACAR SALDO BÔNUS
                      </button>
                    </div>
                  </div>

                </div>

                {/* Subtitle / Extra Stats */}
                <div className="flex flex-col sm:flex-row justify-between items-center bg-slate-50 rounded-2xl p-4 border border-slate-100 shadow-sm gap-2">
                  <div className="text-center sm:text-left">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Total de Ganhos Registrados</p>
                    <p className="text-lg font-black text-emerald-600 mt-0.5">R$ {stats.totalEarned.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div className="text-xs font-semibold text-slate-500 max-w-xs text-center sm:text-right leading-normal">
                    Deposite pela primeira vez para ativar o bônus de **R$ 20,00**.
                  </div>
                </div>

                <div className="mt-12 pt-12 border-t border-slate-100">
                  <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">Últimas Transações</h4>
                  <div className="space-y-4">
                    {pendingWithdrawals && pendingWithdrawals.map((withdrawal) => {
                      const isSuccess = withdrawal.status === 'Sucesso';
                      const isRefused = withdrawal.status === 'Recusado';
                      
                      return (
                        <div key={withdrawal.id} className={`flex flex-col p-4 rounded-2xl border shadow-sm gap-3 ${
                          isSuccess 
                            ? 'bg-emerald-50 border-emerald-200' 
                            : isRefused 
                              ? 'bg-red-50 border-red-200' 
                              : 'bg-amber-50 border-amber-200'
                        }`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className={`p-2 rounded-xl ${
                                isSuccess 
                                  ? 'bg-emerald-100 text-emerald-600' 
                                  : isRefused 
                                    ? 'bg-red-100 text-red-600' 
                                    : 'bg-amber-100 text-amber-600'
                              }`}>
                                {isSuccess ? <CheckCircle2 className="w-5 h-5" /> : isRefused ? <AlertTriangle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                              </div>
                              <div>
                                <p className="font-bold text-slate-800 text-sm">
                                  {isSuccess 
                                    ? 'Saque Pix Concluído' 
                                    : isRefused 
                                      ? 'Saque Pix Recusado' 
                                      : 'Saque Pix Solicitado'}
                                </p>
                                <p className={`text-[10px] font-black uppercase tracking-wider ${
                                  isSuccess 
                                    ? 'text-emerald-600' 
                                    : isRefused 
                                      ? 'text-red-500' 
                                      : 'text-amber-600'
                                }`}>
                                  {isSuccess 
                                    ? 'Sucesso - Pago via Pix' 
                                    : isRefused 
                                      ? 'Recusado / Estornado' 
                                      : 'Pendente - Em processamento (24h)'}
                                </p>
                                {withdrawal.date && (
                                  <p className="text-[9px] text-slate-400 font-bold mt-0.5">
                                    {new Date(withdrawal.date).toLocaleString('pt-BR', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </p>
                                )}
                              </div>
                            </div>
                            <span className={`font-black text-lg ${
                              isSuccess 
                                ? 'text-emerald-600' 
                                : isRefused 
                                  ? 'text-red-500' 
                                  : 'text-amber-600'
                            }`}>
                              -R$ {withdrawal.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                          {!isSuccess && !isRefused && (
                            <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-3 flex flex-col sm:flex-row items-center gap-3 justify-between">
                              <p className="text-[11px] text-indigo-700 font-bold leading-relaxed">
                                <AlertTriangle className="w-3.5 h-3.5 inline mr-1 -mt-0.5 animate-pulse" />
                                O aplicativo oficial está passando por uma grande atualização e estará de volta em breve com novas funções de saque Pix automático!
                              </p>
                              <span className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-black text-[9px] uppercase tracking-wider shrink-0">
                                EM ATUALIZAÇÃO
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
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
              <div className="text-center max-w-2xl mx-auto mb-8 md:mb-16">
                <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900 mb-2 md:mb-4">Escolha seu Plano</h2>
                <p className="text-sm md:text-base text-slate-500 font-medium px-4">Desbloqueie tarefas ilimitadas e multiplique seus ganhos diários agora mesmo.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Basic Plan */}
                <div className={`bg-white border-2 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 flex flex-col relative transition-all ${stats.plan === 'Basic' ? 'border-emerald-500 shadow-2xl' : 'border-slate-100 opacity-80'}`}>
                  {stats.plan === 'Basic' && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-6 py-1 rounded-full text-[10px] font-black tracking-widest uppercase">ATUAL</div>
                  )}
                  <h4 className="text-slate-400 font-black text-[10px] uppercase tracking-widest mb-2">Plano Grátis</h4>
                  <p className="text-2xl md:text-3xl font-black mb-6 md:mb-8 text-slate-900 italic tracking-tighter">Básico</p>
                  <ul className="space-y-4 mb-8 md:mb-12 flex-1 text-sm font-medium text-slate-500">
                    <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-500" /> 5 Tarefas por dia</li>
                    <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-500" /> Check-in R$ 2,00</li>
                    <li className="flex items-center gap-3 opacity-30"><Lock className="w-5 h-5" /> Saque sem prioridade</li>
                  </ul>
                  <button disabled className="w-full py-4 bg-slate-100 text-slate-400 rounded-2xl font-black text-sm">INCLUSO</button>
                </div>

                {/* Silver Plan */}
                <div className={`bg-white border-2 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 flex flex-col relative transition-all shadow-xl ${stats.plan === 'Silver' ? 'border-emerald-500' : 'border-slate-100 hover:border-indigo-200'}`}>
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-6 py-1 rounded-full text-[10px] font-black tracking-widest uppercase">POPULAR</div>
                  <h4 className="text-slate-400 font-black text-[10px] uppercase tracking-widest mb-2">Acesso Silver</h4>
                  <p className="text-2xl md:text-3xl font-black mb-1 text-slate-900 italic tracking-tighter">Premium</p>
                  <div className="flex items-baseline gap-1 mb-6 md:mb-8">
                    <span className="text-xl font-bold">R$</span>
                    <span className="text-4xl font-black">39,90</span>
                    <span className="text-slate-400 text-xs font-bold leading-normal">/mês</span>
                  </div>
                  <ul className="space-y-4 mb-8 md:mb-12 flex-1 text-sm font-medium text-slate-600">
                    <li className="flex items-center gap-3 font-bold"><CheckCircle2 className="w-5 h-5 text-indigo-500" /> 15 Tarefas por dia</li>
                    <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-indigo-500" /> Check-in de R$ 5,00</li>
                  </ul>
                  {stats.plan === 'Silver' ? (
                    <button disabled className="w-full py-4 bg-slate-100 text-slate-400 rounded-2xl font-black text-sm">ATUAL</button>
                  ) : depositBalance >= 39.90 ? (
                    <div className="space-y-3">
                      <button 
                        onClick={() => handleSubscribePlan('Silver', 39.90)}
                        className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5"
                      >
                        <span>ASSINAR COM SALDO DE DEPÓSITO</span>
                        <span className="text-[10px] opacity-80 font-normal">Saldo de depósito: R$ {depositBalance.toFixed(2)}</span>
                      </button>
                      <button 
                        onClick={() => handleOpenDeposit(39.90, 'Silver')}
                        className="w-full py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-200 transition-all cursor-pointer"
                      >
                        Pagar com Pix
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => handleSubscribePlan('Silver', 39.90)}
                      className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all cursor-pointer"
                    >
                      ASSINAR AGORA
                    </button>
                  )}
                </div>

                {/* Gold Plan */}
                <div className={`bg-slate-900 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 flex flex-col text-white shadow-2xl relative ${stats.plan === 'Gold' ? 'border-2 border-emerald-500 shadow-emerald-950/20' : ''}`}>
                  <h4 className="text-amber-400 font-black text-[10px] uppercase tracking-widest mb-2">Poder Máximo</h4>
                  <p className="text-2xl md:text-3xl font-black mb-1 italic tracking-tighter text-amber-500 flex items-center gap-2">Elite <Star className="w-6 h-6 fill-amber-500" /></p>
                  <div className="flex items-baseline gap-1 mb-6 md:mb-8">
                    <span className="text-xl font-bold opacity-60">R$</span>
                    <span className="text-4xl font-black">97,00</span>
                    <span className="text-slate-500 text-xs font-bold leading-normal">/anual</span>
                  </div>
                  <ul className="space-y-4 mb-8 md:mb-12 flex-1 text-sm font-medium text-slate-300">
                    <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-400" /> Tarefas ILIMITADAS</li>
                    <li className="flex items-center gap-3 font-black text-emerald-400"><CheckCircle2 className="w-5 h-5" /> Bônus fixo de 20%</li>
                    <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-400" /> Saque IMEDIATO sem taxas</li>
                    <li className="flex items-center gap-3 opacity-60"><CheckCircle2 className="w-5 h-5" /> Suporte 24h VIP</li>
                  </ul>
                  {stats.plan === 'Gold' ? (
                    <button disabled className="w-full py-4 bg-slate-800 text-slate-500 rounded-2xl font-black text-sm">ATUAL</button>
                  ) : depositBalance >= 97.00 ? (
                    <div className="space-y-3">
                      <button 
                        onClick={() => handleSubscribePlan('Gold', 97.00)}
                        className="w-full py-4 bg-emerald-50 text-slate-950 rounded-2xl font-black text-sm shadow-xl shadow-emerald-500/10 hover:bg-emerald-600 transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5"
                      >
                        <span>ASSINAR COM SALDO DE DEPÓSITO</span>
                        <span className="text-[10px] opacity-80 font-normal">Saldo de depósito: R$ {depositBalance.toFixed(2)}</span>
                      </button>
                      <button 
                        onClick={() => handleOpenDeposit(97.00, 'Gold')}
                        className="w-full py-2.5 bg-slate-800 text-slate-300 rounded-xl font-bold text-xs hover:bg-slate-700 transition-all cursor-pointer"
                      >
                        Pagar com Pix
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => handleSubscribePlan('Gold', 97.00)}
                      className="w-full py-4 bg-white text-slate-900 rounded-2xl font-black text-sm shadow-xl shadow-white/5 hover:bg-slate-100 transition-all cursor-pointer"
                    >
                      TORNE-SE ELITE
                    </button>
                  )}
                </div>

                {/* Diamond Plan */}
                <div className={`bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 flex flex-col text-white shadow-2xl relative border-2 ${stats.plan === 'Diamond' ? 'border-cyan-400 shadow-cyan-950/20' : 'border-indigo-950 hover:border-indigo-900'}`}>
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-cyan-400 to-indigo-400 text-slate-950 px-6 py-1 rounded-full text-[10px] font-black tracking-widest uppercase">EXCLUSIVO</div>
                  <h4 className="text-cyan-400 font-black text-[10px] uppercase tracking-widest mb-2">Poder Infinito</h4>
                  <p className="text-2xl md:text-3xl font-black mb-1 italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400 flex items-center gap-2">Diamante <Crown className="w-6 h-6 text-cyan-400 fill-cyan-400 animate-pulse" /></p>
                  <div className="flex items-baseline gap-1 mb-6 md:mb-8">
                    <span className="text-xl font-bold opacity-60">R$</span>
                    <span className="text-4xl font-black text-cyan-300">149,90</span>
                    <span className="text-slate-500 text-xs font-bold leading-normal">/anual</span>
                  </div>
                  <ul className="space-y-4 mb-8 md:mb-12 flex-1 text-sm font-medium text-slate-300">
                    <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-cyan-400" /> Saque IMEDIATO sem taxas</li>
                    <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-cyan-400" /> Saldo indicação imediato</li>
                    <li className="flex items-center gap-3 font-black text-cyan-400"><CheckCircle2 className="w-5 h-5" /> Bônus de R$ 2,00 por amigo</li>
                    <li className="flex items-center gap-3 opacity-60"><CheckCircle2 className="w-5 h-5" /> Suporte VIP Priority 24h</li>
                  </ul>
                  {stats.plan === 'Diamond' ? (
                    <button disabled className="w-full py-4 bg-slate-800 text-slate-500 rounded-2xl font-black text-sm">ATUAL</button>
                  ) : depositBalance >= 149.90 ? (
                    <div className="space-y-3">
                      <button 
                        onClick={() => handleSubscribePlan('Diamond', 149.90)}
                        className="w-full bg-gradient-to-r from-cyan-500 to-indigo-500 text-slate-950 rounded-2xl font-black text-sm shadow-xl shadow-cyan-500/10 hover:brightness-110 transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5"
                      >
                        <span>ASSINAR COM SALDO DE DEPÓSITO</span>
                        <span className="text-[10px] opacity-80 font-normal">Saldo de depósito: R$ {depositBalance.toFixed(2)}</span>
                      </button>
                      <button 
                        onClick={() => handleOpenDeposit(149.90, 'Diamond')}
                        className="w-full py-2.5 bg-slate-800 text-slate-300 rounded-xl font-bold text-xs hover:bg-slate-700 transition-all cursor-pointer"
                      >
                        Pagar com Pix
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => handleSubscribePlan('Diamond', 149.90)}
                      className="w-full py-4 bg-gradient-to-r from-cyan-500 to-indigo-500 text-slate-950 rounded-2xl font-black text-sm shadow-xl shadow-cyan-500/10 hover:brightness-110 transition-all cursor-pointer"
                    >
                      ADQUIRIR DIAMANTE
                    </button>
                  )}
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
              <div className="bg-emerald-600 rounded-[2rem] md:rounded-[3rem] p-6 sm:p-10 md:p-16 text-white text-center relative overflow-hidden shadow-[0_40px_80px_rgba(16,185,129,0.2)]">
                <div className="relative z-10">
                  <div className="w-16 h-16 md:w-24 md:h-24 bg-white/10 rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center mx-auto mb-6 md:mb-8 backdrop-blur-xl border border-white/20">
                    <UserPlus className="w-8 h-8 md:w-10 md:h-10" />
                  </div>
                  <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4">Ganhe R$ {inviteBonus.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} na Hora!</h2>
                  <p className="text-emerald-100 text-sm md:text-lg mb-8 md:mb-12 max-w-md mx-auto font-medium leading-relaxed opacity-90">
                    Cada amigo que entrar pelo seu link você ganha dinheiro instantâneo no seu saldo disponível.
                  </p>
                  
                  <div className="bg-white/10 p-1.5 sm:p-2 rounded-2xl sm:rounded-3xl backdrop-blur-md max-w-md mx-auto flex flex-col sm:flex-row items-center gap-2 border border-white/20">
                    <div className="flex-1 px-4 py-2 sm:py-0 font-bold text-xs sm:text-sm overflow-hidden text-ellipsis whitespace-nowrap opacity-80">
                      {typeof window !== 'undefined' ? `${window.location.host}/?ref=${stats.referralCode || ''}` : `replioganhemais.com/?ref=${stats.referralCode || ''}`}
                    </div>
                    <button 
                      onClick={copyRefLink}
                      className="w-full sm:w-auto bg-white text-emerald-700 px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl font-black text-xs shadow-xl shadow-emerald-900/10 hover:bg-emerald-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Copy className="w-4 h-4" /> COPIAR LINK
                    </button>
                  </div>

                  <div className="mt-10 sm:mt-16 flex items-center justify-center gap-8 sm:gap-12 pt-10 sm:pt-16 border-t border-white/10">
                    <div className="text-center">
                      <p className="text-3xl sm:text-4xl font-black mb-1">{stats.invites}</p>
                      <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-emerald-300">Amigos Concluintes</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl sm:text-4xl font-black mb-1">R$ {(stats.invites * inviteBonus).toFixed(2)}</p>
                      <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-emerald-300">Total Ganho</p>
                    </div>
                  </div>
                </div>
                
                {/* Background Shapes */}
                <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-500 rounded-full opacity-30 -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-400 rounded-full opacity-20 translate-x-1/2 translate-y-1/2 blur-3xl"></div>
              </div>
            </motion.div>
          )}

          {activeTab === 'equipe' && (
            <motion.div 
              key="equipe"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-4xl mx-auto w-full space-y-8"
            >
              {/* Stats Section */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {/* Membros Card */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-md flex items-center gap-4">
                  <div className="bg-emerald-50 w-12 h-12 rounded-2xl flex items-center justify-center text-emerald-600 shrink-0">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">Total de Convidados</p>
                    <p className="text-2xl font-black text-slate-900 mt-1">{team.length}</p>
                  </div>
                </div>

                {/* Ganhos Card */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-md flex items-center gap-4">
                  <div className="bg-indigo-50 w-12 h-12 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">Ganhos da Equipe</p>
                    <p className="text-2xl font-black text-emerald-600 mt-1">R$ {(team.length * inviteBonus).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>

                {/* Comissao Card */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-md flex items-center gap-4">
                  <div className="bg-amber-50 w-12 h-12 rounded-2xl flex items-center justify-center text-amber-600 shrink-0">
                    <Gift className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">Comissão por Cadastro</p>
                    <p className="text-2xl font-black text-amber-600 mt-1">R$ {inviteBonus.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>
              </div>

              {/* Team Members List */}
              <div className="bg-white border border-slate-200 rounded-[2rem] p-6 md:p-10 shadow-xl">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Membros da sua Equipe</h3>
                    <p className="text-xs font-medium text-slate-500 mt-0.5">Pessoas que se cadastraram no aplicativo usando seu link de indicação.</p>
                  </div>
                  {team.length > 0 && (
                    <span className="bg-emerald-50 text-emerald-800 text-xs font-black px-3.5 py-1.5 rounded-full border border-emerald-100 uppercase tracking-widest shrink-0">
                      VIP Ativo
                    </span>
                  )}
                </div>

                {team.length === 0 ? (
                  <div className="text-center py-12 flex flex-col items-center max-w-md mx-auto space-y-6">
                    <div className="w-20 h-20 bg-slate-50 border-2 border-slate-100 text-slate-300 rounded-[1.8rem] flex items-center justify-center shadow-inner">
                      <Users className="w-10 h-10" />
                    </div>
                    <div>
                      <h4 className="text-lg font-black text-slate-800">Sua equipe está vazia</h4>
                      <p className="text-slate-500 text-sm font-medium leading-relaxed mt-2">
                        Você ainda não possui convidados registrados. Indique amigos e receba **R$ {inviteBonus.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}** na hora por cada cadastro realizado!
                      </p>
                    </div>
                    <div className="w-full bg-slate-50 border border-slate-200/60 p-2 rounded-2xl flex items-center gap-2">
                      <div className="flex-1 px-3 text-left font-bold text-xs overflow-hidden text-ellipsis whitespace-nowrap text-slate-500">
                        {typeof window !== 'undefined' ? `${window.location.host}/?ref=${stats.referralCode || ''}` : `replioganhemais.com/?ref=${stats.referralCode || ''}`}
                      </div>
                      <button 
                        onClick={copyRefLink}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-3 rounded-xl font-black text-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-md shadow-emerald-500/10"
                      >
                        <Copy className="w-3.5 h-3.5" /> COPIAR LINK
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto -mx-6 px-6">
                    <div className="inline-block min-w-full align-middle">
                      {/* Desktop Table View */}
                      <table className="min-w-full divide-y divide-slate-100 hidden sm:table">
                        <thead>
                          <tr>
                            <th scope="col" className="py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-wider">Convidado</th>
                            <th scope="col" className="py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-wider">Plano</th>
                            <th scope="col" className="py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-wider">Data de Cadastro</th>
                            <th scope="col" className="py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-wider">Comissão ganha</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {team.map((member, idx) => {
                            const [localPart, domain] = (member.email || '').split('@');
                            const maskedEmail = domain 
                              ? (localPart.length <= 2 
                                  ? `${localPart}***@${domain}` 
                                  : `${localPart.substring(0, 2)}***@${domain}`) 
                              : 'usu***@exemplo.com';

                            const planColors = {
                              Basic: 'bg-slate-100 text-slate-800 border-slate-200',
                              Silver: 'bg-indigo-50 text-indigo-800 border-indigo-100',
                              Gold: 'bg-amber-50 text-amber-800 border-amber-100'
                            };

                            const formattedDate = member.created_at
                              ? new Date(member.created_at).toLocaleDateString('pt-BR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric'
                                })
                              : 'Recente';

                            return (
                              <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                <td className="py-4 whitespace-nowrap">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-xs">
                                      {maskedEmail.substring(0, 2).toUpperCase()}
                                    </div>
                                    <span className="font-bold text-slate-800 text-sm">{maskedEmail}</span>
                                  </div>
                                </td>
                                <td className="py-4 text-center whitespace-nowrap">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black border ${planColors[member.plan as keyof typeof planColors] || planColors.Basic}`}>
                                    {member.plan}
                                  </span>
                                </td>
                                <td className="py-4 text-center whitespace-nowrap text-xs font-bold text-slate-400">
                                  {formattedDate}
                                </td>
                                <td className="py-4 text-right whitespace-nowrap">
                                  <span className="text-sm font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full">+R$ {inviteBonus.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>

                      {/* Mobile Cards View */}
                      <div className="sm:hidden space-y-4">
                        {team.map((member, idx) => {
                          const [localPart, domain] = (member.email || '').split('@');
                          const maskedEmail = domain 
                            ? (localPart.length <= 2 
                                ? `${localPart}***@${domain}` 
                                : `${localPart.substring(0, 2)}***@${domain}`) 
                            : 'usu***@exemplo.com';

                          const planColors = {
                            Basic: 'bg-slate-100 text-slate-800 border-slate-200',
                            Silver: 'bg-indigo-50 text-indigo-800 border-indigo-100',
                            Gold: 'bg-amber-50 text-amber-800 border-amber-100'
                          };

                          const formattedDate = member.created_at
                            ? new Date(member.created_at).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric'
                              })
                            : 'Recente';

                          return (
                            <div key={idx} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3.5 shadow-sm">
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-xs">
                                    {maskedEmail.substring(0, 2).toUpperCase()}
                                  </div>
                                  <span className="font-bold text-slate-800 text-xs">{maskedEmail}</span>
                                </div>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black border ${planColors[member.plan as keyof typeof planColors] || planColors.Basic}`}>
                                  {member.plan}
                                </span>
                              </div>
                              <div className="flex justify-between items-center text-[10px] pt-2 border-t border-slate-100/60 font-bold text-slate-400">
                                <span>Cadastrado em {formattedDate}</span>
                                <span className="text-[11px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">+R$ {inviteBonus.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <AnimatePresence>
        {confirmSubModal.isOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            {/* Backdrop overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmSubModal({ isOpen: false, plan: null, price: 0 })}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
            />

            {/* Modal Box */}
            <motion.div 
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="relative bg-slate-900 border border-slate-800 w-full max-w-md rounded-[2.5rem] p-8 shadow-[0_30px_70px_rgba(0,0,0,0.8)] z-10 overflow-hidden flex flex-col text-center border-b-4 border-b-emerald-500"
            >
              {/* Header Icon */}
              <div className="w-20 h-20 bg-emerald-500/10 border-4 border-emerald-500/30 text-emerald-400 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-[0_0_50px_rgba(16,185,129,0.2)]">
                <Rocket className="w-10 h-10 animate-pulse text-emerald-400" />
              </div>

              {/* Title & Desc */}
              <h3 className="text-2xl font-black text-white tracking-tight mb-3">Ativar Assinatura</h3>
              <p className="text-slate-300 font-semibold text-sm leading-relaxed max-w-sm mx-auto mb-8">
                Você possui <span className="text-emerald-400 font-black">R$ {depositBalance.toFixed(2)}</span> de saldo de depósito disponível. Deseja assinar o plano <span className="text-indigo-400 font-black">{confirmSubModal.plan}</span> usando <span className="text-emerald-400 font-black">R$ {confirmSubModal.price.toFixed(2)}</span> do seu saldo de depósito?
              </p>

              {/* Buttons */}
              <div className="w-full space-y-3">
                <button
                  onClick={handleConfirmPurchaseWithBalance}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 py-4.5 rounded-2xl font-black text-sm tracking-wide shadow-xl shadow-emerald-500/10 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  CONFIRMAR ASSINATURA
                </button>
                
                <button
                  onClick={() => setConfirmSubModal({ isOpen: false, plan: null, price: 0 })}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 py-4 rounded-2xl font-bold text-xs tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  CANCELAR
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <DepositModal isOpen={isDepositModalOpen} onClose={() => setIsDepositModalOpen(false)} predefinedAmount={depositPredefinedAmount} predefinedPlan={depositPredefinedPlan} onSuccess={handleDepositSuccess} />
      <WithdrawModal isOpen={isWithdrawModalOpen} onClose={() => setIsWithdrawModalOpen(false)} balance={stats.balance} onSuccess={handleWithdrawSuccess} trackAppDownload={trackAppDownload} plan={stats.plan} onRedirectToPlans={() => { setIsWithdrawModalOpen(false); setActiveTab('planos'); }} />
      <BonusWithdrawModal 
        isOpen={isBonusModalOpen} 
        onClose={() => setIsBonusModalOpen(false)} 
        bonusBalance={bonusBalance} 
        invitesCount={stats.invites} 
        vipsCount={team.filter(m => m.plan !== 'Basic').length} 
        onSuccess={handleBonusWithdrawSuccess} 
      />
      <MegaBonusPopup
        isOpen={megaBonusActive && !megaBonusClaimed}
        onClose={() => {}}
        onDismiss={dismissMegaBonus}
        onClaimSuccess={claimMegaBonus}
      />
      <AnimatePresence>
        {showWelcomeModal && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            {/* Backdrop overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseWelcome}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
            />

            {/* Modal Box */}
            <motion.div 
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="relative bg-slate-900 border border-slate-800 w-full max-w-md rounded-[2.5rem] p-8 shadow-[0_30px_70px_rgba(0,0,0,0.8)] z-10 overflow-hidden flex flex-col text-center border-b-4 border-b-emerald-500"
            >
              {/* Header Icon */}
              <div className="w-20 h-20 bg-emerald-500/10 border-4 border-emerald-500/30 text-emerald-400 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-[0_0_50px_rgba(16,185,129,0.2)]">
                <Gift className="w-10 h-10 animate-bounce" />
              </div>

              {/* Title & Desc */}
              <h3 className="text-3xl font-black text-white tracking-tight mb-3">Bem-vindo ao GanheMais!</h3>
              <p className="text-slate-300 font-semibold text-xs leading-relaxed max-w-sm mx-auto mb-8">
                Parabéns por fazer parte da maior comunidade de micro-investimento e tarefas digitais do Brasil. Comece a faturar agora!
              </p>

              {/* Buttons */}
              <div className="w-full space-y-4">
                <a 
                  href="https://t.me/ReplioGanheMais" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full bg-[#0088cc] hover:bg-[#0077b5] text-white py-4.5 rounded-2xl font-black text-sm tracking-wide shadow-xl shadow-sky-500/10 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <svg className="w-5 h-5 fill-current text-white" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.11.02-1.93 1.23-5.46 3.62-.51.35-.98.53-1.39.51-.46-.01-1.35-.26-2.01-.48-.81-.27-1.46-.42-1.4-.88.03-.24.36-.49.99-.75 3.87-1.69 6.45-2.8 7.74-3.33 3.69-1.52 4.45-1.78 4.95-1.79.11 0 .36.03.52.16.14.12.18.28.19.4z"/>
                  </svg>
                  GRUPO OFICIAL GANHE MAIS
                </a>
                
                <button
                  onClick={handleCloseWelcome}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 py-4.5 rounded-2xl font-black text-sm tracking-wide shadow-xl shadow-emerald-500/10 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  ENTRAR NA PLATAFORMA
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
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
    </>
  );
};

export default Page;
