'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Clock, ArrowRight, X, Trophy } from 'lucide-react';
import { useUser } from '@clerk/nextjs';

interface NoPlanBonusAlertProps {
  plan: string;
  onRedeem: () => void;
}

export function NoPlanBonusAlert({ plan, onRedeem }: NoPlanBonusAlertProps) {
  const { user, isLoaded } = useUser();
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [confetti, setConfetti] = useState<{ id: number; x: number; color: string; delay: number; duration: number; size: number; shape: string }[]>([]);

  useEffect(() => {
    if (!isLoaded || !user || plan !== 'Basic') {
      return;
    }

    const metadataTime = user.unsafeMetadata?.first_seen_first_deposit_bonus_at;
    const localKey = `first_seen_first_deposit_bonus_at_${user.id}`;
    let startTime = Number(metadataTime);

    if (!metadataTime) {
      const stored = localStorage.getItem(localKey);
      if (stored) {
        startTime = Number(stored);
      } else {
        const now = Date.now();
        startTime = now;
        localStorage.setItem(localKey, now.toString());
        // Attempt to sync to clerk metadata asynchronously
        user.update({
          unsafeMetadata: {
            ...user.unsafeMetadata,
            first_seen_first_deposit_bonus_at: now,
          },
        }).catch((err) => console.error('Failed to sync metadata:', err));
      }
    } else {
      // Sync to localStorage just in case
      localStorage.setItem(localKey, startTime.toString());
    }

    const duration = 72 * 60 * 60 * 1000; // 72 hours in ms
    const endTime = startTime + duration;

    const updateTimer = () => {
      const remaining = endTime - Date.now();
      if (remaining <= 0) {
        setTimeLeft(0);
      } else {
        setTimeLeft(Math.floor(remaining / 1000));
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    // Show modal once per session when entering account
    const sessionKey = `first_deposit_bonus_modal_shown_${user.id}`;
    const modalShownInSession = sessionStorage.getItem(sessionKey);
    if (!modalShownInSession && (endTime - Date.now() > 0)) {
      setShowModal(true);
      sessionStorage.setItem(sessionKey, 'true');
    }

    return () => clearInterval(interval);
  }, [isLoaded, user, plan]);

  // Generate confetti particles when modal opens
  useEffect(() => {
    if (showModal) {
      const colors = ['#F59E0B', '#10B981', '#3B82F6', '#EF4444', '#EC4899', '#8B5CF6', '#F472B6', '#6EE7B7'];
      const shapes = ['circle', 'square', 'triangle'];
      const particles = Array.from({ length: 120 }).map((_, i) => ({
        id: i,
        x: Math.random() * 100, // left percentage
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 4, // delay in seconds
        duration: 3 + Math.random() * 3, // duration of fall in seconds
        size: 6 + Math.random() * 10, // size in pixels
        shape: shapes[Math.floor(Math.random() * shapes.length)]
      }));
      setConfetti(particles);
    } else {
      setConfetti([]);
    }
  }, [showModal]);

  // Don't show if user has plan, or metadata isn't loaded, or time has expired
  if (plan !== 'Basic' || timeLeft === null || timeLeft <= 0) {
    return null;
  }

  // Format time: HH:MM:SS
  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRedeemClick = () => {
    setShowModal(false);
    onRedeem();
  };

  return (
    <>
      {/* Styles for confetti animation */}
      <style>{`
        @keyframes fall {
          0% {
            transform: translateY(-20px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(105vh) rotate(720deg);
            opacity: 0;
          }
        }
        .confetti-particle {
          position: fixed;
          top: -20px;
          z-index: 200;
          pointer-events: none;
          animation: fall linear forwards;
        }
        .confetti-circle { border-radius: 50%; }
        .confetti-square { border-radius: 2px; }
        .confetti-triangle {
          width: 0 !important;
          height: 0 !important;
          background: transparent !important;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
        }
      `}</style>

      {/* Confetti Particles container */}
      <AnimatePresence>
        {showModal && confetti.map((p) => (
          <div
            key={p.id}
            className={`confetti-particle confetti-${p.shape}`}
            style={{
              left: `${p.x}%`,
              backgroundColor: p.shape !== 'triangle' ? p.color : undefined,
              borderBottomColor: p.shape === 'triangle' ? p.color : undefined,
              borderBottomWidth: p.shape === 'triangle' ? `${p.size}px` : undefined,
              width: p.shape !== 'triangle' ? `${p.size}px` : undefined,
              height: p.shape !== 'triangle' ? `${p.size}px` : undefined,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`
            }}
          />
        ))}
      </AnimatePresence>

      {/* Full-Screen Confetti Modal Popup */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
            />

            {/* Modal Content Box */}
            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="relative w-full max-w-lg bg-slate-900 border border-yellow-500/30 rounded-[2.5rem] p-6 sm:p-8 shadow-[0_20px_50px_rgba(234,179,8,0.15)] text-center overflow-hidden z-10"
            >
              {/* Decorative radial glows */}
              <div className="absolute -right-20 -top-20 w-60 h-60 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -left-20 -bottom-20 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* Close Button */}
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-5 right-5 p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Icon / Trophy */}
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-[2rem] flex items-center justify-center mb-6 shadow-xl shadow-yellow-500/20 animate-bounce">
                <Trophy className="w-10 h-10 text-slate-950" />
              </div>

              {/* Badge */}
              <span className="bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 text-xs font-black px-3.5 py-1 rounded-full uppercase tracking-wider">
                Sorteio Especial • Oferta Limitada
              </span>

              {/* Headline */}
              <h3 className="text-xl sm:text-2xl font-black text-slate-100 mt-5 leading-tight">
                Parabéns! Você foi uma das contas sorteadas! 🎉
              </h3>

              {/* Body */}
              <p className="text-slate-300 text-sm mt-3.5 font-medium leading-relaxed">
                Você ganhou a chance exclusiva de ativar o{' '}
                <strong className="text-yellow-400 font-black">Mega Bônus de Primeiro Depósito</strong>.<br />
                Faça o seu primeiro depósito agora e ganhe automaticamente{' '}
                <span className="text-yellow-400 font-black underline decoration-2 decoration-yellow-400">
                  R$ 50,00 de bônus extra
                </span>{' '}
                em sua carteira!
              </p>

              {/* Timer inside Modal */}
              <div className="mt-6 inline-flex items-center gap-2 bg-slate-950 border border-slate-800/80 px-4 py-2.5 rounded-2xl">
                <Clock className="w-4 h-4 text-yellow-400 animate-pulse" />
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Expira em:</span>
                <span className="text-sm font-black text-yellow-400 tracking-wider font-mono">
                  {formatTime(timeLeft)}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8">
                <button
                  onClick={handleRedeemClick}
                  className="w-full py-4 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-slate-950 font-black text-sm uppercase tracking-wider rounded-2xl shadow-lg shadow-yellow-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  Resgatar Bônus
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm rounded-2xl transition-all cursor-pointer"
                >
                  Ver Painel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Persistent top banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full mb-6 relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 p-0.5 shadow-xl shadow-yellow-500/10"
      >
        <div className="bg-slate-950/90 backdrop-blur-md rounded-[22px] p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Decorative ambient background glow */}
          <div className="absolute -left-10 -top-10 w-40 h-40 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Content Group */}
          <div className="flex items-center gap-4.5 z-10 w-full md:w-auto">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shrink-0 shadow-lg shadow-yellow-500/20">
              <Sparkles className="w-6 h-6 text-slate-950 animate-pulse" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Sorteio Especial
                </span>
                <span className="text-[10px] text-slate-400 font-bold">
                  Oferta Limitada
                </span>
              </div>
              <p className="text-slate-100 text-sm font-bold leading-snug max-w-xl">
                Parabéns! Você foi uma das contas sorteadas a ganhar um{' '}
                <strong className="text-yellow-400 font-black">Mega Bônus</strong> de primeiro depósito:{' '}
                <span className="underline decoration-yellow-400 decoration-2">
                  ganhe R$ 50,00 de bônus
                </span>{' '}
                no seu primeiro depósito!
              </p>
            </div>
          </div>

          {/* Timer and Action Group */}
          <div className="flex items-center justify-between md:justify-end gap-4.5 w-full md:w-auto border-t md:border-t-0 border-slate-800 pt-3 md:pt-0 z-10">
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3.5 py-2 rounded-2xl">
              <Clock className="w-4 h-4 text-yellow-400 animate-spin" style={{ animationDuration: '6s' }} />
              <div className="flex flex-col">
                <span className="text-[8px] text-slate-500 font-black uppercase tracking-wider leading-none mb-0.5">Expira em</span>
                <span className="text-sm font-black text-slate-100 tracking-wider font-mono">
                  {formatTime(timeLeft)}
                </span>
              </div>
            </div>

            <button
              onClick={onRedeem}
              className="flex items-center gap-1.5 px-5 py-3 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-yellow-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              Resgatar Bônus
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
