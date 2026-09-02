import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  Trophy,
  Flame,
  Clock,
  Zap,
  Award,
} from 'lucide-react';
import { KAHOOT_COLORS, LiveGameSync, checkValidActiveRoom } from '../../lib/liveGameEngine';
import { triggerCelebration } from '../../lib/gamification';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

export const LiveGamePlayerPage: React.FC = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [studentName, setStudentName] = useState<string>(() => {
    return sessionStorage.getItem('live_game_nickname') || profile?.full_name || 'Em Học Sinh';
  });

  const [gameState, setGameState] = useState<'waiting' | 'answering' | 'answered' | 'result' | 'finished'>('waiting');
  const [currentQIndex, setCurrentQIndex] = useState<number>(0);
  const [totalQuestions, setTotalQuestions] = useState<number>(5);
  const [chosenOption, setChosenOption] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [correctIndex, setCorrectIndex] = useState<number>(0);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [wrongCount, setWrongCount] = useState<number>(0);
  const [totalScore, setTotalScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [finalRank, setFinalRank] = useState<number | null>(null);

  const startTimeRef = useRef<number>(Date.now());
  const syncRef = useRef<LiveGameSync | null>(null);

  useEffect(() => {
    if (!roomId) {
      navigate('/live/join');
      return;
    }

    let isMounted = true;
    const initPlayer = async () => {
      // 🛑 Kiểm tra mã PIN phòng có đang thực sự mở hay không (qua Supabase Cloud & LocalStorage)
      const validation = await checkValidActiveRoom(roomId);
      if (!isMounted) return;
      if (!validation.valid) {
        alert(validation.error || 'Phòng đấu không tồn tại hoặc chưa được mở!');
        navigate('/live/join');
        return;
      }

      // Kết nối đồng bộ Realtime
      syncRef.current = new LiveGameSync(roomId, (event) => {
        if (event.type === 'QUESTION_START') {
          setCurrentQIndex(event.payload.question_index);
          setTotalQuestions(event.payload.total_questions);
          setChosenOption(null);
          setIsCorrect(null);
          setGameState('answering');
          startTimeRef.current = Date.now();
        } else if (event.type === 'ROUND_RESULT') {
          const correctIdx = event.payload.correct_index;
          setCorrectIndex(correctIdx);
          setGameState('result');
        } else if (event.type === 'SHOW_FINAL_SUMMARY' || event.type === 'GAME_FINISHED') {
          setGameState('finished');
          triggerCelebration();

          // Tìm thứ hạng của học sinh
          if (event.payload?.top_participants) {
            const rankIdx = event.payload.top_participants.findIndex(
              (p: any) => p.student_name === studentName
            );
            if (rankIdx !== -1) {
              setFinalRank(rankIdx + 1);
            }
          }
        }
      });

      // Báo danh vào phòng trên Supabase Database
      if (isSupabaseConfigured) {
        try {
          const { data: roomData } = await supabase
            .from('live_game_rooms')
            .select('id')
            .eq('room_code', roomId)
            .maybeSingle();

          if (roomData?.id) {
            await supabase.from('live_game_participants').insert({
              room_id: roomData.id,
              student_name: studentName,
              score: 0,
              streak: 0,
            });
          }
        } catch (e) {
          console.warn('Lỗi lưu participant lên Supabase:', e);
        }
      }

      // Báo danh qua Realtime Broadcast
      if (syncRef.current) {
        syncRef.current.broadcast('STUDENT_JOIN', {
          id: 'p_' + Date.now(),
          room_id: roomId,
          student_name: studentName,
          score: 0,
          streak: 0,
        });
      }
    };

    initPlayer();

    return () => {
      isMounted = false;
      if (syncRef.current) syncRef.current.close();
    };
  }, [roomId, studentName]);

  // Học sinh bấm chọn 1 trong 4 màu
  const handleSelectOption = (idx: number) => {
    if (gameState !== 'answering' || chosenOption !== null) return;

    const responseTimeMs = Date.now() - startTimeRef.current;
    setChosenOption(idx);
    setGameState('answered');

    if (syncRef.current) {
      syncRef.current.broadcast('STUDENT_ANSWER', {
        participant_id: 'p_' + studentName,
        student_name: studentName,
        chosen_option: idx,
        response_time_ms: responseTimeMs,
      });
    }
  };

  // Cập nhật thống kê đúng/sai khi chuyển sang màn hình result
  useEffect(() => {
    if (gameState === 'result' && chosenOption !== null) {
      const correct = chosenOption === correctIndex;
      setIsCorrect(correct);
      if (correct) {
        setCorrectCount((prev) => prev + 1);
        setStreak((prev) => prev + 1);
        setTotalScore((prev) => prev + 850);
      } else {
        setWrongCount((prev) => prev + 1);
        setStreak(0);
      }
    } else if (gameState === 'result' && chosenOption === null) {
      setIsCorrect(false);
      setWrongCount((prev) => prev + 1);
      setStreak(0);
    }
  }, [gameState, correctIndex]);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-4 select-none touch-manipulation">
      {/* Top Bar Điện Thoại */}
      <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-ocean-500 text-white font-black text-xs flex items-center justify-center">
            {currentQIndex + 1}
          </div>
          <div>
            <div className="font-bold text-xs text-white line-clamp-1">{studentName}</div>
            <div className="text-[10px] text-slate-400">PIN: {roomId}</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {streak >= 2 && (
            <span className="text-[11px] font-black text-orange-400 bg-orange-950/80 px-2 py-0.5 rounded-full flex items-center gap-1 border border-orange-800">
              <Flame className="w-3.5 h-3.5" /> {streak}
            </span>
          )}
          <span className="font-mono font-black text-yellow-400 text-sm bg-yellow-950/50 px-2.5 py-0.5 rounded-xl border border-yellow-800">
            {totalScore} đ
          </span>
        </div>
      </div>

      {/* 1. Màn hình chờ máy chiếu bắt đầu */}
      {gameState === 'waiting' && (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4 animate-in fade-in">
          <div className="w-16 h-16 rounded-3xl bg-ocean-600 text-white flex items-center justify-center animate-bounce shadow-xl">
            <Sparkles className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-white">Em Đã Vào Phòng Thành Công!</h2>
          <p className="text-xs text-slate-400 max-w-xs">
            Hãy nhìn lên máy chiếu của Cô Hảo và sẵn sàng bấm đáp án thật nhanh khi câu hỏi xuất hiện nhé!
          </p>
        </div>
      )}

      {/* 2. Màn hình 4 nút bấm màu lớn (Khi đang diễn ra câu hỏi) */}
      {gameState === 'answering' && (
        <div className="flex-1 grid grid-cols-2 gap-3 sm:gap-4 my-4 animate-in zoom-in-95">
          {KAHOOT_COLORS.map((c) => (
            <button
              key={c.idx}
              type="button"
              onClick={() => handleSelectOption(c.idx)}
              className={`rounded-3xl flex flex-col items-center justify-center p-6 font-black active:scale-95 transition shadow-2xl border-b-6 ${c.bg} ${c.border} ${c.text}`}
            >
              <span className="text-4xl sm:text-6xl drop-shadow-md mb-2">{c.symbol}</span>
              <span className="text-sm sm:text-lg opacity-90">{c.letter}</span>
            </button>
          ))}
        </div>
      )}

      {/* 3. Màn hình đã gửi đáp án - Đang đợi hết giờ */}
      {gameState === 'answered' && (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4 animate-in fade-in">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-400/40 flex items-center justify-center animate-pulse">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <h3 className="text-lg font-black text-white">Đã Gửi Đáp Án!</h3>
          <p className="text-xs text-slate-400">
            Em đã chọn: <strong>{KAHOOT_COLORS[chosenOption ?? 0]?.name}</strong>. Hãy nhìn lên máy chiếu xem đáp án đúng nhé!
          </p>
        </div>
      )}

      {/* 4. Màn hình Hiển thị kết quả câu hỏi ngay sau khi hết giờ */}
      {gameState === 'result' && (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4 animate-in zoom-in-95">
          {isCorrect ? (
            <div className="p-6 rounded-3xl bg-emerald-950/80 border-2 border-emerald-500 text-center space-y-3 w-full max-w-sm">
              <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center font-black text-3xl mx-auto shadow-lg animate-bounce">
                ✓
              </div>
              <h3 className="text-xl font-black text-emerald-300">CHÍNH XÁC!</h3>
              <p className="text-xs text-emerald-100">
                Tuyệt vời, em đã chọn đúng đáp án <strong>{KAHOOT_COLORS[correctIndex]?.name}</strong>.
              </p>
            </div>
          ) : (
            <div className="p-6 rounded-3xl bg-red-950/80 border-2 border-red-500 text-center space-y-3 w-full max-w-sm">
              <div className="w-16 h-16 rounded-full bg-red-600 text-white flex items-center justify-center font-black text-3xl mx-auto shadow-lg">
                ✕
              </div>
              <h3 className="text-xl font-black text-red-300">CHƯA CHÍNH XÁC!</h3>
              <p className="text-xs text-red-100">
                Đáp án đúng của câu này là: <strong>{KAHOOT_COLORS[correctIndex]?.name}</strong>.
              </p>
            </div>
          )}

          <p className="text-xs text-slate-400 pt-2">
            Hãy nhìn lên máy chiếu xem giải thích của Cô Hảo và chuẩn bị cho câu tiếp theo!
          </p>
        </div>
      )}

      {/* 5. Màn hình Tổng kết & Bảng xếp hạng cuối cùng */}
      {gameState === 'finished' && (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-5 animate-in zoom-in-95">
          <Trophy className="w-16 h-16 text-yellow-400 animate-bounce" />
          <h2 className="text-2xl font-black text-white">HOÀN THÀNH CUỘC THI!</h2>

          {/* Bảng kết quả tổng hợp của em */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl w-full max-w-xs space-y-3 shadow-xl">
            {finalRank && (
              <div className="text-xs font-black text-yellow-400 uppercase tracking-wider bg-yellow-950/60 p-2 rounded-xl border border-yellow-800">
                🏆 Thứ Hạng Của Em: #{finalRank}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 text-center pt-1">
              <div className="p-2.5 rounded-2xl bg-emerald-950/60 border border-emerald-800">
                <div className="text-[10px] text-emerald-300 font-bold">Số câu đúng</div>
                <div className="text-lg font-black text-emerald-400">✓ {correctCount}</div>
              </div>
              <div className="p-2.5 rounded-2xl bg-red-950/60 border border-red-800">
                <div className="text-[10px] text-red-300 font-bold">Số câu sai</div>
                <div className="text-lg font-black text-red-400">✕ {wrongCount}</div>
              </div>
            </div>

            <div className="text-xs text-slate-300 font-bold pt-1">
              Tổng điểm đạt được: <span className="font-mono text-yellow-400 text-sm font-black">{totalScore} đ</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/student-dashboard')}
            className="px-6 py-3 rounded-2xl bg-ocean-600 hover:bg-ocean-500 text-white font-bold text-xs shadow-lg transition active:scale-95"
          >
            Về Góc Học Tập
          </button>
        </div>
      )}

      {/* Chân trang nhỏ */}
      <div className="text-center text-[10px] text-slate-600 py-1">
        Đấu Trường Địa Lí THCS • Cô Hảo
      </div>
    </div>
  );
};
