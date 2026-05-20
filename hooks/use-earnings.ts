'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
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
  referralCode?: string;
  email?: string;
}

export function useEarnings() {
  const [stats, setStats] = useState<UserStats>({
    balance: 0,
    totalEarned: 0,
    lastCheckIn: null,
    tasksCompleted: 0,
    invites: 0,
    plan: 'Basic',
    completedTasks: [],
    completedTodayCount: 0,
    lastTaskDate: null,
    referralCode: '',
    email: '',
  });

  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Sync profile data from Supabase
  const fetchProfile = useCallback(async (uid: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .single();

      if (error) throw error;

      if (profile) {
        // Count invites by searching profiles table
        const { count, error: inviteError } = await supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('invited_by', uid);

        const inviteCount = inviteError ? 0 : (count || 0);

        setStats({
          balance: Number(profile.balance || 0),
          totalEarned: Number(profile.total_earned || 0),
          lastCheckIn: profile.last_check_in || null,
          tasksCompleted: profile.completed_tasks ? profile.completed_tasks.length : 0,
          invites: inviteCount,
          plan: (profile.plan as 'Basic' | 'Silver' | 'Gold') || 'Basic',
          completedTasks: profile.completed_tasks || [],
          completedTodayCount: profile.completed_today_count ?? 0,
          lastTaskDate: profile.last_task_date || null,
          referralCode: profile.referral_code || '',
          email: profile.email || '',
        });
      }
    } catch (err) {
      console.error('Error fetching Supabase profile:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Listen to Auth State Changes
  useEffect(() => {
    let active = true;

    const setupAuth = async () => {
      // 1. Get current session
      const { data: { session } } = await supabase.auth.getSession();
      if (active) {
        if (session?.user) {
          setUserId(session.user.id);
          fetchProfile(session.user.id);
        } else {
          setUserId(null);
          setIsLoading(false);
        }
      }

      // 2. Setup listener
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (_event, session) => {
          if (active) {
            if (session?.user) {
              setUserId(session.user.id);
              fetchProfile(session.user.id);
            } else {
              setUserId(null);
              setStats({
                balance: 0,
                totalEarned: 0,
                lastCheckIn: null,
                tasksCompleted: 0,
                invites: 0,
                plan: 'Basic',
                completedTasks: [],
                completedTodayCount: 0,
                lastTaskDate: null,
                referralCode: '',
                email: '',
              });
              setIsLoading(false);
            }
          }
        }
      );

      return () => {
        subscription.unsubscribe();
      };
    };

    const cleanAuth = setupAuth();

    return () => {
      active = false;
      cleanAuth.then(unsub => unsub && typeof unsub === 'function' && unsub());
    };
  }, [fetchProfile]);

  // General profile update helper
  const updateProfileFields = async (fields: Record<string, any>) => {
    if (!userId) return false;
    try {
      const { error } = await supabase
        .from('profiles')
        .update(fields)
        .eq('id', userId);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Failed to update Supabase profile fields:', err);
      return false;
    }
  };

  const addEarning = async (amount: number) => {
    if (!userId) return false;
    const newBalance = stats.balance + amount;
    const newTotal = stats.totalEarned + amount;
    const newTasksCount = stats.tasksCompleted + 1;

    setStats(prev => ({
      ...prev,
      balance: newBalance,
      totalEarned: newTotal,
      tasksCompleted: newTasksCount,
    }));

    await updateProfileFields({
      balance: newBalance,
      total_earned: newTotal,
    });
  };

  const completeTask = async (taskId: string, reward: number) => {
    if (!userId) return false;
    if (stats.completedTasks.includes(taskId)) return false;

    // Day restriction validation
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

    const nextCompletedTasks = [...stats.completedTasks, taskId];
    const nextCompletedTodayCount = currentCompletedToday + 1;

    setStats(prev => ({
      ...prev,
      balance: prev.balance + reward,
      totalEarned: prev.totalEarned + reward,
      tasksCompleted: prev.tasksCompleted + 1,
      completedTasks: nextCompletedTasks,
      completedTodayCount: nextCompletedTodayCount,
      lastTaskDate: today,
    }));

    await updateProfileFields({
      balance: stats.balance + reward,
      total_earned: stats.totalEarned + reward,
      completed_tasks: nextCompletedTasks,
      completed_today_count: nextCompletedTodayCount,
      last_task_date: today,
    });

    return true;
  };

  const inviteUser = async () => {
    // Legacy simulator. In Supabase, new user creates dynamic referral link bonuses.
    // But keeping it as client-side simulator if they click the test button in dev mode.
    if (!userId) return;
    const newBalance = stats.balance + 2.0;
    const newTotal = stats.totalEarned + 2.0;
    const newInvites = stats.invites + 1;

    setStats(prev => ({
      ...prev,
      balance: newBalance,
      totalEarned: newTotal,
      invites: newInvites,
    }));

    await updateProfileFields({
      balance: newBalance,
      total_earned: newTotal,
    });
  };

  const withdraw = async (amount: number) => {
    if (!userId) return false;
    if (stats.balance < amount) return false;

    const newBalance = stats.balance - amount;

    setStats(prev => ({
      ...prev,
      balance: newBalance,
    }));

    await updateProfileFields({
      balance: newBalance,
    });

    return true;
  };

  const upgradePlan = async (plan: 'Silver' | 'Gold') => {
    if (!userId) return;

    setStats(prev => ({
      ...prev,
      plan,
    }));

    await updateProfileFields({
      plan,
    });
  };

  const deposit = async (amount: number) => {
    if (!userId) return false;
    const newBalance = stats.balance + amount;

    setStats(prev => ({
      ...prev,
      balance: newBalance,
    }));

    await updateProfileFields({
      balance: newBalance,
    });

    return true;
  };

  const dailyCheckIn = async () => {
    if (!userId) return false;
    const today = new Date().toDateString();
    if (stats.lastCheckIn === today) return false;

    const reward = stats.plan === 'Basic' ? 2.00 : stats.plan === 'Silver' ? 5.00 : 10.00; // Plan dynamic check-in reward
    const newBalance = stats.balance + reward;
    const newTotal = stats.totalEarned + reward;

    setStats(prev => ({
      ...prev,
      balance: newBalance,
      totalEarned: newTotal,
      lastCheckIn: today,
    }));

    await updateProfileFields({
      balance: newBalance,
      total_earned: newTotal,
      last_check_in: today,
    });

    return true;
  };

  const canCheckIn = () => {
    const today = new Date().toDateString();
    return stats.lastCheckIn !== today;
  };

  const logout = async () => {
    await supabase.auth.signOut();
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
    isLoading,
    isAuthenticated: !!userId,
    logout,
  };
}
