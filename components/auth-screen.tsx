'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useSignIn, useSignUp } from '@clerk/nextjs';
import { motion } from 'motion/react';
import { 
  Zap, 
  Lock, 
  Mail, 
  ArrowRight, 
  Gift, 
  AlertCircle,
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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [inviterName, setInviterName] = useState<string | null>(null);
  const [fetchingInviter, setFetchingInviter] = useState(false);

  const { signUp } = useSignUp();
  const { signIn } = useSignIn();

  const [pendingVerification, setPendingVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');

  // Fetch the inviter username/email on mount when referral code is present
  useEffect(() => {
    if (pendingRef) {
      const fetchInviter = async () => {
        setFetchingInviter(true);
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
        } finally {
          setFetchingInviter(false);
        }
      };

      fetchInviter();
    }
  }, [pendingRef]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      if (isSignUp) {
        if (!signUp) return;
        
        // Start sign up with Clerk
        const result = await signUp.create({
          emailAddress: email,
          password,
        });

        if (result.error) {
          throw result.error;
        }

        if (signUp.status === 'complete') {
          const finalizeResult = await signUp.finalize();
          if (finalizeResult.error) {
            throw finalizeResult.error;
          }
          onAuthSuccess();
        } else {
          // Send verification email
          const verifyResult = await signUp.verifications.sendEmailCode();
          if (verifyResult.error) {
            throw verifyResult.error;
          }
          setPendingVerification(true);
        }
      } else {
        if (!signIn) return;
        
        // Sign in with Clerk
        const result = await signIn.create({
          identifier: email,
          password,
        });

        if (result.error) {
          throw result.error;
        }

        if (signIn.status === 'complete') {
          const finalizeResult = await signIn.finalize();
          if (finalizeResult.error) {
            throw finalizeResult.error;
          }
          onAuthSuccess();
        } else {
          setErrorMsg('Requisitos adicionais de login pendentes.');
        }
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      // Map common Clerk errors or standard errors to friendly Portuguese messages
      let message = err.errors?.[0]?.longMessage || err.message || 'Erro de autenticação.';
      if (message.includes('Password should be') || message.includes('password is too weak')) {
        message = 'A senha deve ter pelo menos 8 caracteres.';
      } else if (message.includes('already exists') || message.includes('already registered')) {
        message = 'Este e-mail já está cadastrado.';
      } else if (message.includes('matches no user') || message.includes('incorrect password') || message.includes('Invalid credentials')) {
        message = 'E-mail ou senha incorretos.';
      }
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUp) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      const result = await signUp.verifications.verifyEmailCode({
        code: verificationCode,
      });

      if (result.error) {
        throw result.error;
      }

      if (signUp.status === 'complete') {
        const finalizeResult = await signUp.finalize();
        if (finalizeResult.error) {
          throw finalizeResult.error;
        }
        onAuthSuccess();
      } else {
        setErrorMsg('Não foi possível verificar o e-mail. Verifique o código e tente novamente.');
      }
    } catch (err: any) {
      console.error('Verification error:', err);
      let message = err.errors?.[0]?.longMessage || err.message || 'Código inválido.';
      if (message.includes('incorrect') || message.includes('invalid')) {
        message = 'Código de verificação incorreto ou expirado.';
      }
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  const renderVerificationForm = () => {
    return (
      <form onSubmit={handleVerificationSubmit} className="w-full space-y-5">
        <div className="space-y-2">
          <label className="text-[10px] text-slate-400 font-black uppercase tracking-widest block ml-1">Código de Confirmação</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
            <input 
              type="text" 
              required
              maxLength={6}
              placeholder="Digite o código recebido"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-2xl pl-12 pr-4 py-4 text-sm font-semibold placeholder-slate-600 focus:border-emerald-500 focus:outline-none transition-colors tracking-widest text-center font-mono"
            />
          </div>
        </div>

        {errorMsg && (
          <motion.div 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3 p-4 rounded-2xl text-xs font-semibold leading-relaxed border bg-red-500/10 border-red-500/20 text-red-400"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </motion.div>
        )}

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
              CONFIRMAR E COMEÇAR
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </motion.button>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => {
              setPendingVerification(false);
              setErrorMsg(null);
            }}
            className="text-xs text-slate-400 font-bold hover:underline bg-transparent border-none outline-none cursor-pointer"
          >
            Voltar para o cadastro
          </button>
        </div>
      </form>
    );
  };

  const renderForm = () => {
    return (
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
            className="flex items-start gap-3 p-4 rounded-2xl text-xs font-semibold leading-relaxed border bg-red-500/10 border-red-500/20 text-red-400"
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

        {/* Toggle Mode */}
        <div className="mt-6 text-center">
          <p className="text-xs text-slate-400 font-semibold font-sans">
            {isSignUp ? 'Já possui uma conta?' : 'Ainda não tem conta?'}
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorMsg(null);
              }}
              className="text-emerald-400 font-black ml-1 hover:underline cursor-pointer bg-transparent border-none outline-none font-sans"
            >
              {isSignUp ? 'Entrar' : 'Cadastre-se'}
            </button>
          </p>
        </div>
      </form>
    );
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center p-4 bg-slate-950 relative overflow-hidden">
      {/* Decorative gradient glowing spheres */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-emerald-500/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none"></div>

      {pendingRef ? (
        // Split-screen premium layout for referrals
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center z-10 py-8 lg:py-16">
          {/* Welcome Left Pane (Visible on Desktop) */}
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
                Seu amigo <span className="text-emerald-400 font-black relative">{inviterName || pendingRef}</span> te convidou para lucrar!
              </h1>
              
              <p className="text-slate-400 text-sm lg:text-base font-semibold leading-relaxed max-w-xl">
                Junte-se à maior plataforma brasileira de micro-tarefas digitais. Assista a vídeos do YouTube, responda a questionários econômicos de relevância nacional e receba recompensas reais direto via Pix!
              </p>
            </div>

            {/* Micro Dashboard / Benefit cards */}
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

          {/* Form Pane (Right Pane / Mobile Main Card) */}
          <div className="lg:col-span-5 w-full flex justify-center">
            <motion.div 
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-md bg-slate-900/60 border border-slate-800 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-[0_30px_70px_rgba(0,0,0,0.8)] flex flex-col border-b-4 border-b-emerald-500"
            >
              {/* Mobile welcome banner */}
              <div className="lg:hidden w-full bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-4 flex items-center gap-3.5 mb-6 backdrop-blur-md">
                <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white font-bold shrink-0 shadow-lg shadow-emerald-500/20 animate-bounce">
                  <Gift className="w-5 h-5" />
                </div>
                <div className="overflow-hidden">
                  <h3 className="text-[10px] font-black text-emerald-400 uppercase tracking-wider">CONVITE DE AFILIADO</h3>
                  <p className="text-xs text-slate-300 font-semibold leading-normal truncate">
                    Você foi convidado por <span className="text-white font-black">{inviterName || pendingRef}</span>!
                  </p>
                </div>
              </div>

              {/* Form header inside card */}
              <div className="flex flex-col items-center mb-6">
                <div className="flex items-center gap-2 mb-4 lg:hidden">
                  <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white font-bold shrink-0">
                    <Zap className="w-4 h-4 fill-current" />
                  </div>
                  <span className="text-xl font-black tracking-tighter italic text-white">GanheMais</span>
                </div>
                <h2 className="text-2xl font-black tracking-tight text-white mb-2 text-center">
                  {pendingVerification ? 'Confirme seu E-mail' : (isSignUp ? 'Crie sua Conta Grátis' : 'Entrar no GanheMais')}
                </h2>
                <p className="text-slate-400 text-xs font-semibold text-center">
                  {pendingVerification 
                    ? 'Digite o código enviado para o seu endereço de e-mail' 
                    : (isSignUp 
                      ? 'Comece a lucrar assistindo a vídeos e respondendo questionários' 
                      : 'Acesse o seu painel de ganhos diários')}
                </p>
              </div>

              {/* Render signup, login, or verification form */}
              {pendingVerification ? renderVerificationForm() : renderForm()}
            </motion.div>
          </div>
        </div>
      ) : (
        // Standard full centered layout when no pendingRef
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

          <h2 className="text-2xl font-black tracking-tight text-white mb-2 text-center">
            {pendingVerification ? 'Confirme seu E-mail' : (isSignUp ? 'Crie sua Conta Grátis' : 'Entrar no GanheMais')}
          </h2>
          <p className="text-slate-400 text-xs font-semibold text-center mb-8">
            {pendingVerification 
              ? 'Digite o código enviado para o seu endereço de e-mail' 
              : (isSignUp 
                ? 'Comece a lucrar assistindo a vídeos e respondendo questionários' 
                : 'Acesse o seu painel de ganhos diários')}
          </p>

          {pendingVerification ? renderVerificationForm() : renderForm()}
        </motion.div>
      )}
    </div>
  );
}
