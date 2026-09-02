import React, { useState, useRef } from 'react';
import { Play, Pause, Volume2, RotateCcw } from 'lucide-react';

interface AudioPlayerProps {
  src: string;
  title?: string;
  className?: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  src,
  title = 'Lời nhận xét của Giáo viên',
  className = '',
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const restartAudio = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const formatTime = (sec: number) => {
    if (isNaN(sec)) return '00:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`flex items-center gap-3 bg-gradient-to-r from-ocean-50 to-blue-50/50 border border-ocean-200/80 p-3 rounded-xl shadow-sm ${className}`}>
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
        className="hidden"
      />

      <button
        type="button"
        onClick={togglePlay}
        className="w-10 h-10 rounded-full bg-ocean-600 text-white flex items-center justify-center hover:bg-ocean-700 active:scale-95 transition shadow-sm shrink-0"
        title={isPlaying ? 'Tạm dừng' : 'Nghe nhận xét'}
      >
        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between text-xs font-semibold text-ocean-950 mb-1">
          <span className="flex items-center gap-1 truncate">
            <Volume2 className="w-3.5 h-3.5 text-ocean-600 shrink-0" />
            {title}
          </span>
          <span className="font-mono text-slate-500 text-[11px] shrink-0">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>

        <input
          type="range"
          min="0"
          max={duration || 100}
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1.5 bg-ocean-200 rounded-lg appearance-none cursor-pointer accent-ocean-600"
        />
      </div>

      <button
        type="button"
        onClick={restartAudio}
        title="Nghe lại từ đầu"
        className="p-2 text-slate-400 hover:text-ocean-600 hover:bg-white rounded-lg transition"
      >
        <RotateCcw className="w-4 h-4" />
      </button>
    </div>
  );
};
