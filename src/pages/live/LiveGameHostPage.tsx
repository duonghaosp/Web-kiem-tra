import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../../context/AuthContext';
import {
  Globe,
  Users,
  Play,
  ArrowRight,
  Clock,
  CheckCircle2,
  Trophy,
  Crown,
  Sparkles,
  Zap,
  RotateCcw,
  Volume2,
  VolumeX,
  Share2,
  QrCode,
  Flame,
  Award,
  BookOpen,
  Shuffle,
  ListFilter,
  CheckSquare,
  Square,
  Settings,
  FolderOpen,
  X,
  ChevronDown,
  ChevronUp,
  Plus,
  BarChart3,
  HelpCircle,
  AlertTriangle,
  Lightbulb,
  Copy,
  Check,
  Maximize2,
  Smartphone,
  Trash2,
  UserX,
} from 'lucide-react';
import { Question } from '../../types/database';
import { LiveGameParticipant, LiveGameRoom, LiveGameStatus } from '../../types/liveGame';
import {
  KAHOOT_COLORS,
  LiveGameSync,
  generateRoomCode,
  calculateSpeedPoints,
  registerActiveRoom,
  removeActiveRoom,
} from '../../lib/liveGameEngine';
import { LatexRenderer } from '../../components/common/LatexRenderer';
import { triggerCelebration } from '../../lib/gamification';
import { getStoredLessons, LessonItem } from '../../data/curriculum';
import { getStoredQuestions } from '../../data/questionBank';
import { getStoredExamTemplates } from '../../data/examTemplates';
import { soundFx } from '../../lib/soundEffects';

// 5 Câu hỏi trắc nghiệm Đấu trường khởi động mặc định
const DEFAULT_ARENA_QUESTIONS: Question[] = [
  {
    id: 'lg_q1',
    grade: 6,
    type: 'single_choice',
    title: 'Vị trí địa lí Việt Nam',
    content_json: {
      question: 'Việt Nam nằm ở rìa phía đông của bán đảo nào sau đây?',
      options: ['Bán đảo Trung Ấn', 'Bán đảo Mã Lai', 'Bán đảo Triều Tiên', 'Bán đảo A-rập'],
    },
    correct_answer_json: { correct_index: 0 },
    explanation: 'Việt Nam nằm ở rìa phía đông của bán đảo Trung Ấn.',
    points: 1000,
  },
  {
    id: 'lg_q2',
    grade: 6,
    type: 'single_choice',
    title: 'Địa danh du lịch sinh thái',
    content_json: {
      question: 'Đầm Thị Nại là đầm nước mặn nổi tiếng thuộc tỉnh nào của nước ta?',
      options: ['Bình Định', 'Phú Yên', 'Khánh Hòa', 'Quảng Ngãi'],
    },
    correct_answer_json: { correct_index: 0 },
    explanation: 'Đầm Thị Nại thuộc tỉnh Bình Định.',
    points: 1000,
  },
  {
    id: 'lg_q3',
    grade: 8,
    type: 'single_choice',
    title: 'Đặc điểm địa hình nước ta',
    content_json: {
      question: 'Đồi núi chiếm tỷ lệ bao nhiêu diện tích lãnh thổ đất liền nước ta?',
      options: ['3/4 diện tích', '1/4 diện tích', '1/2 diện tích', '2/3 diện tích'],
    },
    correct_answer_json: { correct_index: 0 },
    explanation: 'Đồi núi chiếm khoảng 3/4 diện tích lãnh thổ Việt Nam.',
    points: 1000,
  },
  {
    id: 'lg_q4',
    grade: 9,
    type: 'single_choice',
    title: 'Đỉnh núi cao nhất Việt Nam',
    content_json: {
      question: 'Đỉnh núi Phan-xi-păng (Fansipan) cao bao nhiêu mét?',
      options: ['3.143 mét', '2.850 mét', '3.000 mét', '3.500 mét'],
    },
    correct_answer_json: { correct_index: 0 },
    explanation: 'Đỉnh Fansipan cao 3.143m thuộc dãy Hoàng Liên Sơn.',
    points: 1000,
  },
  {
    id: 'lg_q5',
    grade: 8,
    type: 'single_choice',
    title: 'Khoáng sản năng lượng',
    content_json: {
      question: 'Vùng mỏ than đá có trữ lượng lớn và chất lượng tốt nhất nước ta nằm ở tỉnh nào?',
      options: ['Quảng Ninh', 'Thái Nguyên', 'Lạng Sơn', 'Hà Giang'],
    },
    correct_answer_json: { correct_index: 0 },
    explanation: 'Quảng Ninh là vùng mỏ than lớn nhất Việt Nam.',
    points: 1000,
  },
];

interface ParticipantWithStats extends LiveGameParticipant {
  correct_count: number;
  wrong_count: number;
  history: Record<number, { isCorrect: boolean; chosenOption: number }>;
}

