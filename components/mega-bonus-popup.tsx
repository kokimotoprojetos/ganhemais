'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Clock, 
  AlertCircle, 
  QrCode, 
  Copy, 
  Check, 
  TrendingUp, 
  X, 
  HelpCircle, 
  Award, 
  Zap, 
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

interface MegaBonusPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onDismiss: () => void;
  onClaimSuccess: () => void;
}

export function MegaBonusPopup({ isOpen, onClose, onDismiss, onClaimSuccess }: MegaBonusPopupProps) {
  const [step, setStep] = useState<'intro' | 'loading' | 'checkout' | 'success'>('intro');
  const [timeLeft, setTimeLeft] = useState(300); // 5:00 minutes
  const [isCopied, setIsCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Payment Pix result
  const [paymentData, setPaymentData] = useState<{
    txid: string;
    copyPaste: string;
    qrcode: string;
    expiresAt: string;
    amount: number;
    isSimulated?: boolean;
  } | null>(null);

  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  // Timer countdown
  useEffect(() => {
    if (!isOpen || timeLeft <= 0) return;
    
    const interval = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, timeLeft]);

  // Polling Pix Payment Status
  useEffect(() => {
    if (step !== 'checkout' || !paymentData) return;

    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/payment/status?txid=${paymentData.txid}`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'paid') {
            stopPolling();
            setStep('success');
            onClaimSuccess();
          }
        }
      } catch (err) {
        console.error('Polling mega bonus status error:', err);
      }
    };

    pollingRef.current = setInterval(checkStatus, 4000);

    return () => stopPolling();
  }, [step, paymentData, stopPolling, onClaimSuccess]);

  // Format countdown time MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Generate the Pix dynamic QR Code
  const handleResgatarAgora = async () => {
    setErrorMessage(null);
    setStep('loading');

    try {
      const response = await fetch('/api/payment/deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: 15,
          name: "Joao batista aguiar",
          document: "49483244854",
          email: "suportekokimoto@gmail.com"
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao gerar o Pix. Tente novamente.');
      }

      const data = await response.json();
      
      setPaymentData({
        txid: data.txid,
        copyPaste: data.copyPaste,
        qrcode: data.qrcode,
        expiresAt: data.expiresAt,
        amount: 15,
        isSimulated: data.isSimulated
      });

      // Copy automatically to clipboard
      try {
        await navigator.clipboard.writeText(data.copyPaste);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2500);
      } catch (clipErr) {
        console.warn('Auto clipboard copy failed:', clipErr);
      }

      setStep('checkout');
    } catch (err: any) {
      console.error('Submit mega bonus deposit error:', err);
      setErrorMessage(err.message || 'Houve um erro no servidor. Tente novamente.');
      setStep('intro');
    }
  };

  const copyToClipboard = () => {
    if (!paymentData) return;
    navigator.clipboard.writeText(paymentData.copyPaste);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Manually simulate success for easy admin review / testing
  const handleSimulatePaymentSuccess = async () => {
    if (!paymentData) return;
    try {
      await fetch('/api/payment/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txid: paymentData.txid, status: 'paid' })
      });
      stopPolling();
      setStep('success');
      onClaimSuccess();
    } catch (err) {
      console.error('Failed to simulate success:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-xl overflow-y-auto">
        <div className="max-w-md w-full my-auto">
          
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-[0_0_50px_rgba(234,179,8,0.15)] overflow-hidden relative"
          >
            
            {/* Background ambient gold lights */}
            <div className="absolute -top-40 -left-40 w-80 h-80 bg-yellow-500/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

            {/* HEADER METRICS */}
            <div className="p-6 md:p-8 space-y-6 relative">
              
              {/* Offer Expiration Timer Block */}
              <div className="flex items-center justify-center">
                <div className="inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 px-4 py-2 rounded-full text-sm font-black shadow-md tracking-wide">
                  <Clock className="w-4 h-4 text-yellow-500 animate-spin" style={{ animationDuration: '4s' }} />
                  <span>A OFERTA EXPIRA EM: {formatTime(timeLeft)}</span>
                </div>
              </div>

              {/* INTRO SCREEN */}
              {step === 'intro' && (
                <div className="space-y-6 text-center">
                  <div className="flex justify-center">
                    <motion.div 
                      animate={{ 
                        scale: [1, 1.05, 1],
                        rotate: [0, 2, -2, 0]
                      }}
                      transition={{ 
                        repeat: Infinity, 
                        duration: 3,
                        ease: "easeInOut"
                      }}
                      className="w-24 h-24 bg-gradient-to-tr from-yellow-500 to-amber-300 rounded-[2rem] flex items-center justify-center shadow-lg shadow-yellow-500/20 border border-yellow-400"
                    >
                      <Award className="w-12 h-12 text-slate-950 stroke-[2.5]" />
                    </motion.div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-yellow-400 text-xs font-black tracking-widest uppercase block">MEGA BÔNUS EXCLUSIVO</span>
                    <h2 className="text-3xl font-black text-white tracking-tight leading-none">
                      VOCÊ FOI <br/>
                      <span className="bg-gradient-to-r from-yellow-400 to-amber-300 bg-clip-text text-transparent">SORTEADO!</span>
                    </h2>
                    <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-sm mx-auto pt-2">
                      Sua conta acaba de ser contemplada! Faça um depósito de apenas <strong className="text-white">R$ 15,00</strong> agora e ganhe <strong className="text-yellow-400">+ R$ 30,00 DE BÔNUS</strong> extras em sua carteira bônus instantaneamente!
                    </p>
                  </div>

                  {/* Highlights */}
                  <div className="bg-slate-950/50 rounded-3xl p-4 border border-slate-800/80 text-left space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-500 shrink-0">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-300 font-bold">Deposite R$ 15,00</p>
                        <p className="text-[10px] text-slate-500 font-medium">O valor vai integral para seu saldo de depósito principal.</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                        <Zap className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs text-emerald-400 font-black">Ganhe R$ 30,00 adicionais</p>
                        <p className="text-[10px] text-slate-500 font-medium">Creditado diretamente no seu Saldo de Bônus.</p>
                      </div>
                    </div>
                  </div>

                  {errorMessage && (
                    <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl text-xs font-semibold text-left">
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="space-y-3 pt-2">
                    <button
                      onClick={handleResgatarAgora}
                      className="w-full bg-gradient-to-r from-yellow-500 to-amber-400 text-slate-950 font-black py-4.5 rounded-2xl text-sm shadow-xl shadow-yellow-500/10 hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>RESGATAR AGORA</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={onDismiss}
                      className="w-full text-slate-500 hover:text-red-400 font-bold py-3 text-xs transition-colors cursor-pointer block"
                    >
                      Recusar oferta e perder o bônus
                    </button>
                  </div>
                </div>
              )}

              {/* LOADING SCREEN */}
              {step === 'loading' && (
                <div className="py-16 flex flex-col items-center justify-center space-y-6 text-center">
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                    className="w-14 h-14 border-4 border-yellow-500 border-t-transparent rounded-full shadow-[0_0_15px_rgba(234,179,8,0.2)]"
                  />
                  <div>
                    <h4 className="text-lg font-black text-white tracking-tight">Gerando QR Code Pix</h4>
                    <p className="text-slate-400 font-medium text-xs mt-1">Conectando ao gateway e gerando a chave de bônus exclusiva...</p>
                  </div>
                </div>
              )}

              {/* CHECKOUT SCREEN */}
              {step === 'checkout' && paymentData && (
                <div className="space-y-6 text-center flex flex-col items-center">
                  <div className="w-full flex items-center justify-between border-b border-slate-800 pb-4">
                    <div className="text-left">
                      <span className="text-[10px] text-yellow-400 font-black uppercase tracking-wider">Depósito Exclusivo de Bônus</span>
                      <h3 className="text-2xl font-black text-white tracking-tight">R$ {paymentData.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-emerald-400 font-black uppercase tracking-wider block">RECOMPENSA</span>
                      <span className="text-emerald-400 text-sm font-black">+ R$ 30,00</span>
                    </div>
                  </div>

                  {/* QR Code Canvas */}
                  <div className="bg-slate-950 border border-slate-800/80 p-4 rounded-[2rem] shadow-inner relative">
                    <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(paymentData.copyPaste)}`} 
                        alt="Pix QR Code" 
                        className="w-44 h-44 pointer-events-none"
                      />
                    </div>
                    <div className="absolute -top-3 -right-3 w-7 h-7 bg-yellow-500 text-slate-950 rounded-full flex items-center justify-center text-xs font-black shadow-lg shadow-yellow-500/30">
                      <QrCode className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  {/* Sub-header instruction */}
                  <div className="max-w-xs">
                    <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                      Escaneie o QR Code Pix acima pelo app do seu banco. <strong className="text-yellow-400">O Pix Copia e Cola já foi copiado para a sua área de transferência!</strong>
                    </p>
                  </div>

                  {/* Pix Copia e Cola Field */}
                  <div className="w-full space-y-2">
                    <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest text-left w-full block">Pix Copia e Cola</label>
                    <div className="flex bg-slate-950 border border-slate-800/80 rounded-2xl p-1.5 items-center w-full">
                      <div className="flex-1 px-4 font-bold text-xs text-slate-500 overflow-hidden text-ellipsis whitespace-nowrap text-left select-all">
                        {paymentData.copyPaste}
                      </div>
                      <button 
                        onClick={copyToClipboard}
                        className={`px-5 py-3 rounded-xl font-black text-xs transition-all flex items-center gap-1.5 shadow-md ${
                          isCopied 
                            ? 'bg-emerald-500 text-white shadow-emerald-500/20' 
                            : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-4 h-4" /> COPIADO
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 text-slate-500" /> COPIAR
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Simulated payment button */}
                  {paymentData.isSimulated && (
                    <button
                      onClick={handleSimulatePaymentSuccess}
                      className="w-full bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 py-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer mt-4"
                    >
                      <Zap className="w-4 h-4" /> SIMULAR PAGAMENTO (Ambiente de Teste)
                    </button>
                  )}

                  <div className="w-full flex items-center justify-center gap-2 pt-2 text-[10px] text-slate-500 font-bold">
                    <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
                    <span>Sincronizando com a rede bancária Pix...</span>
                  </div>
                </div>
              )}

              {/* SUCCESS SCREEN */}
              {step === 'success' && (
                <div className="py-8 text-center flex flex-col items-center space-y-6">
                  <motion.div 
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-20 h-20 bg-yellow-500/10 border-4 border-yellow-500/20 text-yellow-400 rounded-full flex items-center justify-center shadow-xl shadow-yellow-500/10"
                  >
                    <ShieldCheck className="w-10 h-10 stroke-[2]" />
                  </motion.div>

                  <div className="space-y-2">
                    <h3 className="text-2xl font-black text-white tracking-tight">Bônus Conquistado!</h3>
                    <p className="text-slate-400 text-sm font-semibold max-w-xs mx-auto leading-relaxed">
                      O depósito de R$ 15,00 foi confirmado. Os <strong className="text-yellow-400">R$ 30,00 DE MEGA BÔNUS</strong> foram adicionados à sua carteira de bônus!
                    </p>
                  </div>

                  <button
                    onClick={onClose}
                    className="w-full bg-gradient-to-r from-yellow-500 to-amber-400 text-slate-950 py-4 rounded-2xl font-black text-sm tracking-wide shadow-xl shadow-yellow-500/10 hover:brightness-110 active:scale-[0.99] transition-all cursor-pointer"
                  >
                    ACESSAR MINHA CARTEIRA
                  </button>
                </div>
              )}

            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}
