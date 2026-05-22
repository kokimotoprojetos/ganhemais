'use client';

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Check, Edit2, LogOut, RefreshCw, Save, ShieldAlert, Smartphone, Users, X } from 'lucide-react';

interface UserData {
  id: string;
  email: string;
  balance: number;
  total_earned: number;
  invite_bonus: number;
  app_downloaded: boolean;
  plan: string;
}

const ADMIN_TOKEN = 'admin_replio_2026_secreto';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ balance: string; invite_bonus: string; app_downloaded: boolean }>({
    balance: '0',
    invite_bonus: '0.50',
    app_downloaded: false
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
      invite_bonus: user.invite_bonus.toString(),
      app_downloaded: user.app_downloaded
    });
  };

  const handleSave = async (userId: string) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ADMIN_TOKEN}`
        },
        body: JSON.stringify({
          id: userId,
          balance: Number(editForm.balance),
          invite_bonus: Number(editForm.invite_bonus),
          app_downloaded: editForm.app_downloaded
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
              <p className="text-sm text-slate-500 font-medium">{users.length} usuários cadastrados</p>
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

        {/* Users Table */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider">Usuário</th>
                  <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider">Saldo (R$)</th>
                  <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider">Bônus Convite (R$)</th>
                  <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider">App Baixado</th>
                  <th className="px-6 py-4 font-bold uppercase text-xs tracking-wider text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{user.email}</div>
                      <div className="text-xs text-slate-500 font-medium mt-0.5">Plano: {user.plan}</div>
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
                            value={editForm.invite_bonus}
                            onChange={(e) => setEditForm(prev => ({ ...prev, invite_bonus: e.target.value }))}
                            className="w-24 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                          />
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
                        <td className="px-6 py-4 font-bold text-slate-700">
                          R$ {user.invite_bonus.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4">
                          {user.app_downloaded ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-600 text-xs font-bold">
                              <Check className="w-3 h-3" /> Sim
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 text-slate-500 text-xs font-bold">
                              Não
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => handleEdit(user)}
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" /> Editar
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
                
                {users.length === 0 && !isLoading && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500 font-medium">
                      Nenhum usuário encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