export const LiveGameHostPage: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const [roomCode] = useState<string>(() => generateRoomCode());
  // Các trạng thái: lobby -> question -> result -> final_summary -> podium
  const [status, setStatus] = useState<'lobby' | 'question' | 'result' | 'final_summary' | 'podium'>('lobby');

  // Quản lý âm thanh hiệu ứng (Gợi ý 3)
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);

  const toggleAudio = () => {
    const nextMuted = soundFx.toggleMute();
    setIsAudioMuted(nextMuted);
  };

  // --- QUẢN LÝ BỘ CÂU HỎI ĐẤU TRƯỜNG DO GIÁO VIÊN CHỌN ---
  const [isQuestionPickerOpen, setIsQuestionPickerOpen] = useState<boolean>(false);
  const [questions, setQuestions] = useState<Question[]>(DEFAULT_ARENA_QUESTIONS);
  const [timePerQuestion, setTimePerQuestion] = useState<number>(30); // 10s, 15s, 20s, 30s

  // Dữ liệu kho bài học và câu hỏi từ hệ thống
  const allLessons = useMemo(() => getStoredLessons(), [isQuestionPickerOpen]);
  const allQuestions = useMemo(() => getStoredQuestions(), [isQuestionPickerOpen]);
  const allTemplates = useMemo(() => getStoredExamTemplates(), [isQuestionPickerOpen]);

  // Bộ lọc trong Modal chọn câu hỏi
  const [pickerGrade, setPickerGrade] = useState<number>(6);
  const [pickerTab, setPickerTab] = useState<'random_range' | 'manual_bank' | 'template'>('random_range');

  // Trạng thái bốc ngẫu nhiên theo bài
  const [startLesson, setStartLesson] = useState<number>(1);
  const [endLesson, setEndLesson] = useState<number>(5);
  const [randomAmount, setRandomAmount] = useState<number>(5);

  // Trạng thái tự chọn từng câu
  const [expandedLessonId, setExpandedLessonId] = useState<string | null>(null);
  const [tempSelectedQuestions, setTempSelectedQuestions] = useState<Question[]>(questions);

  // Hàm chuẩn hóa: Chỉ chấp nhận câu hỏi trắc nghiệm có 1 đáp án đúng duy nhất
  const isSingleChoiceQuestion = (q: Question): boolean => {
    return (
      q.type === 'single_choice' &&
      Array.isArray(q.content_json?.options) &&
      q.content_json.options.length >= 2
    );
  };

  // Bài học & câu hỏi của khối đang chọn (CHỈ LẤY TRẮC NGHIỆM 1 ĐÁP ÁN ĐÚNG)
  const gradeLessons = useMemo(() => {
    return allLessons.filter((l) => l.grade === pickerGrade);
  }, [allLessons, pickerGrade]);

  const gradeQuestions = useMemo(() => {
    return allQuestions.filter(
      (q) => q.grade === pickerGrade && isSingleChoiceQuestion(q)
    );
  }, [allQuestions, pickerGrade]);

  useEffect(() => {
    setStartLesson(1);
    setEndLesson(Math.min(5, gradeLessons.length || 5));
  }, [pickerGrade, gradeLessons]);

  // Bốc ngẫu nhiên câu hỏi từ Bài X đến Bài Y (CHỈ BỐC CÂU TRẮC NGHIỆM 1 ĐÁP ÁN)
  const handleRandomPickForArena = () => {
    const validLessons = gradeLessons.filter(
      (l) => l.lesson_number >= startLesson && l.lesson_number <= endLesson
    );
    const validLessonIds = validLessons.map((l) => l.id);
    const validLessonTitles = validLessons.map((l) => l.title);

    const pool = gradeQuestions.filter((q) => {
      if (!isSingleChoiceQuestion(q)) return false;
      if (q.lesson_id && validLessonIds.includes(q.lesson_id)) return true;
      if (q.category && validLessonTitles.includes(q.category)) return true;
      if (!q.lesson_id && startLesson === 1) return true;
      return false;
    });

    if (pool.length === 0) {
      alert(`Trong các bài từ Bài ${startLesson} đến Bài ${endLesson} hiện chưa có câu hỏi trắc nghiệm 1 đáp án nào. Cô hãy mở rộng phạm vi bài nhé!`);
      return;
    }

    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    const picked = shuffled.slice(0, Math.min(randomAmount, shuffled.length));

    setTempSelectedQuestions(picked);
    alert(`🎲 Đã bốc thành công ${picked.length} câu hỏi trắc nghiệm 1 đáp án từ Bài ${startLesson} đến Bài ${endLesson}!`);
  };

  // Áp dụng bộ câu hỏi đã chọn cho Đấu trường (BẮT BUỘC TRẮC NGHIỆM 1 ĐÁP ÁN)
  const handleConfirmSelectedQuestions = () => {
    const validOnly = tempSelectedQuestions.filter(isSingleChoiceQuestion);
    if (validOnly.length === 0) {
      alert('Cô hãy chọn ít nhất 1 câu hỏi trắc nghiệm có 1 đáp án trả lời cho Đấu trường nhé!');
      return;
    }
    setQuestions(validOnly);
    setIsQuestionPickerOpen(false);
    alert(`⚡ Đã nạp thành công bộ ${validOnly.length} câu hỏi trắc nghiệm 1 đáp án vào Đấu Trường Trực Tiếp!`);
  };

  // --- TRẠNG THÁI GAME REALTIME ---
  const [currentQIndex, setCurrentQIndex] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(timePerQuestion);
  const [participants, setParticipants] = useState<ParticipantWithStats[]>([]);
  const [isQrFullscreen, setIsQrFullscreen] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  const joinUrl = `${window.location.origin}/live/join?pin=${roomCode}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(joinUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleKickParticipant = (participantId: string, studentName: string) => {
    if (confirm(`Cô có chắc muốn mời học sinh "${studentName}" ra khỏi phòng chờ không?`)) {
      setParticipants((prev) => prev.filter((p) => p.id !== participantId && p.student_name !== studentName));
    }
  };

  const handleClearAllParticipants = () => {
    if (confirm('Cô có chắc muốn dọn sạch danh sách phòng chờ để học sinh vào lại từ đầu không?')) {
      setParticipants([]);
    }
  };

  // Thống kê câu trả lời vòng hiện tại
  const [answerStats, setAnswerStats] = useState<number[]>([0, 0, 0, 0]);
  const [answersCount, setAnswersCount] = useState<number>(0);

  const syncRef = useRef<LiveGameSync | null>(null);

  // 1. Khởi tạo Realtime Sync
  useEffect(() => {
    syncRef.current = new LiveGameSync(roomCode, (event) => {
      if (event.type === 'STUDENT_JOIN') {
        try { soundFx.playJoin(); } catch (e) {}
        setParticipants((prev) => {
          if (prev.some((p) => p.student_name === event.payload.student_name)) return prev;
          return [
            ...prev,
            {
              ...event.payload,
              correct_count: 0,
              wrong_count: 0,
              history: {},
            },
          ];
        });
      } else if (event.type === 'STUDENT_ANSWER') {
        const { participant_id, chosen_option, response_time_ms } = event.payload;
        const currentQ = questions[currentQIndex];
        const correctIdx = currentQ?.correct_answer_json?.correct_index ?? 0;
        const isCorrect = chosen_option === correctIdx;

        setAnswerStats((prev) => {
          const updated = [...prev];
          updated[chosen_option] = (updated[chosen_option] || 0) + 1;
          return updated;
        });
        setAnswersCount((prev) => prev + 1);

        // Cập nhật điểm và thống kê số câu đúng / sai cho học sinh
        setParticipants((prev) =>
          prev.map((p) => {
            if (p.id === participant_id || p.student_name === event.payload.student_name) {
              const newStreak = isCorrect ? p.streak + 1 : 0;
              const earned = calculateSpeedPoints(isCorrect, response_time_ms, timePerQuestion, p.streak);
              return {
                ...p,
                score: p.score + earned,
                streak: newStreak,
                correct_count: isCorrect ? p.correct_count + 1 : p.correct_count,
                wrong_count: !isCorrect ? p.wrong_count + 1 : p.wrong_count,
                history: {
                  ...p.history,
                  [currentQIndex]: { isCorrect, chosenOption: chosen_option },
                },
                last_answer_correct: isCorrect,
                last_points_earned: earned,
              };
            }
            return p;
          })
        );
      }
    });

    return () => {
      if (syncRef.current) syncRef.current.close();
    };
  }, [roomCode, currentQIndex, timePerQuestion, questions]);

  // 1.1 Tự động Đăng ký và Giữ phòng đấu hoạt động trên toàn hệ thống
  useEffect(() => {
    const register = () => {
      registerActiveRoom({
        pin: roomCode,
        title: `Đấu Trường Đố Vui Địa Lí THCS - Khối ${pickerGrade}`,
        teacher_name: profile?.full_name || 'Cô Dương Thu Hảo',
        grade: pickerGrade,
        status: status,
        total_questions: questions.length,
      });
    };

    register();
    const timer = setInterval(register, 8000);

    return () => {
      clearInterval(timer);
      removeActiveRoom(roomCode);
    };
  }, [roomCode, status, pickerGrade, questions.length, profile]);

  // 2. Quản lý đồng hồ đếm ngược + Phát âm thanh tích tắc hồi hộp (Gợi ý 3)
  useEffect(() => {
    if (status !== 'question') return;

    setTimeLeft(timePerQuestion);

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        // Phát âm thanh tích tắc mỗi giây, hồi hộp hơn ở 5s cuối
        soundFx.playTick(prev <= 6);

        if (prev <= 1) {
          clearInterval(timer);
          showRoundResult();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [status, currentQIndex, timePerQuestion]);

  // Bắt đầu Câu Hỏi
  const startQuestion = (qIndex: number) => {
    setCurrentQIndex(qIndex);
    setAnswerStats([0, 0, 0, 0]);
    setAnswersCount(0);
    setTimeLeft(timePerQuestion);
    setStatus('question');

    if (syncRef.current) {
      syncRef.current.broadcast('QUESTION_START', {
        question_index: qIndex,
        total_questions: questions.length,
        time_limit: timePerQuestion,
        question: questions[qIndex],
      });
    }
  };

  // Hiển thị ngay Đáp Án Đúng sau khi hết giờ hoặc bấm kết thúc câu hỏi
  const showRoundResult = () => {
    soundFx.playTimesUp(); // Tiếng chuông hết giờ (Gợi ý 3)
    setStatus('result');

    const currentQ = questions[currentQIndex];
    if (syncRef.current) {
      syncRef.current.broadcast('ROUND_RESULT', {
        correct_index: currentQ?.correct_answer_json?.correct_index ?? 0,
        explanation: currentQ?.explanation,
      });
    }
  };

  // Chuyển sang Câu Tiếp Theo hoặc Chuyển sang Bảng Tổng Hợp Cuối Cùng
  const handleProceedAfterResult = () => {
    if (currentQIndex < questions.length - 1) {
      // Còn câu hỏi -> Đi thẳng sang câu tiếp theo
      startQuestion(currentQIndex + 1);
    } else {
      // Đã hết câu -> Chuyển sang Bảng Tổng Hợp Kết Quả & Bảng Xếp Hạng Cuối Cùng
      setStatus('final_summary');
      if (syncRef.current) {
        syncRef.current.broadcast('SHOW_FINAL_SUMMARY', {
          top_participants: participants.sort((a, b) => b.score - a.score),
        });
      }
    }
  };

  const currentQ = questions[currentQIndex] || questions[0];
  const sortedParticipants = useMemo(() => {
    return [...participants].sort((a, b) => b.score - a.score);
  }, [participants]);

  const correctIndex = currentQ?.correct_answer_json?.correct_index ?? 0;

  // --- GỢI Ý 4: PHÂN TÍCH VÀ TỰ ĐỘNG ĐÁNH DẤU CÂU HỎI CÓ NHIỀU HỌC SINH LÀM SAI NHẤT ---
  const questionAccuracySummary = useMemo(() => {
    return questions.map((q, qIdx) => {
      let correctCnt = 0;
      let wrongCnt = 0;
      participants.forEach((p) => {
        const hist = p.history?.[qIdx];
        if (hist) {
          if (hist.isCorrect) correctCnt++;
          else wrongCnt++;
        }
      });
      const total = correctCnt + wrongCnt;
      const accuracy = total > 0 ? Math.round((correctCnt / total) * 100) : 100;
      return {
        question: q,
        questionIndex: qIdx,
        correctCount: correctCnt,
        wrongCount: wrongCnt,
        total,
        accuracy,
      };
    });
  }, [questions, participants]);

  // Tìm câu hỏi có tỷ lệ làm sai cao nhất
  const hardestQuestion = useMemo(() => {
    if (questionAccuracySummary.length === 0) return null;
    const sorted = [...questionAccuracySummary].sort((a, b) => a.accuracy - b.accuracy);
    // Nếu có ít nhất 1 câu mà tỷ lệ chính xác < 100%
    return sorted[0].accuracy < 100 ? sorted[0] : null;
  }, [questionAccuracySummary]);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between select-none font-sans">
      {/* 1. MÀN HÌNH PHÒNG CHỜ (LOBBY) */}
      {status === 'lobby' && (
        <div className="flex-1 flex flex-col items-center justify-between p-6 sm:p-12 text-center max-w-5xl mx-auto w-full space-y-6 animate-in fade-in">
          {/* Header Phòng Chờ */}
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-3">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-ocean-500/20 border border-ocean-400/30 text-ocean-300 font-bold text-xs">
                <Sparkles className="w-4 h-4 text-yellow-400" />
                ĐẤU TRƯỜNG ĐỊA LÍ THCS TRỰC TIẾP (KAHOOT STYLE)
              </div>

              {/* Nút Bật/Tắt Âm Thanh Hiệu Ứng (Gợi ý 3) */}
              <button
                type="button"
                onClick={toggleAudio}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border flex items-center gap-1.5 transition ${
                  !isAudioMuted
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
                title="Bật hoặc Tắt âm thanh tích tắc & chuông"
              >
                {!isAudioMuted ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                {!isAudioMuted ? 'Âm thanh: Bật' : 'Âm thanh: Tắt'}
              </button>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
              Sẵn Sàng Tham Gia Cùng Cô Hảo!
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm">
              Học sinh dùng điện thoại truy cập vào link hoặc nhập mã PIN bên dưới:
            </p>
          </div>

          {/* Thanh cài đặt & Nút Chọn Bộ Câu Hỏi */}
          <div className="flex flex-wrap items-center justify-center gap-3 bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800 shadow-lg">
            <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-ocean-400" />
              <span>Bộ câu hỏi hiện tại: <strong className="text-yellow-400">{questions.length} câu</strong> ({timePerQuestion}s/câu)</span>
            </div>

            <button
              type="button"
              onClick={() => {
                setTempSelectedQuestions(questions);
                setIsQuestionPickerOpen(true);
              }}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-ocean-600 hover:bg-ocean-500 active:scale-95 text-white text-xs font-black transition shadow-xs"
            >
              <Settings className="w-3.5 h-3.5" />
              Chọn / Đổi Bộ Câu Hỏi Đấu Trường
            </button>
          </div>

          {/* KHỐI GIA NHẬP PHÒNG ĐẤU: MÃ QR CODE & MÃ PIN CHIẾU MÁY CHIẾU */}
          <div className="w-full max-w-4xl bg-slate-900/90 border-2 border-ocean-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 ring-8 ring-ocean-500/10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              {/* Cột 1: Quét mã QR trực tiếp */}
              <div className="flex flex-col items-center text-center space-y-3 p-4 bg-slate-950/60 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-2 text-xs font-bold text-ocean-300 uppercase tracking-wider">
                  <QrCode className="w-4 h-4 text-ocean-400" />
                  <span>1. Quét Mã QR Bằng Điện Thoại</span>
                </div>

                <div className="relative group p-3.5 bg-white rounded-2xl shadow-xl border-4 border-ocean-400/40">
                  <QRCodeSVG
                    value={joinUrl}
                    size={175}
                    level="H"
                    includeMargin={false}
                  />
                  <button
                    type="button"
                    onClick={() => setIsQrFullscreen(true)}
                    className="absolute inset-0 bg-slate-950/80 rounded-2xl opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center text-white text-xs font-bold gap-1 cursor-pointer"
                    title="Bấm để phóng to toàn màn hình máy chiếu"
                  >
                    <Maximize2 className="w-6 h-6 text-yellow-400 animate-bounce" />
                    <span>Phóng to toàn màn hình</span>
                  </button>
                </div>

                <p className="text-[11px] text-slate-400 max-w-xs leading-relaxed">
                  Mở <strong>Zalo</strong> hoặc <strong>Camera điện thoại</strong> quét mã để vào thẳng phòng đấu (tự động điền mã PIN).
                </p>

                <button
                  type="button"
                  onClick={() => setIsQrFullscreen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-ocean-950 hover:bg-ocean-900 text-ocean-300 border border-ocean-800 text-xs font-bold transition cursor-pointer active:scale-95"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Phóng to QR lên máy chiếu</span>
                </button>
              </div>

              {/* Cột 2: Nhập mã PIN 6 số */}
              <div className="flex flex-col items-center text-center space-y-4 p-4 bg-slate-950/60 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-300 uppercase tracking-wider">
                  <Smartphone className="w-4 h-4 text-amber-400" />
                  <span>2. Hoặc Nhập Mã PIN 6 Số</span>
                </div>

                <div className="space-y-1 w-full">
                  <div className="text-[10px] uppercase font-black text-slate-400 tracking-widest">
                    MÃ PIN THAM GIA PHÒNG:
                  </div>
                  <div className="text-5xl sm:text-6xl font-black font-mono tracking-widest text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.35)] select-all py-1">
                    {roomCode}
                  </div>
                  <div className="text-xs text-slate-300 font-medium">
                    Truy cập trang: <span className="font-bold underline text-white">/live/join</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 transition cursor-pointer active:scale-95"
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedLink ? 'Đã sao chép link!' : 'Sao chép link phòng'}</span>
                  </button>
                </div>

                <p className="text-[11px] text-slate-400 max-w-xs leading-relaxed">
                  Cô có thể sao chép link gửi vào nhóm Zalo lớp để các em dùng máy tính hoặc điện thoại mở trực tiếp.
                </p>
              </div>
            </div>
          </div>

          {/* DANH SÁCH HỌC SINH THỰC TẾ THAM GIA PHÒNG CHỜ (THEO HÀNG DỌC CÓ THANH CUỘN - WAYGROUND STYLE) */}
          <div className="w-full max-w-4xl bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
                  <Users className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                    <span>Danh Sách Học Sinh Trong Phòng Chờ</span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                      {participants.length} bạn
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {participants.length === 0
                      ? 'Hiện chưa có học sinh nào vào phòng — tên học sinh sẽ xuất hiện ngay khi các em quét QR hoặc nhập PIN'
                      : 'Hiển thị danh sách học sinh thực tế đang trực tuyến trong phòng đấu của Cô'}
                  </p>
                </div>
              </div>

              {participants.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAllParticipants}
                  className="text-xs text-slate-400 hover:text-red-400 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 transition cursor-pointer"
                  title="Dọn sạch danh sách phòng chờ để học sinh vào lại"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Đặt lại danh sách</span>
                </button>
              )}
            </div>

            {/* Khi chưa có học sinh nào vào phòng */}
            {participants.length === 0 ? (
              <div className="py-12 px-4 rounded-2xl bg-slate-950/40 border-2 border-dashed border-slate-800 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-800/80 text-slate-500 flex items-center justify-center mx-auto">
                  <Users className="w-6 h-6 animate-pulse text-ocean-400" />
                </div>
                <div className="font-bold text-slate-300 text-sm sm:text-base">
                  ⏳ Đang chờ học sinh tham gia phòng chờ...
                </div>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  Cô hãy nhắc các em dùng điện thoại quét <strong>Mã QR</strong> hoặc vào trang <strong>/live/join</strong> và nhập mã PIN <strong>{roomCode}</strong>. Tên các em sẽ xuất hiện tự động theo hàng dọc ngay dưới đây!
                </p>
              </div>
            ) : (
              /* Khi đã có học sinh: Hiển thị danh sách hàng dọc (Wayground style) có thanh cuộn */
              <div className="space-y-2">
                <div className="max-h-72 sm:max-h-80 overflow-y-auto pr-2 space-y-2 divide-y divide-slate-800/60">
                  {participants.map((p, idx) => (
                    <div
                      key={p.id || idx}
                      className="pt-2 first:pt-0 flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-2xl bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800/80 transition animate-in fade-in slide-in-from-bottom-2"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Số thứ tự */}
                        <span className="w-6 h-6 rounded-lg bg-slate-800 text-slate-400 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        {/* Đèn báo online */}
                        <span className="relative flex h-2.5 w-2.5 shrink-0">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                        </span>
                        {/* Tên học sinh */}
                        <span className="font-bold text-white text-xs sm:text-sm truncate">
                          {p.student_name}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          Đã vào phòng
                        </span>
                        {/* Nút mời học sinh ra nếu tên không đúng */}
                        <button
                          type="button"
                          onClick={() => handleKickParticipant(p.id, p.student_name)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-950/40 transition cursor-pointer"
                          title={`Mời ${p.student_name} ra khỏi phòng`}
                        >
                          <UserX className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer thông tin thanh cuộn */}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 px-2">
                  <span>
                    Tổng cộng: <strong className="text-white">{participants.length}</strong> học sinh đang trực tuyến
                  </span>
                  {participants.length > 5 && (
                    <span className="text-ocean-400 font-medium">
                      ↕ Dùng chuột hoặc kéo thanh cuộn để xem danh sách
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Nút Bắt Đầu Cuộc Thi */}
          <div className="pt-2 w-full max-w-md">
            <button
              type="button"
              onClick={() => {
                if (participants.length === 0) {
                  if (!confirm('Hiện chưa có học sinh nào trong phòng chờ. Cô có muốn bắt đầu để tự trải nghiệm thử không?')) {
                    return;
                  }
                }
                startQuestion(0);
              }}
              disabled={questions.length === 0}
              className={`w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl font-black text-base sm:text-lg shadow-xl transition cursor-pointer active:scale-95 disabled:opacity-50 ${
                participants.length > 0
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-emerald-500/20'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
              }`}
            >
              <Play className="w-6 h-6 fill-current" />
              {participants.length > 0
                ? `Bắt Đầu Đấu Trường Ngay! (${participants.length} Học Sinh • ${questions.length} Câu)`
                : `Bắt Đầu Đấu Trường! (${questions.length} Câu)`}
            </button>
          </div>

          {/* MODAL PHÓNG TO TOÀN MÀN HÌNH MÃ QR (ĐỂ CHIẾU MÁY CHIẾU LỚN TRONG LỚP HỌC) */}
          {isQrFullscreen && (
            <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
              <div className="relative max-w-lg w-full bg-slate-900 border-2 border-ocean-500/50 rounded-3xl p-6 sm:p-8 text-center space-y-5 shadow-2xl ring-8 ring-ocean-500/20">
                <button
                  type="button"
                  onClick={() => setIsQrFullscreen(false)}
                  className="absolute top-4 right-4 p-2 rounded-2xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition cursor-pointer"
                  title="Đóng phóng to"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-ocean-500/20 text-ocean-300 text-xs font-bold border border-ocean-500/30">
                    <QrCode className="w-4 h-4" />
                    Đấu Trường Địa Lí Trực Tiếp Cùng Cô Hảo
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white">
                    Quét Mã QR Để Vào Phòng Thi Đấu!
                  </h2>
                </div>

                <div className="p-5 bg-white rounded-3xl shadow-2xl inline-block mx-auto border-4 border-ocean-400">
                  <QRCodeSVG
                    value={joinUrl}
                    size={260}
                    level="H"
                    includeMargin={false}
                  />
                </div>

                <div className="space-y-2">
                  <div className="text-xs uppercase tracking-widest text-slate-400 font-bold">
                    Hoặc nhập mã PIN trên máy:
                  </div>
                  <div className="text-5xl sm:text-6xl font-black font-mono tracking-widest text-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,0.5)]">
                    {roomCode}
                  </div>
                  <div className="text-xs text-ocean-300 font-medium">
                    Link: <span className="text-white underline font-bold">{joinUrl}</span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setIsQrFullscreen(false)}
                    className="w-full py-3 rounded-2xl bg-ocean-600 hover:bg-ocean-500 text-white font-bold text-sm shadow-md transition active:scale-95 cursor-pointer"
                  >
                    Quay Lại Màn Hình Phòng Chờ ({participants.length} Học Sinh)
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. MÀN HÌNH CHIẾU CÂU HỎI TRÊN MÁY CHIẾU (ĐỒNG HỒ ĐANG CHẠY CÓ ÂM THANH) */}
      {status === 'question' && (
        <div className="flex-1 flex flex-col justify-between p-4 sm:p-8 max-w-6xl mx-auto w-full space-y-6 animate-in fade-in">
          {/* Top Bar: Câu số, Âm thanh & Đồng hồ */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-black text-white">
                Câu {currentQIndex + 1} / {questions.length}
              </span>
              <span className="text-xs font-bold text-slate-400">
                Đã nộp: <strong className="text-emerald-400 text-sm">{answersCount} / {participants.length}</strong>
              </span>
              <button
                type="button"
                onClick={toggleAudio}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white border border-slate-700"
              >
                {!isAudioMuted ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
              </button>
            </div>

            {/* Đồng hồ đếm ngược kịch tính đang chạy từng giây */}
            <div
              className={`w-16 h-16 rounded-2xl flex items-center justify-center font-mono font-black text-3xl border shadow-lg transition-all ${
                timeLeft <= 5
                  ? 'bg-red-600 border-red-500 text-white animate-bounce'
                  : 'bg-ocean-600 border-ocean-500 text-white'
              }`}
            >
              {timeLeft}
            </div>

            <button
              type="button"
              onClick={showRoundResult}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-black text-amber-300 border border-slate-700 transition active:scale-95"
            >
              Hết giờ / Xem đáp án ngay
            </button>
          </div>

          {/* Khung Nội Dung Câu Hỏi To Rõ Trên Máy Chiếu */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center flex flex-col items-center justify-center min-h-[160px] gap-3">
            <div className="text-xl sm:text-3xl font-black text-white leading-relaxed max-w-4xl">
              <LatexRenderer
                content={currentQ.content_json?.question || currentQ.title}
                isPoetry={currentQ.title.includes('thơ') || currentQ.title.includes('Đố vui')}
              />
            </div>

            {/* Hình ảnh tư liệu quan sát trên máy chiếu (Bản đồ, biểu đồ, bảng số liệu) */}
            {currentQ.content_json?.image_url && (
              <div className="w-full max-w-2xl bg-black/50 border border-slate-700 rounded-2xl p-2.5 shadow-2xl flex flex-col items-center">
                <img
                  src={currentQ.content_json.image_url}
                  alt={currentQ.content_json.image_caption || 'Tư liệu câu hỏi'}
                  className="max-h-64 sm:max-h-80 w-auto max-w-full object-contain rounded-xl shadow-md"
                />
                {currentQ.content_json.image_caption && (
                  <div className="text-xs sm:text-sm font-bold text-amber-300 italic mt-2">
                    {currentQ.content_json.image_caption}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 4 Ô Màu Đáp Án (Kahoot-style 4 màu lớn) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(currentQ.content_json?.options || []).map((opt: string, idx: number) => {
              const color = KAHOOT_COLORS[idx] || KAHOOT_COLORS[0];
              const optImg = currentQ.content_json?.option_images?.[idx];

              return (
                <div
                  key={idx}
                  className={`p-5 rounded-3xl font-bold flex items-center gap-4 text-base sm:text-xl shadow-lg border-b-4 ${color.bg} ${color.border} ${color.text}`}
                >
                  <span className="w-10 h-10 rounded-2xl bg-black/20 flex items-center justify-center font-black text-xl shrink-0">
                    {color.symbol}
                  </span>
                  <div className="flex-1 text-left min-w-0 space-y-2">
                    {opt && <LatexRenderer content={opt} />}
                    {optImg && (
                      <div className="bg-black/30 p-1.5 rounded-xl inline-block">
                        <img
                          src={optImg}
                          alt={`Phương án ${color.symbol}`}
                          className="max-h-28 sm:max-h-36 w-auto object-contain rounded-lg"
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. MÀN HÌNH HIỂN THỊ CÂU TRẢ LỜI ĐÚNG NGAY SAU KHI HẾT GIỜ (RESULT) */}
      {status === 'result' && (
        <div className="flex-1 flex flex-col justify-between p-4 sm:p-8 max-w-6xl mx-auto w-full space-y-6 animate-in fade-in">
          {/* Header Thông Báo Đáp Án */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-xs font-black text-emerald-300">
                Câu {currentQIndex + 1} / {questions.length} - Kết Quả & Đáp Án Đúng
              </span>
            </div>

            {/* Nút sang câu tiếp theo hoặc xem tổng kết cuối cùng */}
            <button
              type="button"
              onClick={handleProceedAfterResult}
              className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 font-black text-sm text-white shadow-lg transition active:scale-95"
            >
              {currentQIndex < questions.length - 1 ? (
                <>
                  Sang Câu Tiếp Theo ({currentQIndex + 2}/{questions.length})
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  <Trophy className="w-4 h-4 text-yellow-300" />
                  Xem Tổng Kết & Bảng Xếp Hạng Cuối Cùng
                </>
              )}
            </button>
          </div>

          {/* Khung Nội Dung Câu Hỏi */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 text-center flex flex-col items-center justify-center gap-2">
            <div className="text-lg sm:text-2xl font-black text-white leading-relaxed max-w-4xl">
              <LatexRenderer
                content={currentQ.content_json?.question || currentQ.title}
                isPoetry={currentQ.title.includes('thơ') || currentQ.title.includes('Đố vui')}
              />
            </div>

            {/* Hình ảnh tư liệu quan sát trên máy chiếu */}
            {currentQ.content_json?.image_url && (
              <div className="w-full max-w-lg bg-black/40 border border-slate-700 rounded-2xl p-2 flex flex-col items-center">
                <img
                  src={currentQ.content_json.image_url}
                  alt={currentQ.content_json.image_caption || 'Tư liệu'}
                  className="max-h-48 sm:max-h-56 w-auto max-w-full object-contain rounded-lg"
                />
                {currentQ.content_json.image_caption && (
                  <div className="text-xs font-semibold text-slate-300 italic mt-1">
                    {currentQ.content_json.image_caption}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 4 Ô Màu Đáp Án - NỔI BẬT ĐÁP ÁN ĐÚNG & LÀM MỜ ĐÁP ÁN SAI */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(currentQ.content_json?.options || []).map((opt: string, idx: number) => {
              const color = KAHOOT_COLORS[idx] || KAHOOT_COLORS[0];
              const isCorrect = idx === correctIndex;
              const count = answerStats[idx] || 0;

              return (
                <div
                  key={idx}
                  className={`p-5 rounded-3xl font-bold flex items-center justify-between gap-4 text-base sm:text-lg transition-all ${
                    isCorrect
                      ? 'bg-emerald-600 border-4 border-emerald-300 text-white shadow-2xl ring-4 ring-emerald-400/50 scale-[1.02]'
                      : 'bg-slate-900/60 border border-slate-800 text-slate-500 opacity-40'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xl shrink-0 ${
                      isCorrect ? 'bg-white text-emerald-700' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {isCorrect ? '✓' : color.symbol}
                    </span>
                    <div className="text-left font-black space-y-1.5">
                      {opt && <LatexRenderer content={opt} />}
                      {currentQ.content_json?.option_images?.[idx] && (
                        <div className="bg-black/30 p-1 rounded-lg inline-block">
                          <img
                            src={currentQ.content_json.option_images[idx]!}
                            alt={`Phương án ${color.symbol}`}
                            className="max-h-20 sm:max-h-24 w-auto object-contain rounded"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    {isCorrect ? (
                      <span className="text-xs font-black bg-white text-emerald-900 px-3 py-1 rounded-full uppercase tracking-wider">
                        Đáp án đúng ({count} bạn)
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-slate-400">
                        {count} bạn chọn
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Lời giải thích của cô */}
          {currentQ.explanation && (
            <div className="p-4 rounded-2xl bg-ocean-950/70 border border-ocean-700 text-xs sm:text-sm text-ocean-100 flex items-start gap-2">
              <span className="text-base">💡</span>
              <div>
                <strong className="text-yellow-300 font-bold">Lời giải thích của Cô Hảo:</strong>{' '}
                {currentQ.explanation}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. MÀN HÌNH TỔNG HỢP KẾT QUẢ ĐÚNG / SAI CỦA TỪNG HỌC SINH & GẮN CỜ CÂU HỎI SAI NHIỀU (FINAL SUMMARY) */}
      {status === 'final_summary' && (
        <div className="flex-1 flex flex-col justify-between p-4 sm:p-8 max-w-6xl mx-auto w-full space-y-6 animate-in fade-in">
          {/* Header Bảng Tổng Hợp */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
                <BarChart3 className="w-7 h-7 text-ocean-400" />
                Tổng Hợp Kết Quả Toàn Bộ Cuộc Thi
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Thống kê số câu trả lời Đúng / Sai của từng em và phân tích câu hỏi cần lưu ý
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                soundFx.playFanfare(); // Nhạc vinh quang (Gợi ý 3)
                setStatus('podium');
                triggerCelebration();
              }}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 font-black text-slate-950 text-sm shadow-xl transition active:scale-95"
            >
              <Crown className="w-5 h-5 fill-current" />
              Chiếu Bục Vinh Quang Top 3
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* GỢI Ý 4: KHỐI PHÂN TÍCH CÂU HỎI NHIỀU BẠN LÀM SAI NHẤT CỦA CẢ LỚP */}
          {hardestQuestion && (
            <div className="p-4 sm:p-5 rounded-3xl bg-rose-950/70 border-2 border-rose-600/80 space-y-3 shadow-xl">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-rose-300 font-black text-xs sm:text-sm">
                  <AlertTriangle className="w-5 h-5 text-rose-400" />
                  <span>CẢNH BÁO KIẾN THỨC: Câu hỏi có nhiều học sinh chọn sai nhất ({100 - hardestQuestion.accuracy}% sai)</span>
                </div>
                <span className="text-xs font-black bg-rose-900 text-rose-200 px-3 py-1 rounded-full border border-rose-700">
                  Câu số {hardestQuestion.questionIndex + 1}
                </span>
              </div>

              <div className="text-xs sm:text-sm font-bold text-white bg-slate-900/90 p-3 rounded-2xl border border-slate-800">
                <LatexRenderer
                  content={
                    hardestQuestion.question.content_json?.question ||
                    hardestQuestion.question.title
                  }
                />
              </div>

              <div className="text-xs text-rose-100 bg-rose-900/40 p-3 rounded-xl border border-rose-800/60 flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-yellow-300 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-yellow-300 font-bold">Cô Hảo dặn dò củng cố lại cho cả lớp:</strong>{' '}
                  {hardestQuestion.question.explanation || 'Các em lưu ý đọc kỹ đề bài và xem lại kiến thức trọng tâm của phần này nhé!'}
                </div>
              </div>
            </div>
          )}

          {/* Biểu đồ thanh tỷ lệ đúng theo từng câu */}
          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-3xl space-y-2">
            <div className="text-xs font-black text-slate-300 flex items-center justify-between">
              <span>Tỷ lệ làm đúng theo từng câu hỏi của cả lớp:</span>
              <span className="text-[11px] text-slate-500 font-medium">Tổng số: {questions.length} câu</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {questionAccuracySummary.map((item) => (
                <div
                  key={item.questionIndex}
                  className={`p-2.5 rounded-2xl border flex flex-col justify-between ${
                    item.accuracy >= 70
                      ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                      : item.accuracy >= 40
                      ? 'bg-amber-950/40 border-amber-800 text-amber-300'
                      : 'bg-rose-950/50 border-rose-700 text-rose-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span>Câu {item.questionIndex + 1}</span>
                    <span>{item.accuracy}%</span>
                  </div>
                  <div className="w-full bg-black/40 h-1.5 rounded-full overflow-hidden mt-1.5">
                    <div
                      className={`h-full rounded-full ${
                        item.accuracy >= 70
                          ? 'bg-emerald-400'
                          : item.accuracy >= 40
                          ? 'bg-amber-400'
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${item.accuracy}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bảng Chi Tiết Đúng / Sai Của Từng Học Sinh */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-950 text-slate-400 font-black uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-3">Hạng</th>
                    <th className="py-3 px-3">Học Sinh</th>
                    <th className="py-3 px-3 text-center">Số Câu Đúng</th>
                    <th className="py-3 px-3 text-center">Số Câu Sai</th>
                    <th className="py-3 px-3 text-center">Tỷ Lệ Chính Xác</th>
                    <th className="py-3 px-3 text-right">Tổng Điểm</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {sortedParticipants.map((p, idx) => {
                    const accuracy = questions.length > 0
                      ? Math.round((p.correct_count / questions.length) * 100)
                      : 0;

                    return (
                      <tr key={p.id || idx} className="hover:bg-slate-800/60 transition">
                        <td className="py-3.5 px-3">
                          <span
                            className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs ${
                              idx === 0
                                ? 'bg-yellow-400 text-slate-950'
                                : idx === 1
                                ? 'bg-slate-300 text-slate-950'
                                : idx === 2
                                ? 'bg-amber-600 text-white'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            #{idx + 1}
                          </span>
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="font-bold text-white text-sm">{p.student_name}</div>
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <span className="font-black text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-3 py-1 rounded-full text-xs">
                            ✓ {p.correct_count} / {questions.length} câu
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <span className="font-bold text-red-400 bg-red-950/40 px-2.5 py-1 rounded-full text-xs">
                            ✕ {p.wrong_count} câu
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-center font-bold text-slate-300">
                          {accuracy}%
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono font-black text-yellow-400 text-base">
                          {p.score.toLocaleString()} đ
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 5. BỤC VINH QUANG CHUNG CUỘC (PODIUM) */}
      {status === 'podium' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 text-center max-w-4xl mx-auto w-full space-y-8 animate-in zoom-in-95">
          <div className="space-y-2">
            <Crown className="w-16 h-16 text-yellow-400 mx-auto animate-bounce" />
            <h1 className="text-3xl sm:text-5xl font-black text-white">
              BỤC VINH QUANG ĐẤU TRƯỜNG!
            </h1>
            <p className="text-slate-400 text-sm">
              Chúc mừng các bạn xuất sắc nhất trong trận thi đấu Địa lí hôm nay
            </p>
          </div>

          {/* Top 3 Podium */}
          <div className="flex items-end justify-center gap-4 sm:gap-8 w-full max-w-lg pt-8">
            {/* Top 2 */}
            {sortedParticipants[1] && (
              <div className="flex-1 flex flex-col items-center gap-2">
                <span className="text-xs sm:text-sm font-bold text-slate-300 truncate max-w-[100px]">
                  {sortedParticipants[1].student_name}
                </span>
                <span className="text-xs font-mono font-black text-yellow-300">
                  {sortedParticipants[1].score.toLocaleString()} đ
                </span>
                <div className="w-full h-36 bg-slate-800 border-2 border-slate-600 rounded-t-3xl flex items-center justify-center font-black text-2xl text-slate-400">
                  2
                </div>
              </div>
            )}

            {/* Top 1 */}
            {sortedParticipants[0] && (
              <div className="flex-1 flex flex-col items-center gap-2">
                <Crown className="w-8 h-8 text-yellow-400" />
                <span className="text-sm sm:text-base font-black text-yellow-400 truncate max-w-[120px]">
                  {sortedParticipants[0].student_name}
                </span>
                <span className="text-xs font-mono font-black text-yellow-300">
                  {sortedParticipants[0].score.toLocaleString()} đ
                </span>
                <div className="w-full h-48 bg-gradient-to-t from-yellow-500 to-amber-400 text-slate-950 border-2 border-yellow-300 rounded-t-3xl flex items-center justify-center font-black text-4xl shadow-xl shadow-yellow-500/20">
                  1
                </div>
              </div>
            )}

            {/* Top 3 */}
            {sortedParticipants[2] && (
              <div className="flex-1 flex flex-col items-center gap-2">
                <span className="text-xs sm:text-sm font-bold text-slate-300 truncate max-w-[100px]">
                  {sortedParticipants[2].student_name}
                </span>
                <span className="text-xs font-mono font-black text-yellow-300">
                  {sortedParticipants[2].score.toLocaleString()} đ
                </span>
                <div className="w-full h-28 bg-amber-800 border-2 border-amber-600 rounded-t-3xl flex items-center justify-center font-black text-xl text-amber-200">
                  3
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-6">
            <button
              type="button"
              onClick={() => {
                setStatus('lobby');
                setCurrentQIndex(0);
              }}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-ocean-600 hover:bg-ocean-500 text-white font-bold text-sm transition active:scale-95"
            >
              <RotateCcw className="w-4 h-4" /> Chơi Lại Trận Mới
            </button>
            <Link
              to="/teacher-dashboard"
              className="px-6 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm transition"
            >
              Về Bàn Làm Việc
            </Link>
          </div>
        </div>
      )}

      {/* --- MODAL CHỌN BỘ CÂU HỎI ĐẤU TRƯỜNG DÀNH CHO GIÁO VIÊN --- */}
      {isQuestionPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto text-slate-900">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-5 sm:p-7 shadow-2xl border border-slate-200 space-y-5 my-auto max-h-[92vh] overflow-y-auto">
            {/* Header Modal */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2xl bg-ocean-100 text-ocean-700 flex items-center justify-center font-black">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">
                    Lựa Chọn Bộ Câu Hỏi Cho Đấu Trường Trực Tiếp
                  </h3>
                  <p className="text-xs text-slate-500">
                    Cô Hảo có thể bốc câu hỏi từ Bài học, Kho đề hoặc Đề thi mẫu của trường
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsQuestionPickerOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chọn Khối & Thời gian đếm ngược bằng Thanh cuộn xuống (Dropdown Select) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Chọn Khối Lớp:
                </label>
                <select
                  value={pickerGrade}
                  onChange={(e) => setPickerGrade(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-800 shadow-xs focus:ring-2 focus:ring-ocean-500 cursor-pointer"
                >
                  <option value={6}>Khối 6 (Địa lí 6 - Toàn bộ các bài)</option>
                  <option value={7}>Khối 7 (Địa lí 7 - Các châu lục trên thế giới)</option>
                  <option value={8}>Khối 8 (Địa lí 8 - Tự nhiên Việt Nam)</option>
                  <option value={9}>Khối 9 (Địa lí 9 - Kinh tế Xã hội Việt Nam)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Thời Gian Mỗi Câu:
                </label>
                <select
                  value={timePerQuestion}
                  onChange={(e) => setTimePerQuestion(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-800 shadow-xs focus:ring-2 focus:ring-purple-500 cursor-pointer"
                >
                  <option value={10}>⏱️ 10 giây / câu (Nhanh & phản xạ chớp nhoáng)</option>
                  <option value={15}>⏱️ 15 giây / câu (Tốc độ & kịch tính)</option>
                  <option value={20}>⏱️ 20 giây / câu (Tiêu chuẩn thi đấu trên lớp)</option>
                  <option value={30}>⏱️ 30 giây / câu (Đủ thời gian đọc kỹ đề bài)</option>
                  <option value={45}>⏱️ 45 giây / câu (Thoải mái suy nghĩ và tính toán)</option>
                  <option value={60}>⏱️ 60 giây / câu (1 phút / câu)</option>
                </select>
              </div>
            </div>

            {/* Tiêu chuẩn Đấu trường: Gọn gàng, loại bỏ cụm từ dài dòng */}
            <div className="flex items-center gap-2 p-2.5 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-950 shadow-2xs">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
              <span className="text-xs font-bold text-emerald-900">
                Tiêu Chuẩn Đấu Trường:
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[11px] font-black uppercase tracking-wide shadow-xs">
                ✓ Chỉ Chọn Trắc Nghiệm 1 Đáp Án Đúng
              </span>
            </div>

            {/* 3 Tab Nguồn Lấy Câu Hỏi Chuyên Môn */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200 overflow-x-auto">
              <button
                type="button"
                onClick={() => setPickerTab('random_range')}
                className={`flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs font-black transition shrink-0 ${
                  pickerTab === 'random_range'
                    ? 'bg-white text-ocean-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Shuffle className="w-3.5 h-3.5 text-ocean-600" />
                Bốc Theo Bài Học
              </button>

              <button
                type="button"
                onClick={() => setPickerTab('manual_bank')}
                className={`flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs font-black transition shrink-0 ${
                  pickerTab === 'manual_bank'
                    ? 'bg-white text-ocean-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ListFilter className="w-3.5 h-3.5 text-ocean-600" />
                Tự Chọn Trong Kho Đề
              </button>

              <button
                type="button"
                onClick={() => setPickerTab('template')}
                className={`flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs font-black transition shrink-0 ${
                  pickerTab === 'template'
                    ? 'bg-white text-ocean-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FolderOpen className="w-3.5 h-3.5 text-amber-600" />
                Lấy Từ Đề Thi Mẫu
              </button>
            </div>

            {/* NỘI DUNG THEO TAB */}
            {/* Tab 1: Bốc ngẫu nhiên theo bài học */}
            {pickerTab === 'random_range' && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 animate-in fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Từ Bài:
                    </label>
                    <select
                      value={startLesson}
                      onChange={(e) => setStartLesson(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-white"
                    >
                      {gradeLessons.map((l) => (
                        <option key={l.id} value={l.lesson_number}>
                          Bài {l.lesson_number}: {l.title.replace(/^Bài \d+:\s*/, '')}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Đến Bài:
                    </label>
                    <select
                      value={endLesson}
                      onChange={(e) => setEndLesson(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-white"
                    >
                      {gradeLessons.map((l) => (
                        <option key={l.id} value={l.lesson_number}>
                          Bài {l.lesson_number}: {l.title.replace(/^Bài \d+:\s*/, '')}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Số câu bốc:
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={30}
                        value={randomAmount}
                        onChange={(e) => setRandomAmount(Number(e.target.value))}
                        className="w-20 px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-white"
                      />
                      <button
                        type="button"
                        onClick={handleRandomPickForArena}
                        className="flex-1 px-3 py-2 bg-ocean-600 hover:bg-ocean-700 text-white text-xs font-black rounded-xl transition"
                      >
                        🎲 Bốc Ngay
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Tự chọn trong kho đề */}
            {pickerTab === 'manual_bank' && (
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5 max-h-56 overflow-y-auto pr-1 animate-in fade-in">
                {gradeLessons.map((les) => {
                  const qList = gradeQuestions.filter(
                    (q) => q.lesson_id === les.id || q.category === les.title
                  );
                  const isExp = expandedLessonId === les.id;

                  return (
                    <div key={les.id} className="border border-slate-200 rounded-xl bg-white overflow-hidden">
                      <div
                        onClick={() => setExpandedLessonId(isExp ? null : les.id)}
                        className="p-2.5 bg-slate-50 hover:bg-slate-100 cursor-pointer flex items-center justify-between text-xs font-bold"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded bg-ocean-100 text-ocean-800 text-[10px] font-black flex items-center justify-center">
                            B{les.lesson_number}
                          </span>
                          <span>{les.title}</span>
                          <span className="text-[10px] text-slate-500 font-normal">({qList.length} câu)</span>
                        </div>
                        {isExp ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </div>

                      {isExp && (
                        <div className="p-2.5 space-y-1.5 border-t border-slate-100">
                          {qList.map((q) => {
                            const isChecked = tempSelectedQuestions.some((item) => item.id === q.id);
                            return (
                              <div
                                key={q.id}
                                onClick={() => {
                                  if (isChecked) {
                                    setTempSelectedQuestions(tempSelectedQuestions.filter((item) => item.id !== q.id));
                                  } else {
                                    setTempSelectedQuestions([...tempSelectedQuestions, q]);
                                  }
                                }}
                                className={`p-2 rounded-lg border text-xs cursor-pointer flex items-start gap-2 ${
                                  isChecked ? 'bg-ocean-50 border-ocean-400' : 'hover:bg-slate-50 border-slate-200'
                                }`}
                              >
                                <div className="pt-0.5">
                                  {isChecked ? (
                                    <CheckSquare className="w-4 h-4 text-ocean-600" />
                                  ) : (
                                    <Square className="w-4 h-4 text-slate-300" />
                                  )}
                                </div>
                                <div className="text-slate-800 font-medium line-clamp-1">
                                  {q.content_json?.question || q.title}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Tab 3: Chọn từ Đề mẫu */}
            {pickerTab === 'template' && (
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 animate-in fade-in max-h-56 overflow-y-auto">
                {allTemplates.map((tpl) => (
                  <div
                    key={tpl.id}
                    className="p-3 bg-white rounded-xl border border-slate-200 hover:border-amber-400 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-ocean-100 text-ocean-800">
                          Khối {tpl.grade}
                        </span>
                        <span className="text-xs font-bold text-slate-900">{tpl.title}</span>
                      </div>
                      <p className="text-[11px] text-slate-500">{tpl.description}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const objOnly = tpl.questions.filter(isSingleChoiceQuestion);
                        if (objOnly.length === 0) {
                          alert(`Đề thi "${tpl.title}" không có câu trắc nghiệm 1 đáp án nào!`);
                          return;
                        }
                        setTempSelectedQuestions(objOnly);
                        alert(`Đã nạp ${objOnly.length} câu trắc nghiệm 1 đáp án từ "${tpl.title}"!`);
                      }}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg transition shrink-0"
                    >
                      Dùng Bộ Này
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Danh sách câu hỏi đã chọn cho Đấu trường */}
            <div className="space-y-2 border-t border-slate-100 pt-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>Danh sách câu hỏi Đấu trường ({tempSelectedQuestions.length} câu trắc nghiệm 1 đáp án):</span>
                <button
                  type="button"
                  onClick={() => setTempSelectedQuestions([])}
                  className="text-red-600 hover:underline text-[11px]"
                >
                  Xóa hết
                </button>
              </div>

              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {tempSelectedQuestions.map((q, idx) => (
                  <div
                    key={q.id}
                    className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-5 h-5 rounded-full bg-ocean-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="font-medium text-slate-800 truncate">
                        {q.content_json?.question || q.title}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setTempSelectedQuestions(
                          tempSelectedQuestions.filter((item) => item.id !== q.id)
                        )
                      }
                      className="text-slate-400 hover:text-red-600 p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Nút Xác Nhận Áp Dụng */}
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsQuestionPickerOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmSelectedQuestions}
                className="px-6 py-2.5 bg-gradient-to-r from-ocean-600 to-teal-600 hover:from-ocean-700 hover:to-teal-700 active:scale-95 text-white text-xs font-black rounded-xl shadow-md transition cursor-pointer"
              >
                Xác Nhận Áp Dụng Cho Đấu Trường ({tempSelectedQuestions.length} Câu Trắc Nghiệm 1 Đáp Án)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
