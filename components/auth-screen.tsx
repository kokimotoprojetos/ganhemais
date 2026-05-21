'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useSignIn, useSignUp, SignIn, SignUp, useClerk } from '@clerk/nextjs';
import { motion } from 'motion/react';
import { 
  Gift, 
  Wallet,
  Play,
  CheckCircle2,
  TrendingUp,
  AlertCircle
} from 'lucide-react';


interface AuthScreenProps {
  pendingRef: string | null;
  onAuthSuccess: () => void;
}

// SVG icons for Google and Apple
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
    <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.6 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.5 6.5 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.9z"/>
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.2 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.5 6.5 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
    <path fill="#4CAF50" d="M24 44c5.5 0 10.4-2.1 14.1-5.5l-6.5-5.5C29.5 34.9 26.9 36 24 36c-5.3 0-9.6-3.3-11.2-7.9l-6.5 5C9.7 39.7 16.3 44 24 44z"/>
    <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.3 5.5l6.5 5.5C37.2 38.6 44 33 44 24c0-1.3-.1-2.6-.4-3.9z"/>
  </svg>
);

const AppleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
  </svg>
);

export function AuthScreen({ pendingRef, onAuthSuccess }: AuthScreenProps) {
  const [isSignUp, setIsSignUp] = useState(!!pendingRef);
  const [inviterName, setInviterName] = useState<string | null>(null);
  const [socialLoading, setSocialLoading] = useState<'google' | 'apple' | null>(null);
  const [socialError, setSocialError] = useState<string | null>(null);

  const clerk = useClerk();
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();

  // Handle direct OAuth social login — bypasses Account Portal, goes directly to Google/Apple
  const handleSocialLogin = async (provider: 'oauth_google' | 'oauth_apple') => {
    setSocialError(null);
    if (!clerk.loaded) return;

    try {
      setSocialLoading(provider === 'oauth_google' ? 'google' : 'apple');
      
      // Fallback safety timeout in case redirect fails silently or takes too long
      const fallbackTimer = setTimeout(() => {
        setSocialLoading(null);
      }, 8000);

      if (isSignUp) {
        await clerk.client.signUp.authenticateWithRedirect({
          strategy: provider,
          redirectUrl: `${window.location.origin}/sso-callback`,
          redirectUrlComplete: `${window.location.origin}/`,
        });
      } else {
        await clerk.client.signIn.authenticateWithRedirect({
          strategy: provider,
          redirectUrl: `${window.location.origin}/sso-callback`,
          redirectUrlComplete: `${window.location.origin}/`,
        });
      }
    } catch (err: any) {
      console.error('Erro no redirect de login social:', err);
      setSocialError(err?.message || 'Erro ao iniciar login social.');
      setSocialLoading(null);
    }
  };

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

  // Clerk appearance — seamlessly blends into our dark card
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
      cardBox: { width: '100%', maxWidth: '100%', minWidth: 'auto' },
      card: { background: 'transparent', boxShadow: 'none', border: 'none', padding: '0', margin: '0', width: '100%', maxWidth: '100%', minWidth: 'auto' },
      rootBox: { width: '100%', maxWidth: '100%', minWidth: 'auto' },
      header: { display: 'none' },
      headerTitle: { display: 'none' },
      headerSubtitle: { display: 'none' },
      // Hide Clerk's own social buttons (we use custom ones above)
      socialButtonsRoot: { display: 'none' },
      socialButtonsBlockButton: { display: 'none' },
      dividerRow: { display: 'none' },
      dividerLine: { display: 'none' },
      dividerText: { display: 'none' },
      // Hide footer
      footer: { display: 'none' },
      footerAction: { display: 'none' },
      footerActionText: { display: 'none' },
      footerActionLink: { display: 'none' },
      footerPages: { display: 'none' },
      badge: { display: 'none' },
      clerkBranding: { display: 'none' },
      // Form fields
      formButtonPrimary: {
        background: 'linear-gradient(135deg, #10b981, #059669)',
        fontSize: '13px', fontWeight: '900', letterSpacing: '0.08em',
        borderRadius: '1rem', padding: '14px', textTransform: 'uppercase',
        boxShadow: '0 8px 24px rgba(16,185,129,0.25)', border: 'none', marginTop: '4px',
        width: '100%', maxWidth: '100%', boxSizing: 'border-box',
      },
      formFieldInput: {
        background: 'rgba(2,6,23,0.7)', border: '1px solid rgba(51,65,85,1)',
        borderRadius: '1rem', color: '#ffffff', fontSize: '14px', padding: '14px 16px',
        width: '100%', maxWidth: '100%', boxSizing: 'border-box',
      },
      formFieldLabel: {
        color: '#94a3b8', fontSize: '10px', fontWeight: '900',
        letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px',
        paddingLeft: '4px', marginTop: '12px',
      },
      formField: { width: '100%', maxWidth: '100%' },
      identityPreviewText: { color: '#ffffff' },
      identityPreviewEditButton: { color: '#10b981' },
      otpCodeFieldInput: {
        background: 'rgba(2,6,23,0.7)', border: '1px solid rgba(51,65,85,1)',
        borderRadius: '0.75rem', color: '#ffffff', fontSize: '20px', fontWeight: '900',
      },
      formFieldErrorText: { color: '#fca5a5', fontSize: '12px' },
      alertText: { color: '#fca5a5' },
      formResendCodeLink: { color: '#10b981', fontWeight: '700' },
      main: { width: '100%', maxWidth: '100%', minWidth: 'auto' },
      form: { width: '100%', maxWidth: '100%', minWidth: 'auto' },
    },
  };

  // Reusable social buttons block
  const renderSocialButtons = () => {
    const isClerkLoaded = clerk.loaded;
    return (
      <div className="space-y-3 mb-4">
        {/* Google Button */}
        <button
          onClick={() => handleSocialLogin('oauth_google')}
          disabled={!isClerkLoaded || !!socialLoading}
          className="w-full flex items-center justify-center gap-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 text-white font-bold py-3.5 rounded-2xl transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed text-sm"
        >
          {socialLoading === 'google' ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : <GoogleIcon />}
          Continuar com Google
        </button>

        {/* Apple Button */}
        <button
          onClick={() => handleSocialLogin('oauth_apple')}
          disabled={!isClerkLoaded || !!socialLoading}
          className="w-full flex items-center justify-center gap-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 text-white font-bold py-3.5 rounded-2xl transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed text-sm"
        >
          {socialLoading === 'apple' ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : <AppleIcon />}
          Continuar com Apple
        </button>

        {/* Error message */}
        {socialError && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {socialError}
          </div>
        )}

        {/* Divider */}
        <div className="flex items-center gap-3 my-2">
          <div className="flex-1 h-px bg-slate-800" />
          <span className="text-slate-600 text-[10px] font-black uppercase tracking-wider">ou</span>
          <div className="flex-1 h-px bg-slate-800" />
        </div>
      </div>
    );
  };

  // Reusable toggle ENTRAR / CADASTRAR
  const renderTabToggle = () => (
    <div className="flex w-full bg-slate-950/60 rounded-2xl p-1 mb-5 border border-slate-800">
      <button
        onClick={() => { setIsSignUp(false); setSocialError(null); }}
        className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
          !isSignUp ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'
        }`}
      >
        ENTRAR
      </button>
      <button
        onClick={() => { setIsSignUp(true); setSocialError(null); }}
        className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
          isSignUp ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'
        }`}
      >
        CADASTRAR
      </button>
    </div>
  );

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center p-4 bg-slate-950 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-emerald-500/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none" />

      {pendingRef ? (
        // Split-screen premium layout for referrals
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center z-10 py-8 lg:py-16">
          {/* Left info pane */}
          <div className="lg:col-span-7 flex flex-col text-left space-y-6 lg:pr-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 flex items-center justify-center shrink-0">
                <img src="/ICONE4.png" alt="GanheMais Logo" className="w-full h-full object-contain" />
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl pt-4">
              {[
                { icon: Wallet, title: 'Bônus de R$ 3,00 na Adesão', desc: 'Você já começa com R$ 3,00 de saldo na hora!' },
                { icon: Play, title: 'R$ 0,50 a R$ 2,00', desc: 'Por cada tarefa diária concluída.', fill: true },
                { icon: CheckCircle2, title: 'Check-in Diário', desc: 'Resgate recompensas diárias baseadas no seu nível.' },
                { icon: TrendingUp, title: 'Saques Imediatos', desc: 'Sem burocracia ou limites abusivos para retirada.' },
              ].map(({ icon: Icon, title, desc, fill }) => (
                <div key={title} className="bg-slate-900/40 border border-slate-800/80 backdrop-blur-md p-5 rounded-2xl flex items-start gap-4">
                  <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl shrink-0">
                    <Icon className={`w-5 h-5 ${fill ? 'fill-current' : ''}`} />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">{title}</h4>
                    <p className="text-slate-400 text-xs mt-1">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right form pane */}
          <div className="lg:col-span-5 w-full flex justify-center">
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-md bg-slate-900/70 border border-slate-800 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-[0_30px_70px_rgba(0,0,0,0.8)] flex flex-col border-b-4 border-b-emerald-500"
            >
              {/* Mobile referral banner */}
              <div className="lg:hidden w-full bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-4 flex items-center gap-3.5 mb-6 backdrop-blur-md">
                <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white font-bold shrink-0 shadow-lg animate-bounce">
                  <Gift className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-[10px] font-black text-emerald-400 uppercase tracking-wider">CONVITE DE AFILIADO</h3>
                  <p className="text-xs text-slate-300 font-semibold">
                    Você foi convidado por <span className="text-white font-black">{inviterName || pendingRef}</span>!
                  </p>
                </div>
              </div>
              {renderTabToggle()}
              {renderSocialButtons()}
              {isSignUp ? (
                <SignUp appearance={clerkAppearance} forceRedirectUrl="/" fallbackRedirectUrl="/" />
              ) : (
                <SignIn appearance={clerkAppearance} forceRedirectUrl="/" fallbackRedirectUrl="/" />
              )}
            </motion.div>
          </div>
        </div>
      ) : (
        // Standard centered layout
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md bg-slate-900/70 border border-slate-800 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-[0_30px_70px_rgba(0,0,0,0.8)] z-10 flex flex-col border-b-4 border-b-emerald-500"
        >
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-10 h-10 flex items-center justify-center shrink-0">
              <img src="/ICONE4.png" alt="GanheMais Logo" className="w-full h-full object-contain" />
            </div>
            <span className="text-2xl font-black tracking-tighter italic text-white">GanheMais</span>
          </div>
          {renderTabToggle()}
          {renderSocialButtons()}
          {isSignUp ? (
            <SignUp appearance={clerkAppearance} forceRedirectUrl="/" fallbackRedirectUrl="/" />
          ) : (
            <SignIn appearance={clerkAppearance} forceRedirectUrl="/" fallbackRedirectUrl="/" />
          )}
        </motion.div>
      )}
    </div>
  );
}
