'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Clock, ArrowRight } from 'lucide-react';
import { useUser } from '@clerk/nextjs';

interface NoPlanBonusAlertProps {
  plan: string;
  onRedeem: () => void;
}

export function NoPlanBonusAlert({ plan, onRedeem }: NoPlanBonusAlertProps) {
  const { user, isLoaded } = useUser();
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

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

    return () => clearInterval(interval);
  }, [isLoaded, user, plan]);

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

  return (
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
  );
}
