'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  ArrowUpRight, 
  User, 
  Key, 
  HelpCircle, 
  AlertCircle, 
  Check, 
  Sparkles,
  Percent,
  Wallet,
  Clock,
  Download,
  AlertTriangle,
  Lock
} from 'lucide-react';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  balance: number;
  onSuccess: (amount: number) => Promise<boolean>;
  trackAppDownload: () => void;
  plan: 'Basic' | 'Silver' | 'Gold' | 'Diamond';
  onRedirectToPlans: () => void;
}

type PixKeyType = 'cpf' | 'email' | 'phone' | 'random';

export function WithdrawModal({ isOpen, onClose, balance, onSuccess, trackAppDownload, plan, onRedirectToPlans }: WithdrawModalProps) {
  const [step, setStep] = useState<'input' | 'loading' | 'success'>('input');
  
  // Inputs
  const [amount, setAmount] = useState('');
  const [pixKeyType, setPixKeyType] = useState<PixKeyType>('cpf');
  const [pixKey, setPixKey] = useState('');
  const [fullName, setFullName] = useState('');
  
  // Errors and validation
  const [validationError, setValidationError] = useState<string | null>(null);
  
  // Financial calculation variables
  const numAmount = parseFloat(amount) || 0;
  const feePercent = 3; // 3% fee
  const feeAmount = numAmount * (feePercent / 100);
  const netAmount = Math.max(0, numAmount - feeAmount);

  // Sync / Reset when modal opens
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setStep('input');
      setAmount(balance.toFixed(2)); // Default to full balance
      setPixKey('');
      setFullName('');
      setValidationError(null);
    }
  }

  // Format Pix key according to selected type
  const handlePixKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (pixKeyType === 'cpf') {
      const digits = val.replace(/\D/g, '');
      let formatted = digits;
      if (digits.length > 3) formatted = `${digits.substring(0, 3)}.${digits.substring(3)}`;
      if (digits.length > 6) formatted = `${formatted.substring(0, 7)}.${digits.substring(6)}`;
      if (digits.length > 9) formatted = `${formatted.substring(0, 11)}-${digits.substring(9, 11)}`;
      setPixKey(formatted.substring(0, 14));
    } else if (pixKeyType === 'phone') {
      const digits = val.replace(/\D/g, '');
      let formatted = digits;
      if (digits.length > 0) formatted = `(${digits.substring(0, 2)}`;
      if (digits.length > 2) formatted = `${formatted}) ${digits.substring(2, 7)}`;
      if (digits.length > 7) formatted = `${formatted}-${digits.substring(7, 11)}`;
      setPixKey(formatted.substring(0, 15));
    } else {
      setPixKey(val);
    }
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Amount checks
    if (isNaN(numAmount) || numAmount < 20.00) {
      setValidationError('O valor mínimo de saque é R$ 20,00.');
      return;
    }

    if (numAmount > balance) {
      setValidationError(`Saldo insuficiente. Seu saldo disponível é R$ ${balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`);
      return;
    }

    // Pix Key check
    if (!pixKey.trim()) {
      setValidationError('Por favor, insira a sua chave Pix.');
      return;
    }

    // Name check
    if (!fullName.trim() || fullName.trim().split(' ').length < 2) {
      setValidationError('Por favor, insira seu nome completo (Nome e Sobrenome).');
      return;
    }

    setStep('loading');

    // Simulate transfer wait time
    setTimeout(async () => {
      const success = await onSuccess(numAmount);
      if (success) {
        setStep('success');
      } else {
        setValidationError('Ocorreu um erro ao processar o saque. Tente novamente.');
        setStep('input');
      }
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop overlay */}
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
          className="relative bg-white border border-slate-200/80 w-full max-w-lg rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-8 shadow-[0_30px_70px_rgba(0,0,0,0.15)] z-10 overflow-hidden flex flex-col"
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
            plan === 'Basic' ? (
              <div className="space-y-6 text-center py-6 flex flex-col items-center">
                <div className="w-16 h-16 bg-red-50 border border-red-100 text-red-600 rounded-3xl flex items-center justify-center shadow-md animate-bounce">
                  <Lock className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">
                    Plano VIP Necessário
                  </h3>
                  <p className="text-red-600 text-[10px] font-black uppercase tracking-widest mt-1">Recurso Bloqueado</p>
                </div>
                <p className="text-slate-500 text-sm font-semibold max-w-sm leading-relaxed">
                  Para solicitar saques na plataforma, você precisa ter um plano ativo (**Silver**, **Gold** ou **Diamante**). 
                  O plano básico gratuito não possui permissão para saques imediatos.
                </p>
                <div className="w-full space-y-3 pt-4">
                  <button
                    onClick={onRedirectToPlans}
                    className="w-full bg-gradient-to-r from-emerald-600 to-indigo-600 text-white py-4 rounded-2xl font-black text-sm tracking-wide shadow-xl shadow-emerald-500/10 hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    ATIVAR UM PLANO AGORA <ArrowUpRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={onClose}
                    className="w-full bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800 py-3 rounded-xl font-bold text-xs tracking-wide transition-all"
                  >
                    VOLTAR À CARTEIRA
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-inner">
                    <Wallet className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">
                      Solicitar Saque Pix
                    </h3>
                    <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Recebimento Instantâneo</p>
                  </div>
                </div>

                {/* Balance Summary Banner */}
                <div className="bg-slate-50 rounded-2xl p-4 flex justify-between items-center border border-slate-100 shadow-sm">
                  <div>
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Seu Saldo Disponível</span>
                    <p className="text-lg font-black text-slate-800 tracking-tight mt-0.5">
                      R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setAmount(balance.toFixed(2))}
                    className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-black text-xs px-3.5 py-2 rounded-xl transition-all shadow-sm"
                  >
                    SACAR TUDO
                  </button>
                </div>

                {/* Custom Amount Picker */}
                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest flex justify-between">
                    <span>Valor do Saque (R$)</span>
                    <span className="text-emerald-600 font-bold">Mínimo: R$ 20,00</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-lg font-black text-slate-300">R$</span>
                    <input 
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0,00"
                      step="0.01"
                      min="20"
                      className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl pl-14 pr-6 py-4.5 font-black text-2xl tracking-tight text-slate-800 outline-none focus:border-emerald-500 focus:bg-white transition-all shadow-sm"
                    />
                  </div>
                </div>

                {/* Financial Calculation Breakdown with 3% fee highlight */}
                {numAmount > 0 && (
                  <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4.5 space-y-2 text-xs font-medium text-slate-600">
                    <div className="flex justify-between items-center">
                      <span>Valor solicitado:</span>
                      <span className="font-bold text-slate-800">R$ {numAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between items-center text-amber-600 font-semibold bg-amber-500/5 px-2 py-1.5 rounded-lg border border-amber-500/10">
                      <span className="flex items-center gap-1">
                        <Percent className="w-3.5 h-3.5 text-amber-500 shrink-0" /> Taxa de saque (3%):
                      </span>
                      <span>- R$ {feeAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="border-t border-slate-200/60 pt-2 flex justify-between items-center text-sm font-black text-slate-900">
                      <span className="text-emerald-700">Valor líquido a receber:</span>
                      <span className="text-emerald-600 text-lg">R$ {netAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                )}

                {/* Pix Payout Form */}
                <form onSubmit={handleWithdrawSubmit} className="space-y-4 pt-2">
                  <div className="grid grid-cols-3 gap-2">
                    {(['cpf', 'email', 'phone', 'random'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => {
                          setPixKeyType(type);
                          setPixKey('');
                          setValidationError(null);
                        }}
                        className={`py-2 px-1 rounded-xl text-[10px] font-black tracking-wider uppercase transition-all ${
                          pixKeyType === type 
                            ? 'bg-slate-900 text-white shadow-md' 
                            : 'bg-slate-50 text-slate-400 border border-slate-100 hover:bg-slate-100'
                        }`}
                      >
                        {type === 'cpf' && 'CPF'}
                        {type === 'email' && 'E-mail'}
                        {type === 'phone' && 'Celular'}
                        {type === 'random' && 'Chave Aleatória'}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <Key className="w-3.5 h-3.5" /> Chave Pix ({pixKeyType.toUpperCase()})
                    </label>
                    <input 
                      type="text"
                      required
                      value={pixKey}
                      onChange={handlePixKeyChange}
                      placeholder={
                        pixKeyType === 'cpf' ? '123.456.789-00' :
                        pixKeyType === 'email' ? 'exemplo@pix.com' :
                        pixKeyType === 'phone' ? '(11) 99999-9999' :
                        'Chave aleatória de 32 caracteres'
                      }
                      className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-3.5 font-bold text-sm text-slate-800 outline-none focus:border-emerald-500 focus:bg-white transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                      <User className="w-3.5 h-3.5" /> Nome Completo do Titular da Conta
                    </label>
                    <input 
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Rodrigo Santos Silva"
                      className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-3.5 font-bold text-sm text-slate-800 outline-none focus:border-emerald-500 focus:bg-white transition-all"
                    />
                  </div>

                  {/* Validation errors */}
                  {validationError && (
                    <div className="bg-red-50 text-red-600 border border-red-100 rounded-xl p-3 text-xs font-bold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{validationError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full mt-4 bg-slate-900 text-white py-4.5 rounded-2xl font-black text-sm tracking-wide shadow-xl hover:bg-slate-800 hover:shadow-slate-900/10 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                  >
                    SOLICITAR SAQUE <ArrowUpRight className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )
          )}

          {/* Loading step */}
          {step === 'loading' && (
            <div className="py-16 flex flex-col items-center justify-center space-y-6 text-center">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                className="w-14 h-14 border-4 border-emerald-500 border-t-transparent rounded-full shadow-[0_0_15px_rgba(16,185,129,0.2)]"
              />
              <div>
                <h4 className="text-lg font-black text-slate-800 tracking-tight">Processando Saque</h4>
                <p className="text-slate-400 font-medium text-xs mt-1">Verificando transação e estabelecendo conexão com a rede Pix...</p>
              </div>
            </div>
          )}

          {/* Success Screen -> Pending / Download App Screen */}
          {step === 'success' && (
            <div className="py-8 text-center flex flex-col items-center space-y-6">
              <motion.div 
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-20 h-20 bg-amber-100 border-4 border-white text-amber-600 rounded-full flex items-center justify-center shadow-xl shadow-amber-100"
              >
                <Clock className="w-10 h-10 stroke-[3]" />
              </motion.div>

              <div className="space-y-3">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Saque em Processamento</h3>
                <p className="text-slate-500 text-sm font-semibold max-w-xs mx-auto leading-relaxed">
                  O valor de **R$ {netAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}** foi solicitado e está <span className="text-amber-600 font-bold">Pendente</span>. O processamento ocorrerá em até **24 horas**.
                </p>
              </div>

              <div className="w-full space-y-3">
                <button
                  onClick={onClose}
                  className="w-full bg-slate-900 text-white hover:bg-slate-800 py-4.5 rounded-2xl font-black text-sm tracking-wide transition-all shadow-md"
                >
                  CONCLUÍDO
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
