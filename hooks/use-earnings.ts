'use client';

import { useState, useEffect } from 'react';
import { YOUTUBE_VIDEOS, PIB_TASKS } from '@/lib/tasks-data';

export interface UserStats {
  balance: number;
  totalEarned: number;
  lastCheckIn: string | null;
  tasksCompleted: number;
  invites: number;
  plan: 'Basic' | 'Silver' | 'Gold';
  completedTasks: string[];
  completedTodayCount?: number;
  lastTaskDate?: string | null;
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
      completedTodayCount: 0,
      lastTaskDate: null,
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
            completedTodayCount: parsed.completedTodayCount ?? 0,
            lastTaskDate: parsed.lastTaskDate || null,
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

    // Sequential day check
    const videoTask = YOUTUBE_VIDEOS.find(v => v.id === taskId);
    const pibTask = PIB_TASKS.find(p => p.id === taskId);
    const taskDay = videoTask ? videoTask.day : pibTask ? pibTask.day : 1;

    const isDayUnlocked = (dayNum: number): boolean => {
      if (dayNum === 1) return true;
      for (let d = 1; d < dayNum; d++) {
        const dayVideos = YOUTUBE_VIDEOS.filter(v => v.day === d);
        const dayPib = PIB_TASKS.find(p => p.day === d);
        const allVideosCompleted = dayVideos.every(v => stats.completedTasks.includes(v.id));
        const pibCompleted = dayPib ? stats.completedTasks.includes(dayPib.id) : true;
        if (!allVideosCompleted || !pibCompleted) return false;
      }
      return true;
    };

    if (!isDayUnlocked(taskDay)) return false;

    const today = new Date().toDateString();
    const isNewDay = stats.lastTaskDate !== today;
    const currentCompletedToday = isNewDay ? 0 : (stats.completedTodayCount || 0);

    if (stats.plan === 'Basic' && currentCompletedToday >= 5) return false;
    if (stats.plan === 'Silver' && currentCompletedToday >= 15) return false;

    setStats(prev => {
      const isNewDayPrev = prev.lastTaskDate !== today;
      const count = isNewDayPrev ? 1 : (prev.completedTodayCount || 0) + 1;
      return {
        ...prev,
        balance: prev.balance + reward,
        totalEarned: prev.totalEarned + reward,
        tasksCompleted: prev.tasksCompleted + 1,
        completedTasks: [...prev.completedTasks, taskId],
        completedTodayCount: count,
        lastTaskDate: today,
      };
    });
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

  const deposit = (amount: number) => {
    setStats(prev => ({
      ...prev,
      balance: prev.balance + amount,
    }));
    return true;
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
    deposit,
    isLoading
  };
}
