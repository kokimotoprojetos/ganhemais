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
  Lock,
  Gift,
  CheckCircle2,
  Users
} from 'lucide-react';

interface BonusWithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  bonusBalance: number;
  invitesCount: number;
  vipsCount: number;
  onSuccess: (amount: number) => Promise<boolean>;
}

type PixKeyType = 'cpf' | 'email' | 'phone' | 'random';

export function BonusWithdrawModal({ isOpen, onClose, bonusBalance, invitesCount, vipsCount, onSuccess }: BonusWithdrawModalProps) {
  const [step, setStep] = useState<'rules' | 'input' | 'loading' | 'success'>('rules');
  
  // Inputs
  const [pixKeyType, setPixKeyType] = useState<PixKeyType>('cpf');
  const [pixKey, setPixKey] = useState('');
  const [fullName, setFullName] = useState('');
  
  // Errors and validation
  const [validationError, setValidationError] = useState<string | null>(null);

  // Requirements check
  const hasEnoughInvites = invitesCount >= 5;
  const hasEnoughVips = vipsCount >= 2;
  const isEligible = hasEnoughInvites && hasEnoughVips;

  // Formatting Pix key
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

    if (bonusBalance <= 0) {
      setValidationError('Você não possui saldo bônus para sacar.');
      return;
    }

    if (!isEligible) {
      setValidationError('Você não atende aos requisitos mínimos para sacar o bônus.');
      return;
    }

    if (!pixKey.trim()) {
      setValidationError('Por favor, insira a sua chave Pix.');
      return;
    }

    if (!fullName.trim() || fullName.trim().split(' ').length < 2) {
      setValidationError('Por favor, insira seu nome completo (Nome e Sobrenome).');
      return;
    }

    setStep('loading');

    setTimeout(async () => {
      const success = await onSuccess(bonusBalance);
      if (success) {
        setStep('success');
      } else {
        setValidationError('Ocorreu um erro ao processar o saque do bônus. Tente novamente.');
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

          {/* Rules Step */}
          {step === 'rules' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shadow-inner">
                  <Gift className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">
                    Regras do Saldo Bônus
                  </h3>
                  <p className="text-amber-500 text-xs font-semibold uppercase tracking-wider">Desbloqueio de Saque</p>
                </div>
              </div>

              {/* Bonus Balance Banner */}
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-3xl p-6 shadow-md text-center">
                <span className="text-[10px] uppercase font-black tracking-widest opacity-80">Seu Saldo Bônus Acumulado</span>
                <p className="text-3xl sm:text-4xl font-black tracking-tight mt-1">
                  R$ {bonusBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>

              {/* Rules List with Progress bars */}
              <div className="space-y-4 pt-2">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Requisitos de Desbloqueio</h4>
                
                {/* Rule 1: Invite 5 friends */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4.5 space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex gap-2.5">
                      <div className={`mt-0.5 shrink-0 ${hasEnoughInvites ? 'text-emerald-500' : 'text-slate-400'}`}>
                        <CheckCircle2 className="w-5 h-5 fill-current text-white border-2 rounded-full" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-800">Convidar no mínimo 5 amigos</p>
                        <p className="text-xs font-medium text-slate-400">Compartilhe seu link de indicação para convidar.</p>
                      </div>
                    </div>
                    <span className="text-xs font-black text-slate-600 shrink-0">{invitesCount}/5</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${hasEnoughInvites ? 'bg-emerald-500' : 'bg-amber-500'}`}
                      style={{ width: `${Math.min(100, (invitesCount / 5) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Rule 2: 2 of them register & subscribe a plan */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4.5 space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex gap-2.5">
                      <div className={`mt-0.5 shrink-0 ${hasEnoughVips ? 'text-emerald-500' : 'text-slate-400'}`}>
                        <CheckCircle2 className="w-5 h-5 fill-current text-white border-2 rounded-full" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-800">Mínimo 2 indicados ativos (VIP)</p>
                        <p className="text-xs font-medium text-slate-400">Indicados que se registraram e assinaram um plano.</p>
                      </div>
                    </div>
                    <span className="text-xs font-black text-slate-600 shrink-0">{vipsCount}/2</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${hasEnoughVips ? 'bg-emerald-500' : 'bg-amber-500'}`}
                      style={{ width: `${Math.min(100, (vipsCount / 2) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Status and Payout action buttons */}
              <div className="w-full pt-4 space-y-3">
                {isEligible ? (
                  <button
                    onClick={() => setStep('input')}
                    className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-sm tracking-wide shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    CONTINUAR PARA O SAQUE <ArrowUpRight className="w-4 h-4" />
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-amber-50 text-amber-700 border border-amber-100 rounded-2xl p-4 text-xs font-semibold flex gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
                      <span>Para solicitar o saque de seu bônus, você deve primeiro cumprir os dois requisitos descritos acima. Compartilhe seu link de convites para avançar!</span>
                    </div>
                    <button
                      disabled
                      className="w-full bg-slate-100 text-slate-400 py-4 rounded-2xl font-black text-sm cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Lock className="w-4 h-4" /> REQUISITOS PENDENTES
                    </button>
                  </div>
                )}
                <button
                  onClick={onClose}
                  className="w-full bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800 py-3.5 rounded-xl font-bold text-xs tracking-wide transition-all"
                >
                  VOLTAR À CARTEIRA
                </button>
              </div>
            </div>
          )}

          {/* Pix Form Step */}
          {step === 'input' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-inner">
                  <Wallet className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">
                    Sacar Saldo Bônus
                  </h3>
                  <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Pix Instantâneo Liberado</p>
                </div>
              </div>

              {/* Amount highlights */}
              <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4 text-center">
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Valor Líquido a Receber</span>
                <p className="text-2xl font-black text-emerald-600 tracking-tight mt-0.5">
                  R$ {bonusBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>

              {/* Pix Payout Form */}
              <form onSubmit={handleWithdrawSubmit} className="space-y-4">
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
                    <User className="w-3.5 h-3.5" /> Nome Completo do Titular
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
                  SOLICITAR SAQUE DE BÔNUS <ArrowUpRight className="w-4 h-4" />
                </button>
              </form>
            </div>
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
                <h4 className="text-lg font-black text-slate-800 tracking-tight">Processando Saque do Bônus</h4>
                <p className="text-slate-400 font-medium text-xs mt-1">Verificando transação e estabelecendo conexão com a rede Pix...</p>
              </div>
            </div>
          )}

          {/* Success Step */}
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
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Saque de Bônus em Análise</h3>
                <p className="text-slate-500 text-sm font-semibold max-w-xs mx-auto leading-relaxed">
                  O valor de **R$ {bonusBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}** foi solicitado com sucesso e está <span className="text-amber-600 font-bold">Pendente</span>. O processamento Pix ocorrerá em até **24 horas**.
                </p>
              </div>

              <div className="w-full">
                <button
                  onClick={onClose}
                  className="w-full bg-slate-900 text-white hover:bg-slate-800 py-4 rounded-2xl font-black text-sm tracking-wide transition-all shadow-md"
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
