'use client';

import { useState, useEffect } from 'react';

export interface UserStats {
  balance: number;
  totalEarned: number;
  lastCheckIn: string | null;
  tasksCompleted: number;
  invites: number;
  plan: 'Basic' | 'Silver' | 'Gold';
  completedTasks: string[];
}

export function useEarnings() {
  const [stats, setStats] = useState<UserStats>(() => {
    const defaultStats: UserStats = {
      balance: 0,
      totalEarned: 0,
      lastCheckIn: null,
      tasksCompleted: 0,
      invites: 0,
      plan: 'Basic',
      completedTasks: [],
    };

    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ganhemais_stats');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return {
            ...defaultStats,
            ...parsed,
            completedTasks: parsed.completedTasks || [],
          };
        } catch (e) {
          console.error('Failed to load stats', e);
        }
      }
    }
    return defaultStats;
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

  const completeTask = (taskId: string, reward: number) => {
    if (stats.completedTasks.includes(taskId)) return false;
    setStats(prev => ({
      ...prev,
      balance: prev.balance + reward,
      totalEarned: prev.totalEarned + reward,
      tasksCompleted: prev.tasksCompleted + 1,
      completedTasks: [...prev.completedTasks, taskId],
    }));
    return true;
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
    completeTask,
    dailyCheckIn,
    canCheckIn,
    inviteUser,
    withdraw,
    upgradePlan,
    isLoading
  };
}
