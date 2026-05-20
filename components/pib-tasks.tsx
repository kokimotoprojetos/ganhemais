'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Award, CheckCircle2, ArrowRight, X, HelpCircle, ShieldAlert, Sparkles } from 'lucide-react';

import { PIB_TASKS, PibTaskData } from '@/lib/tasks-data';

interface PibTasksProps {
  completedTasks: string[];
  onComplete: (taskId: string, reward: number) => void;
  activeDay: number;
}

export function PibTasks({ completedTasks, onComplete, activeDay }: PibTasksProps) {
  const [activeTask, setActiveTask] = useState<PibTaskData | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [showVictory, setShowVictory] = useState(false);

  const startTask = (task: PibTaskData) => {
    setActiveTask(task);
    setCurrentQuestionIndex(0);
    setSelectedOptionIndex(null);
    setIsAnswered(false);
    setShowVictory(false);
  };

  const handleOptionSelect = (index: number) => {
    if (isAnswered) return;
    setSelectedOptionIndex(index);
    setIsAnswered(true);
  };

  const handleNext = () => {
    if (currentQuestionIndex + 1 < activeTask!.questions.length) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedOptionIndex(null);
      setIsAnswered(false);
    } else {
      setShowVictory(true);
    }
  };

  const handleClaim = () => {
    if (activeTask) {
      onComplete(activeTask.id, activeTask.reward);
      setActiveTask(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {PIB_TASKS.filter(task => task.day === activeDay).map((task) => {
          const isDone = completedTasks.includes(task.id);
          
          return (
            <div 
              key={task.id} 
              className={`bg-white border-2 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 flex flex-col justify-between shadow-lg transition-all duration-300 ${
                isDone 
                  ? 'border-emerald-500 bg-emerald-50/20' 
                  : 'border-slate-100 hover:border-emerald-300 hover:shadow-2xl hover:shadow-emerald-500/5'
              }`}
            >
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div className={`p-3.5 rounded-2xl ${isDone ? 'bg-emerald-500 text-white' : 'bg-emerald-50 text-emerald-600'}`}>
                    <BookOpen className="w-6 h-6" />
                  </div>
                  {isDone ? (
                    <span className="text-xs font-black text-emerald-600 bg-emerald-100/50 px-3 py-1.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> CONCLUÍDO
                    </span>
                  ) : (
                    <span className="text-xs font-black text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full flex items-center gap-1.5 animate-pulse">
                      <Sparkles className="w-3.5 h-3.5 fill-current" /> DISPONÍVEL
                    </span>
                  )}
                </div>

                <h4 className="text-xl font-black text-slate-800 leading-tight mb-2">{task.title}</h4>
                <p className="text-sm font-medium text-slate-500 leading-relaxed mb-6">{task.description}</p>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-slate-100 mt-auto">
                <div>
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-0.5">Recompensa</p>
                  <span className="text-emerald-600 font-black text-2xl tracking-tighter">
                    +R$ {task.reward.toFixed(2)}
                  </span>
                </div>

                {isDone ? (
                  <button
                    disabled
                    className="px-6 py-3 bg-emerald-100 text-emerald-600 rounded-2xl font-black text-xs cursor-not-allowed flex items-center gap-1.5"
                  >
                    COLETADO <CheckCircle2 className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => startTask(task)}
                    className="px-6 py-3 bg-slate-900 text-white hover:bg-slate-800 rounded-2xl font-black text-xs tracking-tight transition-all flex items-center gap-1.5 group"
                  >
                    INICIAR <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Questionnaire Modal */}
      <AnimatePresence>
        {activeTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-[2rem] md:rounded-[2.5rem] w-full max-w-2xl shadow-2xl p-5 md:p-8 relative flex flex-col justify-between max-h-[90vh] overflow-y-auto"
            >
              {!showVictory ? (
                <>
                  {/* Close button with warning */}
                  <button 
                    onClick={() => {
                      if (confirm("Deseja mesmo abandonar a pesquisa? Seu progresso será perdido.")) {
                        setActiveTask(null);
                      }
                    }}
                    className="absolute top-6 right-6 p-2 bg-slate-800 text-slate-400 hover:text-white rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <div>
                    {/* Header */}
                    <div className="mb-6 pr-10">
                      <span className="text-[10px] text-emerald-400 font-black uppercase tracking-widest flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-emerald-400" /> Tarefa de Conhecimento: R$ {activeTask.reward.toFixed(2)}
                      </span>
                      <h3 className="text-2xl font-black text-white tracking-tight mt-1 leading-snug">{activeTask.title}</h3>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-8">
                      <div className="flex justify-between items-center text-xs font-black text-slate-400 mb-2">
                        <span>PROGRESSO DA PESQUISA</span>
                        <span>{currentQuestionIndex + 1} DE {activeTask.questions.length}</span>
                      </div>
                      <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                        <motion.div 
                          className="bg-emerald-500 h-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${((currentQuestionIndex + 1) / activeTask.questions.length) * 100}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                    </div>

                    {/* Question Card */}
                    <div className="bg-slate-950/40 border border-slate-800/60 rounded-[2rem] p-6 mb-6">
                      <div className="flex gap-3 mb-4">
                        <HelpCircle className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
                        <h4 className="text-lg font-black text-white leading-snug tracking-tight">
                          {activeTask.questions[currentQuestionIndex].questionText}
                        </h4>
                      </div>

                      {/* Options Grid */}
                      <div className="space-y-3 mt-6">
                        {activeTask.questions[currentQuestionIndex].options.map((option, idx) => {
                          const isSelected = idx === selectedOptionIndex;
                          
                          let btnStyle = "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:border-slate-700";
                          if (isAnswered) {
                            if (isSelected) {
                              btnStyle = "bg-emerald-500/20 border-emerald-500/50 text-emerald-300";
                            } else {
                              btnStyle = "bg-slate-950/20 border-slate-900 text-slate-600 opacity-60";
                            }
                          }

                          return (
                            <button
                              key={idx}
                              disabled={isAnswered}
                              onClick={() => handleOptionSelect(idx)}
                              className={`w-full p-4 rounded-2xl border text-left text-sm font-bold transition-all flex items-center justify-between ${btnStyle}`}
                            >
                              <span className="leading-snug">{option}</span>
                              {isAnswered && isSelected && (
                                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-md font-black shrink-0 ml-2">SELECIONADO</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Educational feedback panel */}
                    <AnimatePresence>
                      {isAnswered && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 mb-8 overflow-hidden"
                        >
                          <p className="text-xs font-black tracking-widest text-emerald-400 uppercase mb-2">💡 INFORMAÇÃO COMPLEMENTAR</p>
                          <p className="text-slate-300 text-xs font-medium leading-relaxed">
                            {activeTask.questions[currentQuestionIndex].explanation}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex justify-between items-center pt-6 border-t border-slate-800/60 mt-4">
                    <div className="flex items-center gap-1">
                      <ShieldAlert className="w-4 h-4 text-emerald-400" />
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Verificado por Especialistas</span>
                    </div>

                    {isAnswered ? (
                      <motion.button
                        initial={{ scale: 0.95 }}
                        animate={{ scale: 1 }}
                        onClick={handleNext}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/10 transition-colors"
                      >
                        {currentQuestionIndex + 1 === activeTask.questions.length ? 'CONCLUIR PESQUISA' : 'PRÓXIMA PERGUNTA'}
                        <ArrowRight className="w-4 h-4" />
                      </motion.button>
                    ) : (
                      <button
                        disabled
                        className="bg-slate-800 text-slate-500 px-8 py-4 rounded-2xl font-black text-sm cursor-not-allowed"
                      >
                        SELECIONE UMA RESPOSTA
                      </button>
                    )}
                  </div>
                </>
              ) : (
                /* Victory/Claim screen */
                <div className="text-center py-10 flex flex-col items-center">
                  <div className="relative mb-8">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                      transition={{ repeat: Infinity, duration: 4 }}
                      className="w-24 h-24 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-[2rem] flex items-center justify-center shadow-inner"
                    >
                      <CheckCircle2 className="w-12 h-12" />
                    </motion.div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-amber-500 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-slate-900 animate-bounce">
                      <Sparkles className="w-4 h-4 fill-current" />
                    </div>
                  </div>

                  <h3 className="text-4xl font-black text-white tracking-tight mb-2 leading-none">Tarefa Concluída!</h3>
                  <p className="text-slate-400 font-medium text-sm max-w-md mx-auto mb-10 leading-relaxed">
                    Parabéns! Você respondeu a todas as perguntas sobre o PIB com sucesso e absorveu conhecimento valioso.
                  </p>

                  <div className="bg-slate-950/50 border border-slate-800/80 rounded-3xl p-6 w-full max-w-sm mb-12 flex justify-between items-center">
                    <div className="text-left">
                      <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Recompensa Creditada</p>
                      <p className="text-slate-300 font-bold text-xs mt-0.5">Saldo disponível na Carteira</p>
                    </div>
                    <span className="text-emerald-400 font-black text-3xl tracking-tighter">
                      +R$ {activeTask.reward.toFixed(2)}
                    </span>
                  </div>

                  <button
                    onClick={handleClaim}
                    className="w-full max-w-sm py-5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black text-base shadow-2xl shadow-emerald-500/15 flex items-center justify-center gap-2 transition-all"
                  >
                    RESGATAR RECOMPENSA E CONCLUIR
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
