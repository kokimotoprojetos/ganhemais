'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  CreditCard, 
  User, 
  Mail, 
  FileText, 
  QrCode, 
  Copy, 
  Check, 
  Clock, 
  Zap, 
  TrendingUp, 
  AlertCircle,
  HelpCircle,
  Sparkles
} from 'lucide-react';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (amount: number, plan?: 'Silver' | 'Gold') => void;
  predefinedAmount: number | null;
  predefinedPlan: 'Silver' | 'Gold' | null;
}

export function DepositModal({ isOpen, onClose, onSuccess, predefinedAmount, predefinedPlan }: DepositModalProps) {
  const [step, setStep] = useState<'input' | 'loading' | 'checkout' | 'success'>('input');
  
  // Input fields
  const [amount, setAmount] = useState(predefinedAmount ? predefinedAmount.toString() : '30.00');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [document, setDocument] = useState('');
  
  // Errors and Loaders
  const [validationError, setValidationError] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  
  // Payment result
  const [paymentData, setPaymentData] = useState<{
    txid: string;
    copyPaste: string;
    qrcode: string;
    expiresAt: string;
    amount: number;
    isSimulated?: boolean;
  } | null>(null);

  // Time and Polling states
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Sync predefined values if modal opens with different context
  useEffect(() => {
    if (isOpen) {
      setStep('input');
      setAmount(predefinedAmount ? predefinedAmount.toString() : '30.00');
      setValidationError(null);
      setErrorMessage(null);
      setPaymentData(null);
      setIsCopied(false);
    }
  }, [isOpen, predefinedAmount]);

  // Formatting CPF as user types (XXX.XXX.XXX-XX)
  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const digits = value.replace(/\D/g, '');
    let formatted = digits;
    if (digits.length > 3) formatted = `${digits.substring(0, 3)}.${digits.substring(3)}`;
    if (digits.length > 6) formatted = `${formatted.substring(0, 7)}.${digits.substring(6)}`;
    if (digits.length > 9) formatted = `${formatted.substring(0, 11)}-${digits.substring(9, 11)}`;
    setDocument(formatted.substring(0, 14));
  };

  // Timer Countdown Effect
  useEffect(() => {
    if (step !== 'checkout' || timeLeft <= 0) return;
    
    const interval = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [step, timeLeft]);

  // Automatic Polling Effect
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
            onSuccess(paymentData.amount, predefinedPlan || undefined);
          }
        }
      } catch (err) {
        console.error('Polling status error:', err);
      }
    };

    // Poll every 4 seconds
    pollingRef.current = setInterval(checkStatus, 4000);

    return () => stopPolling();
  }, [step, paymentData]);

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  // Format time remaining
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle Form Submission
  const handleGeneratePix = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setErrorMessage(null);

    // Validations
    const cleanCpf = document.replace(/\D/g, '');
    const numAmount = parseFloat(amount);

    if (!predefinedAmount && (isNaN(numAmount) || numAmount < 10.00)) {
      setValidationError('O valor mínimo de depósito é R$ 10,00.');
      return;
    }

    if (!name.trim() || name.trim().split(' ').length < 2) {
      setValidationError('Por favor, insira seu nome completo (Nome e Sobrenome).');
      return;
    }

    if (cleanCpf.length !== 11) {
      setValidationError('Insira um CPF válido contendo 11 dígitos.');
      return;
    }

    setStep('loading');

    try {
      const response = await fetch('/api/payment/deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: numAmount,
          name: name.trim(),
          email: email.trim(),
          document: cleanCpf,
          plan: predefinedPlan
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
        amount: numAmount,
        isSimulated: data.isSimulated
      });
      setTimeLeft(600); // 10 minutes
      setStep('checkout');

    } catch (err: any) {
      console.error('Submit deposit error:', err);
      setErrorMessage(err.message || 'Houve um erro no servidor. Tente novamente mais tarde.');
      setStep('input');
    }
  };

  // Pix Copy Paste Action
  const copyToClipboard = () => {
    if (!paymentData) return;
    navigator.clipboard.writeText(paymentData.copyPaste);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Simulate Payment Success (Sandbox Override)
  const handleSimulatePayment = async () => {
    if (!paymentData) return;

    try {
      const response = await fetch('/api/payment/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          txid: paymentData.txid,
          status: 'paid'
        })
      });

      if (response.ok) {
        stopPolling();
        setStep('success');
        onSuccess(paymentData.amount, predefinedPlan || undefined);
      } else {
        const errorData = await response.json();
        alert(`Erro na simulação: ${errorData.message}`);
      }
    } catch (err) {
      console.error('Simulation payment error:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop glassmorphism overlay */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => step !== 'loading' && onClose()}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-md"
        />

        {/* Modal Box */}
        <motion.div 
          initial={{ scale: 0.95, y: 15, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.95, y: 15, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 250 }}
          className="relative bg-white border border-slate-200/80 w-full max-w-lg rounded-[2.5rem] p-8 shadow-[0_30px_70px_rgba(0,0,0,0.15)] z-10 overflow-hidden flex flex-col"
        >
          {/* Top Close Button */}
          {step !== 'loading' && (
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 rounded-full text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          {/* Form Step */}
          {step === 'input' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-inner">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">
                    {predefinedPlan ? 'Assinar com Pix' : 'Depositar na Carteira'}
                  </h3>
                  <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Gateway de Pagamento Seguro</p>
                </div>
              </div>

              {/* Predefined Plan Header */}
              {predefinedPlan ? (
                <div className="bg-gradient-to-r from-indigo-50 to-emerald-50 rounded-2xl p-5 border border-indigo-100 flex justify-between items-center shadow-sm">
                  <div>
                    <p className="text-[10px] text-indigo-500 font-black uppercase tracking-wider mb-0.5">Plano Selecionado</p>
                    <h4 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-1.5">
                      Acesso {predefinedPlan} 
                      <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500 animate-pulse" />
                    </h4>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">Preço</p>
                    <span className="text-xl font-black text-indigo-600">R$ {parseFloat(amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              ) : (
                /* Custom Amount Picker */
                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Valor do Depósito (R$)</label>
                  <div className="relative">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-lg font-black text-slate-300">R$</span>
                    <input 
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0,00"
                      step="0.01"
                      min="10"
                      className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl pl-14 pr-6 py-4.5 font-black text-2xl tracking-tight text-slate-800 outline-none focus:border-emerald-500 focus:bg-white transition-all shadow-sm"
                    />
                  </div>

                  {/* Quick amount chips */}
                  <div className="grid grid-cols-4 gap-3">
                    {['20.00', '50.00', '100.00', '200.00'].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setAmount(val)}
                        className={`py-2 px-1 rounded-xl text-xs font-black transition-all ${
                          amount === val 
                            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                            : 'bg-slate-50 text-slate-500 border border-slate-100 hover:bg-slate-100'
                        }`}
                      >
                        + R$ {parseInt(val)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Payment Details Form */}
              <form onSubmit={handleGeneratePix} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                    <User className="w-3.5 h-3.5" /> Nome Completo (Pagador)
                  </label>
                  <input 
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Rodrigo Santos Silva"
                    className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-3.5 font-bold text-sm text-slate-800 outline-none focus:border-emerald-500 focus:bg-white transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" /> CPF do Titular
                    </label>
                    <input 
                      type="text"
                      required
                      value={document}
                      onChange={handleCpfChange}
                      placeholder="123.456.789-01"
                      className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-3.5 font-bold text-sm text-slate-800 outline-none focus:border-emerald-500 focus:bg-white transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5" /> E-mail (Opcional)
                    </label>
                    <input 
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seuemail@exemplo.com"
                      className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-3.5 font-bold text-sm text-slate-800 outline-none focus:border-emerald-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                {/* Validation and Error Alerts */}
                {validationError && (
                  <div className="bg-red-50 text-red-600 border border-red-100 rounded-xl p-3 text-xs font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{validationError}</span>
                  </div>
                )}

                {errorMessage && (
                  <div className="bg-amber-50 text-amber-700 border border-amber-100 rounded-xl p-3 text-xs font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full mt-4 bg-slate-900 text-white py-4.5 rounded-2xl font-black text-sm tracking-wide shadow-xl hover:bg-slate-800 hover:shadow-slate-900/10 active:scale-[0.99] transition-all"
                >
                  GERAR PIX DE R$ {parseFloat(amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </button>
              </form>
            </div>
          )}

          {/* Loading Step */}
          {step === 'loading' && (
            <div className="py-16 flex flex-col items-center justify-center space-y-6 text-center">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                className="w-14 h-14 border-4 border-emerald-500 border-t-transparent rounded-full shadow-[0_0_15px_rgba(16,185,129,0.2)]"
              />
              <div>
                <h4 className="text-lg font-black text-slate-800 tracking-tight">Gerando QR Code</h4>
                <p className="text-slate-400 font-medium text-xs mt-1">Gerando Pix dinâmico com chave de acesso segura...</p>
              </div>
            </div>
          )}

          {/* Checkout Pix Screen */}
          {step === 'checkout' && paymentData && (
            <div className="space-y-6 text-center flex flex-col items-center">
              <div className="w-full flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="text-left">
                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Depósito Pix</span>
                  <h3 className="text-lg font-black text-slate-800 tracking-tight">R$ {paymentData.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full text-xs font-black">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{formatTime(timeLeft)}</span>
                </div>
              </div>

              {/* QR Code Canvas */}
              <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-[2rem] shadow-inner relative group">
                <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(paymentData.copyPaste)}`} 
                    alt="Pix QR Code" 
                    className="w-44 h-44 pointer-events-none"
                  />
                </div>
                <div className="absolute -top-3 -right-3 w-7 h-7 bg-emerald-500 text-white rounded-full flex items-center justify-center text-xs font-black shadow-lg shadow-emerald-500/30">
                  <QrCode className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Sub-header instruction */}
              <div className="max-w-xs">
                <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                  Abra o aplicativo do seu banco, escolha a opção **Pagar com Pix** e escaneie o QR Code acima.
                </p>
              </div>

              {/* Pix Copia e Cola Field */}
              <div className="w-full space-y-2">
                <label className="text-[10px] text-slate-400 font-black uppercase tracking-widest text-left w-full block">Pix Copia e Cola</label>
                <div className="flex bg-slate-50 border border-slate-200/80 rounded-2xl p-1.5 items-center w-full">
                  <div className="flex-1 px-4 font-bold text-xs text-slate-400 overflow-hidden text-ellipsis whitespace-nowrap text-left select-all">
                    {paymentData.copyPaste}
                  </div>
                  <button 
                    onClick={copyToClipboard}
                    className={`px-5 py-3 rounded-xl font-black text-xs transition-all flex items-center gap-1.5 shadow-md ${
                      isCopied 
                        ? 'bg-emerald-500 text-white shadow-emerald-500/20' 
                        : 'bg-white text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-4 h-4" /> COPIADO
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-slate-400" /> COPIAR
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="w-full flex items-center justify-center gap-2 pt-2 text-xs text-slate-400 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                <span>Aguardando transferência bancária em tempo real...</span>
              </div>

              {/* SANDBOX TEST SIMULATOR ACTION */}
              {paymentData.isSimulated && (
                <div className="w-full border-t border-dashed border-slate-200 pt-5 mt-4 space-y-2">
                  <div className="inline-flex items-center gap-1 text-[10px] font-black tracking-wider uppercase text-amber-600 bg-amber-50 border border-amber-100 px-3 py-1 rounded-full">
                    <Zap className="w-3 h-3 fill-amber-500 text-amber-500" /> Modo de Testes Ativo
                  </div>
                  <button
                    onClick={handleSimulatePayment}
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-sm py-4 rounded-2xl shadow-xl shadow-amber-200 hover:from-amber-600 hover:to-orange-600 transition-all scale-100 hover:scale-[1.01] active:scale-[0.99]"
                  >
                    SIMULAR PAGAMENTO COM SUCESSO
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Success Screen */}
          {step === 'success' && paymentData && (
            <div className="py-8 text-center flex flex-col items-center space-y-6">
              <motion.div 
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-20 h-20 bg-emerald-100 border-4 border-white text-emerald-600 rounded-full flex items-center justify-center shadow-xl shadow-emerald-100"
              >
                <Check className="w-10 h-10 stroke-[3]" />
              </motion.div>

              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Depósito Confirmado!</h3>
                <p className="text-slate-500 text-sm font-semibold max-w-xs mx-auto leading-relaxed">
                  O valor de **R$ {paymentData.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}** foi identificado e creditado com sucesso.
                </p>
                {predefinedPlan && (
                  <div className="inline-flex items-center gap-1.5 text-xs text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-full px-4 py-1.5 font-black mt-3">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span>Plano {predefinedPlan} ativo com sucesso!</span>
                  </div>
                )}
              </div>

              <button
                onClick={onClose}
                className="w-full bg-slate-900 text-white py-4.5 rounded-2xl font-black text-sm tracking-wide shadow-xl hover:bg-slate-800 hover:shadow-slate-900/10 active:scale-[0.99] transition-all"
              >
                VOLTAR AO PAINEL
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
