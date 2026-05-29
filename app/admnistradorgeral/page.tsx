'use client';

import { useState, useEffect, Fragment } from 'react';
import { motion } from 'motion/react';
import { Check, Edit2, LogOut, RefreshCw, Save, ShieldAlert, Smartphone, Users, X, Star, Crown, ChevronDown, ChevronUp, History, Plus, Trash2, Calendar, Clock, Sparkles, Zap } from 'lucide-react';

interface UserData {
  id: string;
  email: string;
  balance: number;
  total_earned: number;
  invite_bonus: number;
  app_downloaded: boolean;
  app_download_clicks: number;
  plan: string;
  is_online: boolean;
  last_active_at: number;
  invites: number;
  withdrawals?: any[];
  deposit_balance: number;
  bonus_balance: number;
  mega_bonus_active?: boolean;
  mega_bonus_claimed?: boolean;
}

const ADMIN_TOKEN = 'admin_replio_2026_secreto';

// Helper to format ISO date to YYYY-MM-DDTHH:MM local format
const getLocalDateTimeString = (d: Date = new Date()) => {
  const pad = (num: number) => {
    const norm = Math.abs(Math.floor(num));
    return (norm < 10 ? '0' : '') + norm;
  };
  return d.getFullYear() +
    '-' + pad(d.getMonth() + 1) +
    '-' + pad(d.getDate()) +
    'T' + pad(d.getHours()) +
    ':' + pad(d.getMinutes());
};

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlyVips, setShowOnlyVips] = useState(false);
  const [activeTab, setActiveTab] = useState<'usuarios' | 'saques'>('usuarios');

  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [newWithdrawalForm, setNewWithdrawalForm] = useState<{ amount: string; date: string; status: 'Sucesso' | 'Pendente' | 'Recusado' }>({
    amount: '',
    date: getLocalDateTimeString(),
    status: 'Sucesso'
  });
  
  const [editingWithdrawalId, setEditingWithdrawalId] = useState<string | null>(null);
  const [editWithdrawalForm, setEditWithdrawalForm] = useState<{ amount: string; date: string; status: 'Sucesso' | 'Pendente' | 'Recusado' }>({
    amount: '',
    date: '',
    status: 'Sucesso'
  });

  const handleAddWithdrawal = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const amount = Number(newWithdrawalForm.amount);
    if (isNaN(amount) || amount <= 0) {
      alert("Por favor, digite um valor de saque válido.");
      return;
    }

    const date = newWithdrawalForm.date ? new Date(newWithdrawalForm.date).toISOString() : new Date().toISOString();

    const newWithdrawal = {
      id: Math.random().toString(36).substring(2, 9),
      amount,
      date,
      status: newWithdrawalForm.status
    };

    const currentWithdrawals = user.withdrawals || [];
    const updated = [newWithdrawal, ...currentWithdrawals];

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ADMIN_TOKEN}`
        },
        body: JSON.stringify({
          id: userId,
          withdrawals: updated
        })
      });
      if (!res.ok) throw new Error('Falha ao adicionar saque');
      
      setNewWithdrawalForm({ amount: '', date: getLocalDateTimeString(), status: 'Sucesso' });
      fetchUsers(); // Refresh data
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteWithdrawal = async (userId: string, withdrawalId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    if (!window.confirm("Tem certeza que deseja excluir este saque?")) return;

    const updated = (user.withdrawals || []).filter((w: any) => w.id !== withdrawalId);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ADMIN_TOKEN}`
        },
        body: JSON.stringify({
          id: userId,
          withdrawals: updated
        })
      });
      if (!res.ok) throw new Error('Falha ao excluir saque');
      fetchUsers(); // Refresh data
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleStartEditWithdrawal = (w: any) => {
    setEditingWithdrawalId(w.id);
    setEditWithdrawalForm({
      amount: w.amount.toString(),
      date: getLocalDateTimeString(new Date(w.date)),
      status: w.status
    });
  };

  const handleSaveWithdrawal = async (userId: string, withdrawalId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const amount = Number(editWithdrawalForm.amount);
    if (isNaN(amount) || amount <= 0) {
      alert("Por favor, digite um valor de saque válido.");
      return;
    }

    const date = editWithdrawalForm.date ? new Date(editWithdrawalForm.date).toISOString() : new Date().toISOString();

    const updated = (user.withdrawals || []).map((w: any) => {
      if (w.id === withdrawalId) {
        return { ...w, amount, date, status: editWithdrawalForm.status };
      }
      return w;
    });

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ADMIN_TOKEN}`
        },
        body: JSON.stringify({
          id: userId,
          withdrawals: updated
        })
      });
      if (!res.ok) throw new Error('Falha ao atualizar saque');
      setEditingWithdrawalId(null);
      fetchUsers(); // Refresh data
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleStatusUpdate = async (userId: string, withdrawalId: string, newStatus: 'Sucesso' | 'Recusado') => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const updated = (user.withdrawals || []).map((w: any) => {
      if (w.id === withdrawalId) {
        return { ...w, status: newStatus };
      }
      return w;
    });

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ADMIN_TOKEN}`
        },
        body: JSON.stringify({
          id: userId,
          withdrawals: updated
        })
      });
      if (!res.ok) throw new Error('Falha ao atualizar status do saque');
      
      // Update local state directly
      setUsers(prev => prev.map(u => {
        if (u.id === userId) {
          return { ...u, withdrawals: updated };
        }
        return u;
      }));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleToggleMegaBonus = async (userId: string, nextActive: boolean, nextClaimed: boolean) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ADMIN_TOKEN}`
        },
        body: JSON.stringify({
          id: userId,
          mega_bonus_active: nextActive,
          mega_bonus_claimed: nextClaimed
        })
      });
      if (!res.ok) throw new Error('Falha ao atualizar status do Mega Bônus');
      
      // Update local state directly
      setUsers(prev => prev.map(u => {
        if (u.id === userId) {
          return { ...u, mega_bonus_active: nextActive, mega_bonus_claimed: nextClaimed };
        }
        return u;
      }));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const paidUsers = users.filter(user => user.plan !== 'Basic');

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchQuery.toLowerCase());
    if (showOnlyVips) {
      return user.plan !== 'Basic' && matchesSearch;
    }
    return matchesSearch;
  });

  const pendingWithdrawalList = users.flatMap(user => 
    (user.withdrawals || [])
      .filter((w: any) => w.status === 'Pendente')
      .map((w: any) => ({
        ...w,
        userId: user.id,
        userEmail: user.email,
        userPlan: user.plan
      }))
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ balance: string; deposit_balance: string; bonus_balance: string; invite_bonus: string; app_downloaded: boolean; plan: string; mega_bonus_active: boolean; mega_bonus_claimed: boolean }>({
    balance: '0',
    deposit_balance: '0',
    bonus_balance: '0',
    invite_bonus: '0.50',
    app_downloaded: false,
    plan: 'Basic',
    mega_bonus_active: false,
    mega_bonus_claimed: false
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'admin' && password === 'SegredoReplio2026!') {
      setIsAuthenticated(true);
      setError('');
      fetchUsers();
    } else {
      setError('Credenciais inválidas.');
    }
  };

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`
        }
      });
      if (!res.ok) throw new Error('Falha ao carregar usuários');
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (user: UserData) => {
    setEditingId(user.id);
    setEditForm({
      balance: user.balance.toString(),
      deposit_balance: (user.deposit_balance || 0).toString(),
      bonus_balance: (user.bonus_balance || 0).toString(),
      invite_bonus: user.invite_bonus.toString(),
      app_downloaded: user.app_downloaded,
      plan: user.plan,
      mega_bonus_active: user.mega_bonus_active === true,
      mega_bonus_claimed: user.mega_bonus_claimed === true
    });
  };

  const handleSave = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    let finalBalance = Number(editForm.balance);
    const planChanged = editForm.plan !== user.plan;
    let finalDepositBalance = Number(editForm.deposit_balance);

    if (planChanged) {
      if (editForm.plan === 'Silver') {
        if (finalBalance < 39.90) {
          alert('Saldo insuficiente! Para ativar o plano Silver, o usuário precisa ter no mínimo R$ 39,90 de saldo em conta.');
          return;
        }
        finalBalance = Number((finalBalance - 39.90).toFixed(2));
        finalDepositBalance = Math.max(0, finalDepositBalance - 39.90);
      } else if (editForm.plan === 'Gold') {
        if (finalBalance < 97.00) {
          alert('Saldo insuficiente! Para ativar o plano Gold, o usuário precisa ter no mínimo R$ 97,00 de saldo em conta.');
          return;
        }
        finalBalance = Number((finalBalance - 97.00).toFixed(2));
        finalDepositBalance = Math.max(0, finalDepositBalance - 97.00);
      } else if (editForm.plan === 'Diamond') {
        if (finalBalance < 149.90) {
          alert('Saldo insuficiente! Para ativar o plano Diamond, o usuário precisa ter no mínimo R$ 149,90 de saldo em conta.');
          return;
        }
        finalBalance = Number((finalBalance - 149.90).toFixed(2));
        finalDepositBalance = Math.max(0, finalDepositBalance - 149.90);
      }
    }

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ADMIN_TOKEN}`
        },
        body: JSON.stringify({
          id: userId,
          balance: finalBalance,
          deposit_balance: finalDepositBalance,
          bonus_balance: Number(editForm.bonus_balance),
          invite_bonus: Number(editForm.invite_bonus),
          app_downloaded: editForm.app_downloaded,
          plan: editForm.plan,
          mega_bonus_active: editForm.mega_bonus_active,
          mega_bonus_claimed: editForm.mega_bonus_claimed
        })
      });
      if (!res.ok) throw new Error('Falha ao atualizar usuário');
      
      setEditingId(null);
      fetchUsers(); // Refresh data
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white max-w-md w-full rounded-3xl shadow-xl p-8 border border-slate-100"
        >
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center">
              <ShieldAlert className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-black text-center text-slate-900 tracking-tight mb-2">Acesso Restrito</h1>
          <p className="text-center text-slate-500 text-sm mb-8">Painel de Administração Replio</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Usuário</label>
              <input 
                type="text" 
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                placeholder="admin"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Senha</label>
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                placeholder="••••••••"
              />
            </div>
            {error && <p className="text-red-500 text-xs font-bold text-center">{error}</p>}
            <button 
              type="submit"
              className="w-full bg-slate-900 text-white rounded-xl py-3.5 font-bold mt-4 hover:bg-slate-800 transition-colors"
            >
              ENTRAR
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Gerenciamento de Usuários</h1>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="text-sm text-slate-500 font-medium">{users.length} cadastrados ({paidUsers.length} VIPs)</span>
                <span className="text-slate-300">•</span>
                <span className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                  {users.filter(u => u.is_online).length} online
                </span>
                <span className="text-slate-300">•</span>
                <span className="inline-flex items-center gap-1.5 text-xs font-black text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                  <Crown className="w-3.5 h-3.5 fill-indigo-500 text-indigo-500" />
                  {paidUsers.filter(u => u.plan === 'Silver').length} Silver
                </span>
                <span className="text-slate-300">•</span>
                <span className="inline-flex items-center gap-1.5 text-xs font-black text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full">
                  <Crown className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  {paidUsers.filter(u => u.plan === 'Gold').length} Elite Gold
                </span>
                <span className="text-slate-300">•</span>
                <span className="inline-flex items-center gap-1.5 text-xs font-black text-cyan-600 bg-cyan-50 px-2.5 py-0.5 rounded-full animate-pulse">
                  <Crown className="w-3.5 h-3.5 fill-cyan-500 text-cyan-500" />
                  {paidUsers.filter(u => u.plan === 'Diamond').length} Diamante
                </span>
                <span className="text-slate-300">•</span>
                <span className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                  <Star className="w-3.5 h-3.5 fill-emerald-500 text-emerald-500" />
                  {paidUsers.filter(u => u.balance > 0).length} com Saldo
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button 
              onClick={fetchUsers}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-100 text-slate-700 px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-200 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} /> Atualizar
            </button>
            <button 
              onClick={() => setIsAuthenticated(false)}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-red-50 text-red-600 px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-red-100 transition-colors"
            >
              <LogOut className="w-4 h-4" /> Sair
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 border-b border-slate-200 pb-px">
          <button
            onClick={() => setActiveTab('usuarios')}
            className={`px-6 py-3 font-bold text-sm transition-all border-b-2 rounded-t-xl cursor-pointer ${
              activeTab === 'usuarios'
                ? 'border-slate-900 text-slate-900 bg-white shadow-sm'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>Usuários ({users.length})</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('saques')}
            className={`px-6 py-3 font-bold text-sm transition-all border-b-2 rounded-t-xl cursor-pointer relative ${
              activeTab === 'saques'
                ? 'border-slate-900 text-slate-900 bg-white shadow-sm'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <History className="w-4 h-4" />
              <span>Solicitações de Saque</span>
              {users.filter(u => (u.withdrawals || []).some((w: any) => w.status === 'Pendente')).length > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                  {users.reduce((acc, u) => acc + (u.withdrawals || []).filter((w: any) => w.status === 'Pendente').length, 0)}
                </span>
              )}
            </div>
          </button>
        </div>
        {activeTab === 'usuarios' && (<>
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 flex flex-col md:flex-row items-center gap-3">
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar por e-mail do usuário (ex: usuario@gmail.com)..."
            className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 text-sm font-semibold outline-none focus-visible:ring-1 focus-visible:ring-slate-900 focus:bg-white transition-all shadow-sm text-slate-800 w-full"
          />
          <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
            <button
              onClick={() => setShowOnlyVips(!showOnlyVips)}
              className={`px-5 py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all shadow-sm cursor-pointer whitespace-nowrap flex items-center gap-1.5 w-full md:w-auto justify-center ${
                showOnlyVips
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-600/10'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Crown className="w-4 h-4" /> {showOnlyVips ? 'Apenas VIPs Ativos' : 'Todos os Usuários'}
            </button>
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold px-5 py-3.5 rounded-2xl text-xs uppercase tracking-wider transition-colors shrink-0 flex items-center justify-center w-full md:w-auto"
              >
                Limpar
              </button>
            )}
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider">Usuário</th>
                  <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider">Saldo (R$)</th>
                  <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider">Saldo Depósito (R$)</th>
                  <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider">Saldo Bônus (R$)</th>
                  <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider">Bônus Convite (R$)</th>
                  <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider">Convidados</th>
                  <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider">App Baixado</th>
                  <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((user) => (
                  <Fragment key={user.id}>
                    <tr 
                      className={`transition-colors duration-200 ${
                        user.plan === 'Diamond'
                          ? 'bg-cyan-500/[0.04] border-l-4 border-l-cyan-500 hover:bg-cyan-500/[0.08]'
                          : user.plan === 'Gold' 
                            ? 'bg-amber-500/[0.04] border-l-4 border-l-amber-500 hover:bg-amber-500/[0.08]' 
                            : user.plan === 'Silver' 
                              ? 'bg-indigo-500/[0.04] border-l-4 border-l-indigo-500 hover:bg-indigo-500/[0.08]' 
                              : 'hover:bg-slate-50/50'
                      }`}
                    >
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="font-bold text-slate-900">{user.email}</div>
                        {user.plan === 'Diamond' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-cyan-500 text-slate-950 text-[10px] font-black shadow-sm tracking-wide">
                            <Crown className="w-3 h-3 fill-slate-950 text-slate-950 animate-bounce" /> VIP DIAMANTE
                          </span>
                        )}
                        {user.plan === 'Gold' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-amber-500 text-slate-950 text-[10px] font-black shadow-sm">
                            <Crown className="w-3 h-3 fill-slate-950 text-slate-950" /> VIP GOLD
                          </span>
                        )}
                        {user.plan === 'Silver' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-indigo-500 text-white text-[10px] font-black shadow-sm">
                            <Crown className="w-3 h-3 fill-white text-white" /> VIP SILVER
                          </span>
                        )}
                        {user.balance > 0 && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-black">
                            <Star className="w-3 h-3 fill-emerald-500 text-emerald-500" /> ATIVO
                          </span>
                        )}
                        {user.is_online ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-black">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                            ONLINE
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-400 text-[9px] font-bold">
                            OFFLINE
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 font-medium">
                        {editingId === user.id ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wide">Plano:</span>
                            <select 
                              value={editForm.plan}
                              onChange={(e) => setEditForm(prev => ({ ...prev, plan: e.target.value }))}
                              className="bg-white border border-slate-300 rounded px-1.5 py-0.5 text-xs text-slate-700 font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                            >
                              <option value="Basic">Básico (Grátis)</option>
                              <option value="Silver">Silver (R$ 39,90)</option>
                              <option value="Gold">Gold (R$ 97,00)</option>
                              <option value="Diamond">Diamante (R$ 149,90)</option>
                            </select>
                          </div>
                        ) : (
                          <span>Plano: {user.plan}</span>
                        )}
                        {user.last_active_at > 0 && (
                          <>
                            <span>•</span>
                            <span title={new Date(user.last_active_at).toLocaleString('pt-BR')}>
                              Ativo: {(() => {
                                const diff = Date.now() - user.last_active_at;
                                if (diff < 60000) return 'Agora mesmo';
                                const mins = Math.floor(diff / 60000);
                                if (mins < 60) return `Há ${mins}m`;
                                const hours = Math.floor(mins / 60);
                                if (hours < 24) return `Há ${hours}h`;
                                return new Date(user.last_active_at).toLocaleDateString('pt-BR');
                              })()}
                            </span>
                          </>
                        )}
                      </div>
                    </td>
                    
                    {editingId === user.id ? (
                      <>
                        <td className="px-6 py-4">
                          <input 
                            type="number" 
                            step="0.01"
                            value={editForm.balance}
                            onChange={(e) => setEditForm(prev => ({ ...prev, balance: e.target.value }))}
                            className="w-24 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input 
                            type="number" 
                            step="0.01"
                            value={editForm.deposit_balance}
                            onChange={(e) => setEditForm(prev => ({ ...prev, deposit_balance: e.target.value }))}
                            className="w-24 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input 
                            type="number" 
                            step="0.01"
                            value={editForm.bonus_balance}
                            onChange={(e) => setEditForm(prev => ({ ...prev, bonus_balance: e.target.value }))}
                            className="w-24 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input 
                            type="number" 
                            step="0.01"
                            value={editForm.invite_bonus}
                            onChange={(e) => setEditForm(prev => ({ ...prev, invite_bonus: e.target.value }))}
                            className="w-24 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                          />
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-500">
                          {user.invites} {user.invites === 1 ? 'amigo' : 'amigos'}
                        </td>
                        <td className="px-6 py-4">
                          <button 
                            onClick={() => setEditForm(prev => ({ ...prev, app_downloaded: !prev.app_downloaded }))}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                              editForm.app_downloaded 
                                ? 'bg-emerald-100 text-emerald-700' 
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            <Smartphone className="w-3.5 h-3.5" />
                            {editForm.app_downloaded ? 'SIM' : 'NÃO'}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => handleSave(user.id)}
                              className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => setEditingId(null)}
                              className="p-2 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-4 font-bold text-slate-700">
                          R$ {user.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 font-bold text-emerald-600">
                          R$ {(user.deposit_balance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 font-bold text-amber-600">
                          R$ {(user.bonus_balance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-700">
                          R$ {user.invite_bonus.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-700">
                          {user.invites} {user.invites === 1 ? 'amigo' : 'amigos'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col items-start gap-1">
                            {user.app_downloaded ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-600 text-xs font-bold">
                                <Check className="w-3 h-3" /> Sim
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 text-slate-500 text-xs font-bold">
                                Não
                              </span>
                            )}
                            {user.app_download_clicks > 0 && (
                              <span className="text-[10px] text-slate-400 font-bold ml-1">
                                {user.app_download_clicks} {user.app_download_clicks === 1 ? 'clique' : 'cliques'}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => {
                                setExpandedUserId(expandedUserId === user.id ? null : user.id);
                                setNewWithdrawalForm({
                                  amount: '',
                                  date: getLocalDateTimeString(),
                                  status: 'Sucesso'
                                });
                                setEditingWithdrawalId(null);
                              }}
                              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                                expandedUserId === user.id 
                                  ? 'bg-slate-900 text-white hover:bg-slate-800' 
                                  : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                              }`}
                            >
                              <History className="w-3.5 h-3.5" /> Saques ({user.withdrawals?.length || 0})
                              {expandedUserId === user.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                            <button 
                              onClick={() => handleEdit(user)}
                              className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" /> Editar
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                  {expandedUserId === user.id && (
                    <tr className="bg-slate-50/70 border-b border-slate-100">
                      <td colSpan={6} className="px-8 py-6">
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 space-y-6">
                          
                          {/* Title */}
                          <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                            <div className="flex items-center gap-2 text-slate-900">
                              <History className="w-5 h-5 text-indigo-600 animate-pulse" />
                              <h4 className="font-black text-sm uppercase tracking-wider">Histórico de Saques: {user.email}</h4>
                            </div>
                            <span className="text-xs text-slate-500 font-bold bg-slate-100 px-3 py-1 rounded-full">
                              {user.withdrawals?.length || 0} saques registrados
                            </span>
                          </div>

                          {/* Add New Withdrawal */}
                          <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-4 space-y-4">
                            <h5 className="text-xs font-black text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                              <Plus className="w-4 h-4 text-emerald-500" /> Adicionar Saque com Sucesso
                            </h5>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Valor (R$)</label>
                                <input 
                                  type="number" 
                                  step="0.01" 
                                  placeholder="Ex: 50.00"
                                  value={newWithdrawalForm.amount}
                                  onChange={e => setNewWithdrawalForm(prev => ({ ...prev, amount: e.target.value }))}
                                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Data e Hora (Local)</label>
                                <input 
                                  type="datetime-local" 
                                  value={newWithdrawalForm.date}
                                  onChange={e => setNewWithdrawalForm(prev => ({ ...prev, date: e.target.value }))}
                                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-700"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Status</label>
                                <select 
                                  value={newWithdrawalForm.status}
                                  onChange={e => setNewWithdrawalForm(prev => ({ ...prev, status: e.target.value as any }))}
                                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-700"
                                >
                                  <option value="Sucesso">Sucesso (Aprovado)</option>
                                  <option value="Pendente">Pendente (Em análise)</option>
                                  <option value="Recusado">Recusado (Estornado)</option>
                                </select>
                              </div>
                              <button
                                onClick={() => handleAddWithdrawal(user.id)}
                                className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-black text-xs uppercase tracking-wider transition-colors shadow-md shadow-emerald-500/10 cursor-pointer"
                              >
                                Adicionar Saque
                              </button>
                            </div>
                          </div>

                          {/* Withdrawals List Table */}
                          <div className="border border-slate-100 rounded-xl overflow-hidden">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase">
                                <tr>
                                  <th className="px-4 py-2.5">Data e Hora</th>
                                  <th className="px-4 py-2.5">Valor</th>
                                  <th className="px-4 py-2.5">Status</th>
                                  <th className="px-4 py-2.5 text-right">Ações</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-50 font-medium">
                                {(user.withdrawals || []).map((w: any) => {
                                  const formattedDate = new Date(w.date).toLocaleString('pt-BR', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  });

                                  const statusColors = {
                                    Sucesso: 'bg-emerald-50 text-emerald-700 border-emerald-100',
                                    Pendente: 'bg-amber-50 text-amber-700 border-amber-100',
                                    Recusado: 'bg-red-50 text-red-700 border-red-100'
                                  };

                                  return (
                                    <tr key={w.id} className="hover:bg-slate-50/30">
                                      {editingWithdrawalId === w.id ? (
                                        <>
                                          <td className="px-4 py-2">
                                            <input 
                                              type="datetime-local" 
                                              value={editWithdrawalForm.date}
                                              onChange={e => setEditWithdrawalForm(prev => ({ ...prev, date: e.target.value }))}
                                              className="bg-white border border-slate-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                            />
                                          </td>
                                          <td className="px-4 py-2">
                                            <input 
                                              type="number" 
                                              step="0.01" 
                                              value={editWithdrawalForm.amount}
                                              onChange={e => setEditWithdrawalForm(prev => ({ ...prev, amount: e.target.value }))}
                                              className="w-20 bg-white border border-slate-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                                            />
                                          </td>
                                          <td className="px-4 py-2">
                                            <select 
                                              value={editWithdrawalForm.status}
                                              onChange={e => setEditWithdrawalForm(prev => ({ ...prev, status: e.target.value as any }))}
                                              className="bg-white border border-slate-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                            >
                                              <option value="Sucesso">Sucesso</option>
                                              <option value="Pendente">Pendente</option>
                                              <option value="Recusado">Recusado</option>
                                            </select>
                                          </td>
                                          <td className="px-4 py-2 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                              <button 
                                                onClick={() => handleSaveWithdrawal(user.id, w.id)}
                                                className="p-1 bg-emerald-500 text-white rounded hover:bg-emerald-600 transition-colors"
                                                title="Salvar"
                                              >
                                                <Check className="w-3.5 h-3.5" />
                                              </button>
                                              <button 
                                                onClick={() => setEditingWithdrawalId(null)}
                                                className="p-1 bg-slate-200 text-slate-600 rounded hover:bg-slate-300 transition-colors"
                                                title="Cancelar"
                                              >
                                                <X className="w-3.5 h-3.5" />
                                              </button>
                                            </div>
                                          </td>
                                        </>
                                      ) : (
                                        <>
                                          <td className="px-4 py-2.5 font-bold text-slate-500 flex items-center gap-1.5">
                                            <Calendar className="w-3.5 h-3.5 text-slate-400" /> {formattedDate}
                                          </td>
                                          <td className="px-4 py-2.5 font-black text-slate-800">
                                            R$ {w.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                          </td>
                                          <td className="px-4 py-2.5">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider ${statusColors[w.status as keyof typeof statusColors] || statusColors.Pendente}`}>
                                              {w.status}
                                            </span>
                                          </td>
                                          <td className="px-4 py-2.5 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                              <button 
                                                onClick={() => handleStartEditWithdrawal(w)}
                                                className="p-1 text-slate-500 hover:text-slate-700 bg-slate-100 rounded transition-colors"
                                                title="Editar Saque"
                                              >
                                                <Edit2 className="w-3.5 h-3.5" />
                                              </button>
                                              <button 
                                                onClick={() => handleDeleteWithdrawal(user.id, w.id)}
                                                className="p-1 text-red-500 hover:text-red-700 bg-red-50 rounded transition-colors"
                                                title="Excluir Saque"
                                              >
                                                <Trash2 className="w-3.5 h-3.5" />
                                              </button>
                                            </div>
                                          </td>
                                        </>
                                      )}
                                    </tr>
                                  );
                                })}

                                {(user.withdrawals || []).length === 0 && (
                                  <tr>
                                    <td colSpan={4} className="px-4 py-6 text-center text-slate-400 font-bold">
                                      Nenhum saque registrado para este usuário.
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Mega Bônus Control Card */}
                        <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 h-fit space-y-4">
                          <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
                            <Sparkles className="w-5 h-5 text-yellow-500 animate-pulse" />
                            <h4 className="font-black text-sm uppercase tracking-wider text-slate-800">Mega Bônus R$ 30,00</h4>
                          </div>

                          <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                            Lance um popup de tela cheia para o usuário oferecendo um bônus de <strong className="text-slate-700">R$ 30,00</strong> se ele realizar um depósito mínimo de <strong className="text-slate-700">R$ 15,00</strong>.
                          </p>

                          <div className="pt-2">
                            {user.mega_bonus_active ? (
                              <div className="space-y-4">
                                <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-700 p-3 rounded-2xl text-xs font-black flex items-center gap-2">
                                  <Zap className="w-4 h-4 shrink-0 text-yellow-500 animate-bounce" />
                                  <span>⚡ POPUP MEGA BÔNUS ATIVO</span>
                                </div>
                                <p className="text-[10px] text-slate-400 font-bold text-center">
                                  O usuário verá o popup em tela cheia na próxima vez que acessar a conta.
                                </p>
                                <button
                                  onClick={() => handleToggleMegaBonus(user.id, false, true)}
                                  className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-black py-3 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                  Cancelar e Desativar Oferta
                                </button>
                              </div>
                            ) : user.mega_bonus_claimed ? (
                              <div className="space-y-4">
                                <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 p-3 rounded-2xl text-xs font-black flex items-center gap-2">
                                  <Check className="w-4 h-4 shrink-0 text-emerald-500" />
                                  <span>OFERTA REIVINDICADA / DELETADA</span>
                                </div>
                                <p className="text-[10px] text-slate-400 font-bold text-center">
                                  Este usuário já interagiu com a oferta (reivindicou ou fechou).
                                </p>
                                <button
                                  onClick={() => handleToggleMegaBonus(user.id, true, false)}
                                  className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-black py-3 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                  Reativar Popup de Oferta
                                </button>
                              </div>
                            ) : (
                              <div className="space-y-4">
                                <div className="bg-slate-200/50 border border-slate-300/40 text-slate-600 p-3 rounded-2xl text-xs font-black text-center">
                                  SEM OFERTA ATIVA NO MOMENTO
                                </div>
                                <button
                                  onClick={() => handleToggleMegaBonus(user.id, true, false)}
                                  className="w-full bg-gradient-to-r from-yellow-500 to-amber-400 hover:brightness-110 text-slate-950 font-black py-3.5 rounded-2xl text-xs shadow-lg shadow-yellow-500/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                  <Sparkles className="w-4 h-4 fill-slate-950 text-slate-950" /> LANÇAR MEGA BÔNUS
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                      </div>
                    </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
                
                {filteredUsers.length === 0 && !isLoading && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500 font-medium">
                      Nenhum usuário encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        </>)}

        {activeTab === 'saques' && (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden p-6">
            <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-600 animate-pulse" />
              Solicitações de Saque Pendentes ({pendingWithdrawalList.length})
            </h2>

            {pendingWithdrawalList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                <Check className="w-12 h-12 text-emerald-500 bg-emerald-50 p-2.5 rounded-full mb-3" />
                <p className="font-black text-lg text-slate-800">Tudo em dia!</p>
                <p className="text-sm font-medium mt-1">Nenhuma solicitação de saque pendente.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-100 text-slate-500">
                    <tr>
                      <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider">Usuário</th>
                      <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider">Plano</th>
                      <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider">Data do Pedido</th>
                      <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider">Valor do Saque</th>
                      <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pendingWithdrawalList.map((w: any) => (
                      <tr key={w.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-900">{w.userEmail}</td>
                        <td className="px-6 py-4">
                          {w.userPlan === 'Diamond' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-cyan-500 text-slate-950 text-[10px] font-black shadow-sm tracking-wide">
                              VIP DIAMANTE
                            </span>
                          )}
                          {w.userPlan === 'Gold' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-amber-500 text-slate-950 text-[10px] font-black shadow-sm">
                              VIP GOLD
                            </span>
                          )}
                          {w.userPlan === 'Silver' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-indigo-500 text-white text-[10px] font-black shadow-sm">
                              VIP SILVER
                            </span>
                          )}
                          {w.userPlan === 'Basic' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-black shadow-sm">
                              GRÁTIS
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-slate-500 font-bold">
                          {new Date(w.date).toLocaleString('pt-BR')}
                        </td>
                        <td className="px-6 py-4 text-slate-900 font-black text-base">
                          R$ {Number(w.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleStatusUpdate(w.userId, w.id, 'Sucesso')}
                              className="bg-emerald-500 hover:bg-emerald-600 text-white font-black px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-sm shadow-emerald-500/10 cursor-pointer"
                            >
                              <Check className="w-4 h-4" /> Concluir Saque
                            </button>
                            <button
                              onClick={() => {
                                if (confirm('Tem certeza que deseja recusar este saque?')) {
                                  handleStatusUpdate(w.userId, w.id, 'Recusado');
                                }
                              }}
                              className="bg-red-50 hover:bg-red-100 text-red-600 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                            >
                              <X className="w-4 h-4" /> Recusar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
