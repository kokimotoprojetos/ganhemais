'use client';

import { useState, useRef, useEffect } from 'react';
import YouTube, { YouTubeProps } from 'react-youtube';
import { motion } from 'motion/react';
import { Play, CheckCircle2, Lock } from 'lucide-react';

interface YouTubeTaskProps {
  videoId: string;
  reward: number;
  title: string;
  onComplete: (reward: number) => void;
}

export function YouTubeTask({ videoId, reward, title, onComplete }: YouTubeTaskProps) {
  const [completed, setCompleted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const playerRef = useRef<any>(null);

  const onReady: YouTubeProps['onReady'] = (event) => {
    playerRef.current = event.target;
    setDuration(event.target.getDuration());
  };

  const onStateChange: YouTubeProps['onStateChange'] = (event) => {
    // 1 = playing, 2 = paused, 0 = ended
    if (event.data === 1) {
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
    }

    if (event.data === 0 && !completed) {
      setCompleted(true);
      onComplete(reward);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        if (playerRef.current) {
          const currentTime = playerRef.current.getCurrentTime();
          const totalTime = playerRef.current.getDuration();
          setProgress((currentTime / totalTime) * 100);
          
          // Anti-skip logic: if they try to jump ahead, we can detect it, 
          // but YouTube controls usually allow skipping. 
          // We can prevent reward if duration watched < total duration - buffer.
        }
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const opts: YouTubeProps['opts'] = {
    height: '240',
    width: '100%',
    playerVars: {
      autoplay: 0,
      controls: 0, // No controls to prevent skipping
      disablekb: 1,
      modestbranding: 1,
      rel: 0,
      showinfo: 0,
    },
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden group hover:border-emerald-300 transition-all shadow-sm">
      <div className="relative aspect-video bg-slate-100">
        {!isPlaying && !completed && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 backdrop-blur-[2px] transition-all group-hover:bg-black/50">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => playerRef.current?.playVideo()}
              className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-2xl pl-1"
            >
              <Play className="w-8 h-8 fill-current" />
            </motion.button>
          </div>
        )}
        
        {completed && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-emerald-500/90 backdrop-blur-sm text-white p-6 text-center">
            <CheckCircle2 className="w-12 h-12 mb-2" />
            <p className="font-black text-lg">TAREFA CONCLUÍDA</p>
            <p className="text-xs text-emerald-100 font-medium">Recompensa de R$ {reward.toFixed(2)} adicionada</p>
          </div>
        )}

        <div className={completed ? 'opacity-0 pointer-events-none' : 'opacity-100'}>
          <YouTube 
            videoId={videoId} 
            opts={opts} 
            onReady={onReady} 
            onStateChange={onStateChange}
            className="w-full h-full"
          />
        </div>

        {/* Progress Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-200/50">
          <motion.div 
            className="h-full bg-emerald-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="p-5 flex items-center justify-between">
        <div>
          <h4 className="font-bold text-slate-800 leading-tight mb-1">{title}</h4>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Assista até o fim</p>
        </div>
        <div className="text-right">
          <span className="text-emerald-600 font-black text-xl tracking-tighter">
            +R$ {reward.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}
