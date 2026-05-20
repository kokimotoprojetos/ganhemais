'use client';

import { useState, useEffect } from 'react';

export interface UserStats {
  balance: number;
  totalEarned: number;
  lastCheckIn: string | null;
  tasksCompleted: number;
  invites: number;
  plan: 'Basic' | 'Silver' | 'Gold';
}

export function useEarnings() {
  const [stats, setStats] = useState<UserStats>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ganhemais_stats');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error('Failed to load stats', e);
        }
      }
    }
    return {
      balance: 0,
      totalEarned: 0,
      lastCheckIn: null,
      tasksCompleted: 0,
      invites: 0,
      plan: 'Basic',
    };
  });

  const [isLoading, setIsLoading] = useState(true);

  // Load stats from localStorage - Hydration handle
  useEffect(() => {
    setIsLoading(false);
  }, []);

  // Save stats to localStorage
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('ganhemais_stats', JSON.stringify(stats));
    }
  }, [stats, isLoading]);

  const addEarning = (amount: number) => {
    setStats(prev => ({
      ...prev,
      balance: prev.balance + amount,
      totalEarned: prev.totalEarned + amount,
      tasksCompleted: prev.tasksCompleted + 1,
    }));
  };

  const inviteUser = () => {
    setStats(prev => ({
      ...prev,
      balance: prev.balance + 2.0,
      totalEarned: prev.totalEarned + 2.0,
      invites: prev.invites + 1,
    }));
  };

  const withdraw = (amount: number) => {
    if (stats.balance < amount) return false;
    setStats(prev => ({
      ...prev,
      balance: prev.balance - amount,
    }));
    return true;
  };

  const upgradePlan = (plan: 'Silver' | 'Gold') => {
    setStats(prev => ({
      ...prev,
      plan,
    }));
  };

  const dailyCheckIn = () => {
    const today = new Date().toDateString();
    if (stats.lastCheckIn === today) return false;

    setStats(prev => ({
      ...prev,
      balance: prev.balance + 2.0,
      totalEarned: prev.totalEarned + 2.0,
      lastCheckIn: today,
    }));
    return true;
  };

  const canCheckIn = () => {
    const today = new Date().toDateString();
    return stats.lastCheckIn !== today;
  };

  return {
    stats,
    addEarning,
    dailyCheckIn,
    canCheckIn,
    inviteUser,
    withdraw,
    upgradePlan,
    isLoading
  };
}
