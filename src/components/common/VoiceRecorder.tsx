import React, { useState, useRef } from 'react';
import { Mic, Square, Play, Pause, Trash2, CheckCircle2, Volume2 } from 'lucide-react';
import { VoiceNoteRecorder, AudioRecorderState } from '../../lib/audioRecorder';

interface VoiceRecorderProps {
  onAudioReady: (blob: Blob, url: string) => void;
  onCancel?: () => void;
  resultId?: string;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onAudioReady,
  onCancel,
}) => {
  const [recorderState, setRecorderState] = useState<AudioRecorderState>({
    isRecording: false,
    isPaused: false,
    durationSeconds: 0,
    audioBlob: null,
    audioUrl: null,
  });

  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);
  const recorderRef = useRef<VoiceNoteRecorder | null>(null);

  if (!recorderRef.current) {
    recorderRef.current = new VoiceNoteRecorder((state) => {
      setRecorderState(state);
    });
  }

  const startRecording = async () => {
    if (recorderRef.current) {
      await recorderRef.current.start();
    }
  };

  const stopRecording = async () => {
    if (recorderRef.current) {
      const result = await recorderRef.current.stop();
      if (result) {
        onAudioReady(result.blob, result.url);
      }
    }
  };

  const cancelRecording = () => {
    if (recorderRef.current) {
      recorderRef.current.cancel();
    }
    if (audioPreviewRef.current) {
      audioPreviewRef.current.pause();
    }
    setIsPlayingPreview(false);
    if (onCancel) onCancel();
  };

  const togglePreviewPlay = () => {
    if (!audioPreviewRef.current) return;
    if (isPlayingPreview) {
      audioPreviewRef.current.pause();
      setIsPlayingPreview(false);
    } else {
      audioPreviewRef.current.play();
      setIsPlayingPreview(true);
    }
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainingSec = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          <Volume2 className="w-4 h-4 text-ocean-600" />
          <span>Ghi chú bằng Giọng nói (Voice Note của Cô)</span>
        </div>
        {recorderState.isRecording && (
          <span className="flex items-center gap-2 text-xs font-medium text-red-600 bg-red-50 px-2.5 py-1 rounded-full border border-red-200 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-red-600"></span>
            Đang thu âm... ({formatSeconds(recorderState.durationSeconds)})
          </span>
        )}
      </div>

      {!recorderState.isRecording && !recorderState.audioUrl && (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={startRecording}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition font-medium text-sm shadow-sm active:scale-95"
          >
            <Mic className="w-4 h-4" />
            Bắt đầu thu âm nhận xét
          </button>
          <span className="text-xs text-slate-500">
            (Bấm để ghi lại lời dặn dò, khen ngợi học sinh trực tiếp)
          </span>
        </div>
      )}

      {recorderState.isRecording && (
        <div className="flex items-center gap-4 bg-white p-3 rounded-lg border border-red-100">
          <div className="flex-1 flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-red-500 animate-ping"></div>
            <span className="font-mono font-bold text-slate-800 text-base">
              {formatSeconds(recorderState.durationSeconds)}
            </span>
            <div className="flex items-center gap-1">
              <span className="w-1 h-3 bg-red-400 rounded animate-bounce"></span>
              <span className="w-1 h-5 bg-red-500 rounded animate-bounce [animation-delay:0.1s]"></span>
              <span className="w-1 h-7 bg-red-600 rounded animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-1 h-4 bg-red-400 rounded animate-bounce [animation-delay:0.3s]"></span>
            </div>
          </div>
          <button
            type="button"
            onClick={stopRecording}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-white hover:bg-slate-900 transition text-xs font-semibold"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            Dừng & Lưu
          </button>
        </div>
      )}

      {recorderState.audioUrl && (
        <div className="flex items-center gap-3 bg-emerald-50/70 p-3 rounded-lg border border-emerald-200">
          <audio
            ref={audioPreviewRef}
            src={recorderState.audioUrl}
            onEnded={() => setIsPlayingPreview(false)}
            className="hidden"
          />
          <button
            type="button"
            onClick={togglePreviewPlay}
            className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700 transition shrink-0 shadow-sm"
          >
            {isPlayingPreview ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>
          <div className="flex-1 text-xs">
            <div className="font-semibold text-emerald-900 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Đã thu âm xong lời nhận xét!
            </div>
            <div className="text-emerald-700">
              Thời lượng: {formatSeconds(recorderState.durationSeconds || 5)}
            </div>
          </div>
          <button
            type="button"
            onClick={cancelRecording}
            title="Xóa để thu âm lại"
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
