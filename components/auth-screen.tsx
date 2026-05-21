'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { SignIn, SignUp } from '@clerk/nextjs';
import { motion } from 'motion/react';
import { 
  Zap, 
  Gift, 
  Wallet,
  Play,
  CheckCircle2,
  TrendingUp
} from 'lucide-react';

interface AuthScreenProps {
  pendingRef: string | null;
  onAuthSuccess: () => void;
}

export function AuthScreen({ pendingRef, onAuthSuccess }: AuthScreenProps) {
  const [isSignUp, setIsSignUp] = useState(!!pendingRef);
  const [inviterName, setInviterName] = useState<string | null>(null);

  // Fetch the inviter username when referral code is present
  useEffect(() => {
    if (pendingRef) {
      const fetchInviter = async () => {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('email')
            .eq('referral_code', pendingRef)
            .single();

          if (!error && data?.email) {
            const username = data.email.split('@')[0];
            const formattedName = username.charAt(0).toUpperCase() + username.slice(1);
            setInviterName(formattedName);
          }
        } catch (err) {
          console.error('Error fetching inviter info:', err);
        }
      };
      fetchInviter();
    }
  }, [pendingRef]);

  // Clerk appearance — dark premium, card/header completamente ocultos para integrar ao nosso card
  const clerkAppearance = {
    variables: {
      colorPrimary: '#10b981',
      colorBackground: 'transparent',
      colorInputBackground: 'rgba(2,6,23,0.7)',
      colorInputText: '#ffffff',
      colorText: '#ffffff',
      colorTextSecondary: '#94a3b8',
      colorNeutral: '#1e293b',
      borderRadius: '1rem',
      fontFamily: 'Inter, sans-serif',
      colorDanger: '#ef4444',
      fontSize: '14px',
    },
    elements: {
      // Remove completamente o card do Clerk (usamos o nosso)
      card: {
        background: 'transparent',
        boxShadow: 'none',
        border: 'none',
        padding: '0',
        margin: '0',
        width: '100%',
      },
      rootBox: {
        width: '100%',
      },
      // Ocultar o cabeçalho do Clerk ("Sign in to REPLIO") — temos o nosso
      header: {
        display: 'none',
      },
      headerTitle: {
        display: 'none',
      },
      headerSubtitle: {
        display: 'none',
      },
      // Botão principal (Continuar / Criar conta)
      formButtonPrimary: {
        background: 'linear-gradient(135deg, #10b981, #059669)',
        fontSize: '13px',
        fontWeight: '900',
        letterSpacing: '0.08em',
        borderRadius: '1rem',
        padding: '14px',
        textTransform: 'uppercase',
        boxShadow: '0 8px 24px rgba(16,185,129,0.25)',
        border: 'none',
        marginTop: '4px',
      },
      // Campos de input
      formFieldInput: {
        background: 'rgba(2,6,23,0.7)',
        border: '1px solid rgba(51,65,85,1)',
        borderRadius: '1rem',
        color: '#ffffff',
        fontSize: '14px',
        padding: '14px 16px',
      },
      formFieldLabel: {
        color: '#94a3b8',
        fontSize: '10px',
        fontWeight: '900',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        marginBottom: '6px',
      },
      // Botões sociais (Google, Apple)
      socialButtonsBlockButton: {
        background: 'rgba(30,41,59,0.9)',
        border: '1px solid rgba(51,65,85,1)',
        borderRadius: '1rem',
        color: '#ffffff',
        fontSize: '13px',
        fontWeight: '700',
        padding: '12px',
      },
      socialButtonsBlockButtonText: {
        color: '#ffffff',
        fontWeight: '700',
      },
      // Divisor "ou"
      dividerLine: {
        background: 'rgba(51,65,85,0.6)',
      },
      dividerText: {
        color: '#64748b',
        fontSize: '11px',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
      },
      // Rodapé do Clerk — OCULTO (temos nosso próprio toggle ENTRAR/CADASTRAR)
      footerActionLink: {
        display: 'none',
      },
      footer: {
        display: 'none',
      },
      footerAction: {
        display: 'none',
      },
      footerActionText: {
        display: 'none',
      },
      footerPages: {
        display: 'none',
      },
      // "Powered by Clerk" — ocultar
      badge: {
        display: 'none',
      },
      clerkBranding: {
        display: 'none',
      },
      // Preview de identidade (ao confirmar email)
      identityPreviewText: {
        color: '#ffffff',
      },
      identityPreviewEditButton: {
        color: '#10b981',
      },
      // Código OTP
      otpCodeFieldInput: {
        background: 'rgba(2,6,23,0.7)',
        border: '1px solid rgba(51,65,85,1)',
        borderRadius: '0.75rem',
        color: '#ffffff',
        fontSize: '20px',
        fontWeight: '900',
      },
      // Mensagens de erro
      formFieldErrorText: {
        color: '#fca5a5',
        fontSize: '12px',
      },
      alertText: {
        color: '#fca5a5',
      },
      formResendCodeLink: {
        color: '#10b981',
        fontWeight: '700',
      },
      // Interno
      main: {
        width: '100%',
      },
      form: {
        width: '100%',
      },
    },
  };

  const clerkSignInUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const clerkSignUpUrl = typeof window !== 'undefined' ? window.location.origin : '';

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center p-4 bg-slate-950 relative overflow-hidden">
      {/* Decorative gradient glowing spheres */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-emerald-500/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none" />

      {pendingRef ? (
        // Split-screen premium layout for referrals
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center z-10 py-8 lg:py-16">
          {/* Welcome Left Pane */}
          <div className="lg:col-span-7 flex flex-col text-left space-y-6 lg:pr-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white font-bold shadow-md shadow-emerald-500/10">
                <Zap className="w-4 h-4 fill-current" />
              </div>
              <span className="text-lg font-black tracking-tighter italic text-white">GanheMais</span>
            </div>
            
            <div className="space-y-4">
              <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3.5 py-1.5 rounded-full text-xs font-black tracking-wider uppercase animate-pulse">
                <Gift className="w-3.5 h-3.5" /> Convite Exclusivo Ativo
              </span>
              
              <h1 className="text-4xl lg:text-6xl font-black text-white leading-tight tracking-tight">
                Seu amigo <span className="text-emerald-400 font-black">{inviterName || pendingRef}</span> te convidou para lucrar!
              </h1>
              
              <p className="text-slate-400 text-sm lg:text-base font-semibold leading-relaxed max-w-xl">
                Junte-se à maior plataforma brasileira de micro-tarefas digitais. Assista a vídeos, responda questionários e receba recompensas reais via Pix!
              </p>
            </div>

            {/* Benefit cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl pt-4">
              <div className="bg-slate-900/40 border border-slate-800/80 backdrop-blur-md p-5 rounded-2xl flex items-start gap-4">
                <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl shrink-0">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">Bônus de Adesão</h4>
                  <p className="text-slate-400 text-xs mt-1">Sua indicação foi computada com sucesso no cadastro.</p>
                </div>
              </div>

              <div className="bg-slate-900/40 border border-slate-800/80 backdrop-blur-md p-5 rounded-2xl flex items-start gap-4">
                <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl shrink-0">
                  <Play className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">R$ 0,50 a R$ 2,00</h4>
                  <p className="text-slate-400 text-xs mt-1">Por cada tarefa diária concluída.</p>
                </div>
              </div>

              <div className="bg-slate-900/40 border border-slate-800/80 backdrop-blur-md p-5 rounded-2xl flex items-start gap-4">
                <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">Check-in Diário</h4>
                  <p className="text-slate-400 text-xs mt-1">Resgate recompensas diárias baseadas no seu nível.</p>
                </div>
              </div>

              <div className="bg-slate-900/40 border border-slate-800/80 backdrop-blur-md p-5 rounded-2xl flex items-start gap-4">
                <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl shrink-0">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">Saques Imediatos</h4>
                  <p className="text-slate-400 text-xs mt-1">Sem burocracia ou limites abusivos para retirada.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Clerk Form Pane */}
          <div className="lg:col-span-5 w-full flex justify-center">
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-md bg-slate-900/70 border border-slate-800 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-[0_30px_70px_rgba(0,0,0,0.8)] flex flex-col border-b-4 border-b-emerald-500"
            >
              {/* Mobile welcome banner */}
              <div className="lg:hidden w-full bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-4 flex items-center gap-3.5 mb-6 backdrop-blur-md">
                <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white font-bold shrink-0 shadow-lg shadow-emerald-500/20 animate-bounce">
                  <Gift className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-[10px] font-black text-emerald-400 uppercase tracking-wider">CONVITE DE AFILIADO</h3>
                  <p className="text-xs text-slate-300 font-semibold leading-normal truncate">
                    Você foi convidado por <span className="text-white font-black">{inviterName || pendingRef}</span>!
                  </p>
                </div>
              </div>

              {/* Toggle Login / Register */}
              <div className="flex w-full bg-slate-950/60 rounded-2xl p-1 mb-6 border border-slate-800">
                <button
                  onClick={() => setIsSignUp(false)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    !isSignUp ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  ENTRAR
                </button>
                <button
                  onClick={() => setIsSignUp(true)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    isSignUp ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  CADASTRAR
                </button>
              </div>

              {/* Official Clerk Components */}
              {isSignUp ? (
                <SignUp
                  appearance={clerkAppearance}
                  signInUrl={clerkSignInUrl}
                  forceRedirectUrl="/"
                  fallbackRedirectUrl="/"
                />
              ) : (
                <SignIn
                  appearance={clerkAppearance}
                  signUpUrl={clerkSignUpUrl}
                  forceRedirectUrl="/"
                  fallbackRedirectUrl="/"
                />
              )}
            </motion.div>
          </div>
        </div>
      ) : (
        // Standard centered layout (no referral)
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md bg-slate-900/70 border border-slate-800 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-[0_30px_70px_rgba(0,0,0,0.8)] z-10 flex flex-col border-b-4 border-b-emerald-500"
        >
          {/* App Logo */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-emerald-500/20">
              <Zap className="w-6 h-6 fill-current" />
            </div>
            <span className="text-2xl font-black tracking-tighter italic text-white">GanheMais</span>
          </div>

          {/* Toggle Login / Register */}
          <div className="flex w-full bg-slate-950/60 rounded-2xl p-1 mb-6 border border-slate-800">
            <button
              onClick={() => setIsSignUp(false)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                !isSignUp ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}
            >
              ENTRAR
            </button>
            <button
              onClick={() => setIsSignUp(true)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                isSignUp ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}
            >
              CADASTRAR
            </button>
          </div>

          {/* Official Clerk Components */}
          {isSignUp ? (
            <SignUp
              appearance={clerkAppearance}
              signInUrl={clerkSignInUrl}
              forceRedirectUrl="/"
              fallbackRedirectUrl="/"
            />
          ) : (
            <SignIn
              appearance={clerkAppearance}
              signUpUrl={clerkSignUpUrl}
              forceRedirectUrl="/"
              fallbackRedirectUrl="/"
            />
          )}
        </motion.div>
      )}
    </div>
  );
}
