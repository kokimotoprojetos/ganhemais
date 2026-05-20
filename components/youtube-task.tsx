'use client';

import { useState, useRef, useEffect } from 'react';
import YouTube, { YouTubeProps } from 'react-youtube';
import { motion, AnimatePresence } from 'motion/react';
import { Play, CheckCircle2, X, AlertTriangle, Clock, ShieldAlert } from 'lucide-react';

interface YouTubeTaskProps {
  videoId: string;
  reward: number;
  title: string;
  isCompleted: boolean;
  onComplete: (reward: number) => void;
}

export function YouTubeTask({ videoId, reward, title, isCompleted, onComplete }: YouTubeTaskProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30); // 30-second target countdown
  const [isFinished, setIsFinished] = useState(false);
  const [isClaimed, setIsClaimed] = useState(false);
  const playerRef = useRef<any>(null);

  // Reset states when modal is opened/closed
  useEffect(() => {
    if (isModalOpen) {
      setTimeLeft(30);
      setIsFinished(false);
      setIsPlaying(false);
      setIsClaimed(false);
    }
  }, [isModalOpen]);

  // Countdown timer logic
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isModalOpen && isPlaying && timeLeft > 0 && !isFinished) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setIsFinished(true);
            // Automatic claim when timer completes successfully
            onComplete(reward);
            setIsClaimed(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isModalOpen, isPlaying, timeLeft, isFinished, reward, onComplete]);

  const onReady: YouTubeProps['onReady'] = (event) => {
    playerRef.current = event.target;
  };

  const onStateChange: YouTubeProps['onStateChange'] = (event) => {
    // 1 = playing, 2 = paused, 0 = ended, -1 = unstarted
    if (event.data === 1) {
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
    }
  };

  const handleClaimReward = () => {
    onComplete(reward);
    setIsClaimed(true);
  };

  const handleCloseAttempt = () => {
    if (isFinished || isCompleted) {
      setIsModalOpen(false);
    } else {
      setShowExitConfirm(true);
    }
  };

  const confirmExit = () => {
    setIsModalOpen(false);
    setShowExitConfirm(false);
  };

  const opts: YouTubeProps['opts'] = {
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: 1, // Autoplay on modal open
      controls: 0, // No controls to prevent scrubbing/skipping
      disablekb: 1,
      modestbranding: 1,
      rel: 0,
      showinfo: 0,
      fs: 0, // Disable full screen button of YouTube to keep user in our modal
    },
  };

  return (
    <>
      {/* Video Card in Panel */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden group hover:border-emerald-400 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300 flex flex-col justify-between h-full border-b-4">
        <div className="relative aspect-video bg-slate-900 overflow-hidden flex items-center justify-center">
          {/* Cover image styling with video thumbnail */}
          <img 
            src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`} 
            alt={title}
            className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"
          />
          
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>

          {isCompleted ? (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-emerald-500/90 backdrop-blur-sm text-white p-6 text-center">
              <CheckCircle2 className="w-12 h-12 mb-2 animate-bounce" />
              <p className="font-black tracking-tight text-lg">RECOMPENSA COLETADA</p>
              <p className="text-xs text-emerald-100 font-medium">Você já assistiu a este vídeo</p>
            </div>
          ) : (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/30 backdrop-blur-[1px] group-hover:bg-black/45 transition-colors">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsModalOpen(true)}
                className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-2xl pl-1 hover:bg-emerald-600 transition-colors"
              >
                <Play className="w-8 h-8 fill-current" />
              </motion.button>
            </div>
          )}
        </div>

        <div className="p-6 flex flex-col justify-between flex-grow">
          <div>
            <h4 className="font-black text-slate-800 leading-tight mb-2 text-lg group-hover:text-emerald-700 transition-colors">{title}</h4>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" /> Assistir por 30 segundos
            </p>
          </div>
          
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
            <span className="text-emerald-600 font-black text-2xl tracking-tighter">
              +R$ {reward.toFixed(2)}
            </span>
            {!isCompleted && (
              <button 
                onClick={() => setIsModalOpen(true)}
                className="text-xs font-black text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-4 py-2.5 rounded-xl transition-all"
              >
                ASSISTIR AGORA
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Watch Modal with Timer Overlay */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 md:p-8">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-[2.5rem] w-full max-w-5xl overflow-hidden shadow-2xl flex flex-col md:flex-row h-[85vh]"
            >
              {isClaimed ? (
                <div className="flex-grow flex flex-col items-center justify-center p-8 md:p-16 text-center space-y-8 bg-gradient-to-b from-slate-900 to-slate-950">
                  <motion.div
                    initial={{ scale: 0.3, opacity: 0 }}
                    animate={{ scale: [1.2, 0.9, 1], opacity: 1 }}
                    transition={{ duration: 0.6, type: 'spring' }}
                    className="w-28 h-28 bg-emerald-500/10 border-4 border-emerald-500/30 text-emerald-400 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(16,185,129,0.2)]"
                  >
                    <CheckCircle2 className="w-14 h-14 stroke-[2.5]" />
                  </motion.div>

                  <div className="space-y-4 max-w-md">
                    <h3 className="text-3xl font-black text-white tracking-tight">Parabéns! 🎉</h3>
                    <p className="text-slate-300 font-medium leading-relaxed text-sm">
                      Você assistiu aos 30 segundos obrigatórios e a sua recompensa de <strong className="text-emerald-400 text-base">R$ {reward.toFixed(2)}</strong> já foi adicionada à sua conta!
                    </p>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-wider">
                      Saldo Atualizado no Painel
                    </p>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setIsModalOpen(false)}
                    className="px-10 py-4.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black text-sm tracking-wide shadow-xl shadow-emerald-500/10 transition-all cursor-pointer"
                  >
                    VOLTAR ÀS TAREFAS
                  </motion.button>
                </div>
              ) : (
                <>
                  {/* Left Panel: Video Player */}
              <div className="flex-1 bg-black relative flex items-center justify-center h-[50%] md:h-full">
                <YouTube 
                  videoId={videoId} 
                  opts={opts} 
                  onReady={onReady} 
                  onStateChange={onStateChange}
                  className="w-full h-full aspect-video"
                  style={{ height: '100%', width: '100%' }}
                />

                {/* Cover when not playing to prompt play */}
                {!isPlaying && timeLeft > 0 && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center text-center p-6 pointer-events-none">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center animate-ping absolute duration-1000"></div>
                    <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg relative z-10 text-white pl-1">
                      <Play className="w-8 h-8 fill-current" />
                    </div>
                    <p className="mt-4 font-black text-white text-lg tracking-tight">Dê play no vídeo para iniciar o cronômetro</p>
                    <p className="text-xs text-slate-400 font-semibold mt-1">Você deve assistir por 30 segundos.</p>
                  </div>
                )}
              </div>

              {/* Right Panel: Task Info, Timer & Anti-Cheat */}
              <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-slate-800 p-8 flex flex-col justify-between bg-slate-900 shrink-0 h-[50%] md:h-full overflow-y-auto">
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <span className="text-[10px] text-emerald-400 font-black uppercase tracking-widest">Tarefa de Vídeo</span>
                      <h3 className="text-xl font-black text-white tracking-tight mt-1 leading-tight">{title}</h3>
                    </div>
                    <button 
                      onClick={handleCloseAttempt}
                      className="p-2 bg-slate-800 text-slate-400 hover:text-white rounded-full transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Anti-cheat status banner */}
                  <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4 mb-6">
                    <div className="flex gap-3">
                      <ShieldAlert className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-black text-slate-300">Sistema Anti-Burlar</p>
                        <p className="text-[10px] text-slate-500 font-semibold leading-relaxed mt-0.5">
                          O tempo avança apenas com o vídeo em reprodução. Pular partes invalidará a recompensa.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Timer & Progress Circle */}
                  <div className="flex flex-col items-center justify-center py-6 bg-slate-950/30 rounded-3xl border border-slate-800/40">
                    <div className="relative w-32 h-32 flex items-center justify-center">
                      {/* SVG Background Circle */}
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle 
                          cx="50" 
                          cy="50" 
                          r="42" 
                          stroke="currentColor" 
                          className="text-slate-800" 
                          strokeWidth="6" 
                          fill="transparent" 
                        />
                        <motion.circle 
                          cx="50" 
                          cy="50" 
                          r="42" 
                          stroke="currentColor" 
                          className="text-emerald-500" 
                          strokeWidth="6" 
                          fill="transparent" 
                          strokeDasharray="264"
                          animate={{ strokeDashoffset: 264 - (264 * (30 - timeLeft)) / 30 }}
                          transition={{ ease: "linear" }}
                        />
                      </svg>

                      {/* Timer Digital text inside */}
                      <div className="absolute text-center">
                        {isFinished ? (
                          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto animate-bounce" />
                        ) : (
                          <>
                            <span className="text-3xl font-black text-white">{timeLeft}</span>
                            <span className="text-[10px] font-black text-slate-500 block uppercase tracking-widest mt-0.5">segundos</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="mt-6">
                      {isFinished ? (
                        <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 px-4 py-2 rounded-full flex items-center gap-1.5 animate-pulse">
                          <CheckCircle2 className="w-3.5 h-3.5" /> RECOMPENSA LIBERADA
                        </span>
                      ) : isPlaying ? (
                        <span className="text-xs font-black text-sky-400 bg-sky-500/10 px-4 py-2 rounded-full flex items-center gap-1.5">
                          <span className="w-2 h-2 bg-sky-400 rounded-full animate-ping"></span> 
                          CRONÔMETRO ATIVO
                        </span>
                      ) : (
                        <span className="text-xs font-black text-amber-500 bg-amber-500/10 px-4 py-2 rounded-full flex items-center gap-1.5 border border-amber-500/20 animate-pulse">
                          <AlertTriangle className="w-3.5 h-3.5" /> CRONÔMETRO PAUSADO
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="mt-8">
                  <div className="flex justify-between items-baseline mb-4">
                    <span className="text-slate-500 font-bold text-xs">Recompensa:</span>
                    <span className="text-emerald-400 font-black text-2xl tracking-tight">R$ {reward.toFixed(2)}</span>
                  </div>

                  {isFinished ? (
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={handleClaimReward}
                      className="w-full py-5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black text-base shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 tracking-tight transition-all"
                    >
                      RESGATAR RECOMPENSA <CheckCircle2 className="w-5 h-5" />
                    </motion.button>
                  ) : (
                    <button
                      disabled
                      className="w-full py-5 bg-slate-800 text-slate-500 rounded-2xl font-black text-base cursor-not-allowed tracking-tight"
                    >
                      ASSISTA PARA RESGATAR
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Exit confirmation pop-up */}
      <AnimatePresence>
        {showExitConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 p-8 rounded-[2rem] max-w-md w-full shadow-2xl text-center"
            >
              <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-white tracking-tight mb-2">Abandonar Tarefa?</h3>
              <p className="text-slate-400 text-sm font-medium leading-relaxed mb-8">
                Você ainda não assistiu aos 30 segundos obrigatórios. Se sair agora, perderá o progresso e não ganhará os **R$ {reward.toFixed(2)}**.
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setShowExitConfirm(false)}
                  className="flex-1 py-4 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 transition-colors"
                >
                  CONTINUAR ASSISTINDO
                </button>
                <button 
                  onClick={confirmExit}
                  className="flex-1 py-4 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors"
                >
                  SIM, ABANDONAR
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
