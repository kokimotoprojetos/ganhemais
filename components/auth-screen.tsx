'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from 'motion/react';
import { Zap, Lock, Mail, ArrowRight, Gift, AlertCircle } from 'lucide-react';

interface AuthScreenProps {
  pendingRef: string | null;
  onAuthSuccess: () => void;
}

export function AuthScreen({ pendingRef, onAuthSuccess }: AuthScreenProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      if (isSignUp) {
        // Sign up with Supabase and pass referral code in user metadata
        const { error, data } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              ref: pendingRef || undefined,
            },
          },
        });

        if (error) throw error;

        // Auto sign in or show a message
        if (data.session) {
          onAuthSuccess();
        } else {
          // In newer Supabase settings, auto-login happens unless email confirmation is enabled.
          // If a session is returned, we succeed. Otherwise, inform them.
          if (data.user) {
            // Log in right after signup if session is active
            const { error: signInError } = await supabase.auth.signInWithPassword({
              email,
              password,
            });
            if (signInError) {
              setErrorMsg('Cadastro efetuado! Faça login agora.');
              setIsSignUp(false);
            } else {
              onAuthSuccess();
            }
          } else {
            setErrorMsg('Cadastro realizado! Por favor, verifique seu e-mail para confirmar a conta.');
          }
        }
      } else {
        // Sign in
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        onAuthSuccess();
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      // Map common errors to friendly Portuguese messages
      let message = err.message;
      if (message === 'Invalid login credentials' || message.includes('Email not confirmed')) {
        message = 'E-mail ou senha incorretos.';
      } else if (message === 'User already registered') {
        message = 'Este e-mail já está cadastrado.';
      } else if (message.includes('Password should be')) {
        message = 'A senha deve ter pelo menos 6 caracteres.';
      }
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center p-4 bg-slate-950 relative overflow-hidden">
      {/* Decorative gradient glowing spheres */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-emerald-500 rounded-full opacity-35 blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500 rounded-full opacity-25 blur-[120px] pointer-events-none"></div>

      {/* Main glass card container */}
      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-slate-900/60 border border-slate-800 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-[0_30px_70px_rgba(0,0,0,0.8)] z-10 flex flex-col items-center border-b-4 border-b-emerald-500"
      >
        {/* App Logo */}
        <div className="flex items-center gap-2 mb-6">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-emerald-500/20">
            <Zap className="w-6 h-6 fill-current" />
          </div>
          <span className="text-2xl font-black tracking-tighter italic text-white">GanheMais</span>
        </div>

        {/* Pending referral badge */}
        {pendingRef && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-2 rounded-2xl text-xs font-black mb-6 uppercase tracking-wider animate-pulse"
          >
            <Gift className="w-4 h-4 shrink-0" /> Indicação Ativa: {pendingRef}
          </motion.div>
        )}

        {/* Header Text */}
        <h2 className="text-2xl font-black tracking-tight text-white mb-2 text-center">
          {isSignUp ? 'Crie sua Conta Grátis' : 'Entrar no GanheMais'}
        </h2>
        <p className="text-slate-400 text-xs font-semibold text-center mb-8">
          {isSignUp 
            ? 'Comece a lucrar assistindo a vídeos e respondendo questionários' 
            : 'Acesse o seu painel de ganhos diários'}
        </p>

        {/* Auth form */}
        <form onSubmit={handleSubmit} className="w-full space-y-5">
          {/* Email input */}
          <div className="space-y-2">
            <label className="text-[10px] text-slate-400 font-black uppercase tracking-widest block ml-1">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
              <input 
                type="email" 
                required
                placeholder="seuemail@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-2xl pl-12 pr-4 py-4 text-sm font-semibold placeholder-slate-600 focus:border-emerald-500 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Password input */}
          <div className="space-y-2">
            <label className="text-[10px] text-slate-400 font-black uppercase tracking-widest block ml-1">Senha</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
              <input 
                type="password" 
                required
                placeholder="Sua senha secreta"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-2xl pl-12 pr-4 py-4 text-sm font-semibold placeholder-slate-600 focus:border-emerald-500 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Alert Message */}
          {errorMsg && (
            <motion.div 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-start gap-3 p-4 rounded-2xl text-xs font-semibold leading-relaxed border ${
                errorMsg.includes('Cadastro realizado') || errorMsg.includes('Cadastro efetuado')
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  : 'bg-red-500/10 border-red-500/20 text-red-400'
              }`}
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </motion.div>
          )}

          {/* Submit Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full py-4.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black text-sm tracking-wide shadow-xl shadow-emerald-900/10 hover:shadow-emerald-500/10 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                {isSignUp ? 'COMEÇAR A GANHAR AGORA' : 'ACESSAR PAINEL'} 
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </motion.button>
        </form>

        {/* Toggle Mode */}
        <div className="mt-8 text-center">
          <p className="text-xs text-slate-400 font-semibold">
            {isSignUp ? 'Já possui uma conta?' : 'Ainda não tem conta?'}
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorMsg(null);
              }}
              className="text-emerald-400 font-black ml-1 hover:underline cursor-pointer"
            >
              {isSignUp ? 'Entrar' : 'Cadastre-se'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
