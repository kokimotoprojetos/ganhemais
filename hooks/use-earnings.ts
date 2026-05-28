'use client';

import { useState, useEffect } from 'react';
import { useUser, useClerk } from '@clerk/nextjs';
import { supabase } from '@/lib/supabase';
import { YOUTUBE_VIDEOS, PIB_TASKS } from '@/lib/tasks-data';

export interface UserStats {
  balance: number;
  totalEarned: number;
  lastCheckIn: string | null;
  tasksCompleted: number;
  invites: number;
  plan: 'Basic' | 'Silver' | 'Gold' | 'Diamond';
  completedTasks: string[];
  completedTodayCount?: number;
  lastTaskDate?: string | null;
  referralCode?: string;
  email?: string;
}

export interface TeamMember {
  email: string;
  plan: 'Basic' | 'Silver' | 'Gold' | 'Diamond';
  balance: number;
  created_at?: string;
}

export interface PendingWithdrawal {
  id: string;
  amount: number;
  date: string;
  status: 'Pendente' | 'Sucesso' | 'Recusado';
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

  const [team, setTeam] = useState<TeamMember[]>([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState<PendingWithdrawal[]>([]);
  const [depositBalance, setDepositBalance] = useState(0);
  const [bonusBalance, setBonusBalance] = useState(0);

  const { user, isLoaded, isSignedIn } = useUser();
  const { signOut } = useClerk();
  const [isSupabaseLoading, setIsSupabaseLoading] = useState(true);

  const userId = user?.id || null;
  const isLoading = !isLoaded || isSupabaseLoading;
  const inviteBonus = stats.plan === 'Diamond' ? 2.00 : (user?.publicMetadata?.invite_bonus !== undefined ? Number(user.publicMetadata.invite_bonus) : 1.00);
  const clerkAppDownloaded = user?.publicMetadata?.app_downloaded === true;
  const [appDownloaded, setAppDownloaded] = useState(false);

  useEffect(() => {
    if (clerkAppDownloaded) {
      setAppDownloaded(true);
    }
  }, [clerkAppDownloaded]);

  // Sync withdrawals when metadata updates
  useEffect(() => {
    if (!userId) return;
    const metadataWithdrawals = user?.unsafeMetadata?.withdrawals as PendingWithdrawal[] | undefined;
    if (metadataWithdrawals && Array.isArray(metadataWithdrawals)) {
      setPendingWithdrawals(metadataWithdrawals);
    }
  }, [userId, user?.unsafeMetadata?.withdrawals]);

  // Sync deposit balance when metadata updates
  useEffect(() => {
    if (!userId) return;
    const metadataDepositBalance = user?.unsafeMetadata?.deposit_balance;
    if (metadataDepositBalance !== undefined) {
      setDepositBalance(Number(metadataDepositBalance));
    } else {
      setDepositBalance(0);
    }
  }, [userId, user?.unsafeMetadata?.deposit_balance]);

  // Sync bonus balance when metadata updates
  useEffect(() => {
    if (!userId) return;
    const metadataBonusBalance = user?.unsafeMetadata?.bonus_balance;
    if (metadataBonusBalance !== undefined) {
      setBonusBalance(Number(metadataBonusBalance));
    } else {
      setBonusBalance(0);
    }
  }, [userId, user?.unsafeMetadata?.bonus_balance]);

  // Sync profile data from Supabase
  useEffect(() => {
    if (!isLoaded) return;

    let active = true;

    const syncProfile = async () => {
      if (!isSignedIn || !user) {
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
        setIsSupabaseLoading(false);
        return;
      }

      const uid = user.id;
      const userEmail = user.primaryEmailAddress?.emailAddress || '';

      try {
        // Try to fetch profile
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', uid)
          .maybeSingle();

        if (error) throw error;

        if (profile) {
          if (!active) return;

          if (typeof window !== 'undefined') {
            const metadataWithdrawals = user?.unsafeMetadata?.withdrawals as PendingWithdrawal[] | undefined;
            if (metadataWithdrawals && Array.isArray(metadataWithdrawals)) {
              setPendingWithdrawals(metadataWithdrawals);
            } else {
              const stored = localStorage.getItem('ganhemais_withdrawals_' + uid);
              if (stored) {
                try {
                  setPendingWithdrawals(JSON.parse(stored));
                } catch(e) {}
              }
            }
          }

          // Count invites and fetch team
          const { data: teamData, error: teamError } = await supabase
            .from('profiles')
            .select('email, plan, balance, created_at')
            .eq('invited_by', uid);

          const inviteCount = teamError ? 0 : (teamData?.length || 0);

          if (!teamError && teamData) {
            setTeam(teamData.map((m: any) => ({
              email: m.email || '',
              plan: (m.plan as 'Basic' | 'Silver' | 'Gold' | 'Diamond') || 'Basic',
              balance: Number(m.balance || 0),
              created_at: m.created_at || ''
            })));
          }

          setStats({
            balance: Number(profile.balance || 0),
            totalEarned: Number(profile.total_earned || 0),
            lastCheckIn: profile.last_check_in || null,
            tasksCompleted: profile.completed_tasks ? profile.completed_tasks.length : 0,
            invites: inviteCount,
            plan: (profile.plan as 'Basic' | 'Silver' | 'Gold' | 'Diamond') || 'Basic',
            completedTasks: profile.completed_tasks || [],
            completedTodayCount: profile.completed_today_count ?? 0,
            lastTaskDate: profile.last_task_date || null,
            referralCode: profile.referral_code || '',
            email: profile.email || '',
          });
        } else {
          // Profile doesn't exist, create it (New SignUp)
          if (!active) return;

          // Generate unique referral code
          const baseCode = (userEmail.split('@')[0] || 'user').toLowerCase().replace(/[^a-z0-9]/g, '');
          const uniqueSuffix = Math.random().toString(36).substring(2, 6);
          const referralCode = `${baseCode}_${uniqueSuffix}`;

          // Check if there is a pending referral in localStorage
          let invitedBy: string | null = null;
          if (typeof window !== 'undefined') {
            const pendingRef = localStorage.getItem('ganhemais_pending_ref');
            if (pendingRef) {
              const { data: inviterProfile } = await supabase
                .from('profiles')
                .select('id, balance, total_earned')
                .eq('referral_code', pendingRef)
                .maybeSingle();

              if (inviterProfile) {
                invitedBy = inviterProfile.id;
                // Credit R$ 1,00 to the inviter
                const newInviterBalance = Number(inviterProfile.balance || 0) + 1.00;
                const newInviterTotal = Number(inviterProfile.total_earned || 0) + 1.00;
                await supabase
                  .from('profiles')
                  .update({
                    balance: newInviterBalance,
                    total_earned: newInviterTotal
                  })
                  .eq('id', inviterProfile.id);
              }
            }
          }

          // Insert new profile
          const newProfile = {
            id: uid,
            email: userEmail,
            balance: invitedBy ? 3.00 : 0.00,
            total_earned: invitedBy ? 3.00 : 0.00,
            plan: 'Basic',
            invited_by: invitedBy,
            referral_code: referralCode,
            completed_tasks: [],
            completed_today_count: 0,
            last_task_date: null,
            last_check_in: null
          };

          const { error: insertError } = await supabase
            .from('profiles')
            .insert(newProfile);

          if (insertError) throw insertError;

          // Clean up pending referral code
          if (typeof window !== 'undefined') {
            localStorage.removeItem('ganhemais_pending_ref');
          }

          if (active) {
            setStats({
              balance: invitedBy ? 3.00 : 0.00,
              totalEarned: invitedBy ? 3.00 : 0.00,
              lastCheckIn: null,
              tasksCompleted: 0,
              invites: 0,
              plan: 'Basic',
              completedTasks: [],
              completedTodayCount: 0,
              lastTaskDate: null,
              referralCode,
              email: userEmail,
            });
          }
        }
      } catch (err) {
        console.error('Error syncing/fetching Supabase profile:', err);
      } finally {
        if (active) {
          setIsSupabaseLoading(false);
        }
      }
    };

    syncProfile();

    return () => {
      active = false;
    };
  }, [isLoaded, isSignedIn, user]);


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
    const newBalance = stats.balance + reward;
    const newTotalEarned = stats.totalEarned + reward;

    setStats(prev => ({
      ...prev,
      balance: newBalance,
      totalEarned: newTotalEarned,
      tasksCompleted: prev.tasksCompleted + 1,
      completedTasks: nextCompletedTasks,
      completedTodayCount: nextCompletedTodayCount,
      lastTaskDate: today,
    }));

    await updateProfileFields({
      balance: newBalance,
      total_earned: newTotalEarned,
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
    const newBalance = stats.balance + inviteBonus;
    const newTotal = stats.totalEarned + inviteBonus;
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

    // Simulate adding a team member to local state
    const simulatedEmail = `convidado_simulado${newInvites}@exemplo.com`;
    const plans: ('Basic' | 'Silver' | 'Gold')[] = ['Basic', 'Silver', 'Gold'];
    const randomPlan = plans[Math.floor(Math.random() * plans.length)];
    
    setTeam(prev => [
      ...prev,
      {
        email: simulatedEmail,
        plan: randomPlan,
        balance: randomPlan === 'Basic' ? 0.00 : randomPlan === 'Silver' ? 29.90 : 97.00,
        created_at: new Date().toISOString()
      }
    ]);
  };

  const withdrawBonus = async (amount: number) => {
    if (!userId || !user) return false;
    if (bonusBalance < amount) return false;

    const newBonusBalance = Number((bonusBalance - amount).toFixed(2));

    setBonusBalance(newBonusBalance);

    const newWithdrawal: PendingWithdrawal = {
      id: Math.random().toString(36).substring(2, 9),
      amount,
      date: new Date().toISOString(),
      status: 'Pendente'
    };

    const currentWithdrawals = (user.unsafeMetadata?.withdrawals as PendingWithdrawal[] || []);
    const updated = [newWithdrawal, ...currentWithdrawals];

    setPendingWithdrawals(updated);

    if (typeof window !== 'undefined') {
      localStorage.setItem('ganhemais_withdrawals_' + userId, JSON.stringify(updated));
    }

    try {
      await user.update({
        unsafeMetadata: {
          ...user.unsafeMetadata,
          withdrawals: updated,
          bonus_balance: newBonusBalance
        }
      });
    } catch (err) {
      console.error("Failed to update Clerk metadata with bonus withdrawal:", err);
    }

    return true;
  };

  const withdraw = async (amount: number) => {
    if (!userId || !user) return false;
    if (stats.balance < amount) return false;

    const newBalance = stats.balance - amount;

    setStats(prev => ({
      ...prev,
      balance: newBalance,
    }));

    await updateProfileFields({
      balance: newBalance,
    });

    const newWithdrawal: PendingWithdrawal = {
      id: Math.random().toString(36).substring(2, 9),
      amount,
      date: new Date().toISOString(),
      status: 'Pendente'
    };

    const currentWithdrawals = (user.unsafeMetadata?.withdrawals as PendingWithdrawal[] || []);
    const updated = [newWithdrawal, ...currentWithdrawals];

    setPendingWithdrawals(updated);

    if (typeof window !== 'undefined') {
      localStorage.setItem('ganhemais_withdrawals_' + userId, JSON.stringify(updated));
    }

    try {
      await user.update({
        unsafeMetadata: {
          ...user.unsafeMetadata,
          withdrawals: updated
        }
      });
    } catch (err) {
      console.error("Failed to update Clerk metadata with withdrawal:", err);
    }

    return true;
  };

  const upgradePlan = async (plan: 'Silver' | 'Gold' | 'Diamond') => {
    if (!userId) return;

    setStats(prev => ({
      ...prev,
      plan,
    }));

    await updateProfileFields({
      plan,
    });
  };

  const purchasePlanWithBalance = async (plan: 'Silver' | 'Gold' | 'Diamond', price: number) => {
    if (!userId || !user) return false;
    if (depositBalance < price) return false;

    const newBalance = Number((stats.balance - price).toFixed(2));
    const newDepositBalance = Number((depositBalance - price).toFixed(2));

    setStats(prev => ({
      ...prev,
      balance: newBalance,
      plan,
    }));
    setDepositBalance(newDepositBalance);

    await updateProfileFields({
      balance: newBalance,
      plan,
    });

    try {
      await user.update({
        unsafeMetadata: {
          ...user.unsafeMetadata,
          deposit_balance: newDepositBalance
        }
      });
    } catch (err) {
      console.error("Failed to update Clerk metadata with plan purchase:", err);
    }

    return true;
  };

  const deposit = async (amount: number) => {
    if (!userId || !user) return false;
    const newBalance = stats.balance + amount;
    const newDepositBalance = depositBalance + amount;

    // Check first deposit bonus
    const firstDepositBonusReceived = user.unsafeMetadata?.first_deposit_bonus_received === true;
    let nextBonusBalance = bonusBalance;
    if (!firstDepositBonusReceived) {
      nextBonusBalance = bonusBalance + 20.00;
      setBonusBalance(nextBonusBalance);
    }

    setStats(prev => ({
      ...prev,
      balance: newBalance,
    }));
    setDepositBalance(newDepositBalance);

    await updateProfileFields({
      balance: newBalance,
    });

    try {
      await user.update({
        unsafeMetadata: {
          ...user.unsafeMetadata,
          deposit_balance: newDepositBalance,
          bonus_balance: nextBonusBalance,
          first_deposit_bonus_received: true
        }
      });
    } catch (err) {
      console.error("Failed to update Clerk metadata with deposit:", err);
    }

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
    await signOut();
  };

  const trackAppDownload = async () => {
    if (!userId) return;
    setAppDownloaded(true);
    try {
      await fetch('/api/user/track-download', {
        method: 'POST',
      });
    } catch (e) {
      console.error('Failed to track download', e);
    }
  };

  return {
    stats,
    team,
    pendingWithdrawals,
    addEarning,
    completeTask,
    dailyCheckIn,
    canCheckIn,
    inviteUser,
    withdraw,
    withdrawBonus,
    upgradePlan,
    purchasePlanWithBalance,
    deposit,
    depositBalance,
    bonusBalance,
    inviteBonus,
    isLoading,
    appDownloaded,
    trackAppDownload,
    isAuthenticated: !!userId,
    logout,
  };
}
