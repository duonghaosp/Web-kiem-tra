import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  Users,
  BookOpen,
  CalendarCheck,
  CheckCircle,
  BarChart3,
  Plus,
  Zap,
  Clock,
  ArrowRight,
  Sparkles,
  FileText,
  Volume2,
  AlertTriangle,
  Award,
  CheckCircle2,
  Smile,
  Globe,
} from 'lucide-react';
import { GrantXpModal } from '../components/gamification/GrantXpModal';
import { Profile, ClassItem } from '../types/database';
import { getStoredStudents, INITIAL_CLASSES } from '../data/studentsData';
import {
  GeoGlobeSticker,
  GeoMountainSticker,
  GeoCompassSticker,
  GeoMapSticker,
  GeoWeatherSticker,
  GeoSailboatSticker,
} from '../components/common/GeoStickers';
import { GeoRouteExplorerWidget } from '../components/dashboard/GeoRouteExplorerWidget';

export const TeacherDashboardPage: React.FC = () => {
  const { profile } = useAuth();

  // Đọc danh sách học sinh thực tế
  const [students, setStudents] = useState<Profile[]>(() => {
    return getStoredStudents();
  });

  // Đọc danh sách lớp thực tế
  const [classesList, setClassesList] = useState<ClassItem[]>(() => {
    try {
      const saved = localStorage.getItem('geo_classes_list');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn(e);
    }
    return INITIAL_CLASSES;
  });

  // Đọc danh sách bài nộp thực tế của học sinh
  const [submissions, setSubmissions] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('geo_student_submissions');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn(e);
    }
    return [];
  });

  // Đọc ngân hàng câu hỏi
  const [questionsCount, setQuestionsCount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('geo_question_bank');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed.length;
      }
    } catch (e) {
      console.warn(e);
    }
    return 120; // 120 câu hỏi chuẩn 4 khối
  });

  // Đọc danh sách đề thi / đợt giao bài thực tế
  const [assignmentsCount, setAssignmentsCount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('geo_assignments');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed.length;
      }
    } catch (e) {
      console.warn(e);
    }
    return 4;
  });

  // Lắng nghe sự kiện cập nhật dữ liệu thời gian thực
  useEffect(() => {
    const reloadData = () => {
      try {
        setStudents(getStoredStudents());

        const savedClasses = localStorage.getItem('geo_classes_list');
        if (savedClasses) setClassesList(JSON.parse(savedClasses));

        const savedSubs = localStorage.getItem('geo_student_submissions');
        if (savedSubs) setSubmissions(JSON.parse(savedSubs));

        const savedBank = localStorage.getItem('geo_question_bank');
        if (savedBank) {
          const parsed = JSON.parse(savedBank);
          if (Array.isArray(parsed)) setQuestionsCount(parsed.length);
        }

        const savedAsgs = localStorage.getItem('geo_assignments');
        if (savedAsgs) {
          const parsed = JSON.parse(savedAsgs);
          if (Array.isArray(parsed)) setAssignmentsCount(parsed.length);
        }
      } catch (e) {
        console.warn(e);
      }
    };

    window.addEventListener('storage', reloadData);
    window.addEventListener('geo_notifications_updated', reloadData);
    return () => {
      window.removeEventListener('storage', reloadData);
      window.removeEventListener('geo_notifications_updated', reloadData);
    };
  }, []);

  // Lọc các bài nộp thực tế đang chờ cô nhận xét / chấm điểm
  const pendingSubmissions = useMemo(() => {
    return submissions.filter(
      (s) =>
        s.status === 'waiting_teacher_grading' ||
        !s.teacher_feedback_text ||
        s.teacher_feedback_text.trim() === ''
    );
  }, [submissions]);

  // Lời chào tùy biến linh hoạt theo buổi trong ngày (Gợi ý 2)
  const timeBasedGreeting = useMemo(() => {
    const hour = new Date().getHours();
    const rawName = profile?.full_name || 'Cô Dương Thu Hảo';
    const displayName = rawName.includes('Hảo') ? 'Cô Hảo' : rawName;

    if (hour >= 5 && hour < 12) {
      return {
        greeting: `Chào buổi sáng ${displayName}`,
        icon: '🌅',
        wish: 'Chúc Cô một ngày mới tràn đầy năng lượng và niềm vui bên bục giảng!',
      };
    }
    if (hour >= 12 && hour < 18) {
      return {
        greeting: `Chào buổi chiều ${displayName}`,
        icon: '☀️',
        wish: 'Chúc Cô có những giờ dạy Địa lí thật hào hứng và hiệu quả!',
      };
    }
    if (hour >= 18 && hour < 22) {
      return {
        greeting: `Chúc ${displayName} buổi tối an lành`,
        icon: '🌙',
        wish: 'Sau một ngày bận rộn, chúc Cô có những giây phút thư thái và ấm áp!',
      };
    }
    return {
      greeting: `${displayName} nhớ nghỉ ngơi sớm nhé`,
      icon: '🌟',
      wish: 'Đêm đã khuya rồi, Cô giữ gìn sức khỏe để ngày mai tiếp tục cùng các em nhé!',
    };
  }, [profile]);

  // Thống kê động thực tế
  const stats = useMemo(() => {
    return {
      totalStudents: students.length,
      totalClasses: classesList.length || 16,
      totalQuestions: questionsCount,
      totalExams: assignmentsCount,
      pendingGrading: pendingSubmissions.length,
    };
  }, [students, classesList, questionsCount, assignmentsCount, pendingSubmissions]);

  const [selectedStudentForXp, setSelectedStudentForXp] = useState<Profile | null>(null);
  const [isGrantXpOpen, setIsGrantXpOpen] = useState(false);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Chào mừng Cô Hảo theo phong cách Scandinavian Forest & Golden Ochre (Ảnh mẫu mới) */}
      <div className="bg-[#2D4441] rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-[#1E2D2B]/15 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden border border-[#385551]">
        {/* Đường cong hải trình / địa hình màu vàng Ochre chuẩn ảnh mẫu */}
        <svg
          className="absolute right-0 bottom-0 w-full max-w-xl h-44 opacity-35 pointer-events-none"
          viewBox="0 0 500 150"
          fill="none"
        >
          <path
            d="M0 130C90 70 160 140 240 75C320 15 400 110 500 45V150H0Z"
            fill="url(#trendFill)"
          />
          <path
            d="M0 130C90 70 160 140 240 75C320 15 400 110 500 45"
            stroke="#C9942C"
            strokeWidth="2.5"
            strokeDasharray="6 4"
          />
          <circle cx="240" cy="75" r="5" fill="#C9942C" stroke="#FFFFFF" strokeWidth="2" />
          <circle cx="370" cy="85" r="4" fill="#C9942C" stroke="#FFFFFF" strokeWidth="1.5" />
          <defs>
            <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="150" gradientUnits="userSpaceOnUse">
              <stop stopColor="#C9942C" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#2D4441" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>

        <div className="space-y-2.5 relative z-10 max-w-2xl">
          {/* Huy hiệu kết hợp Icon quả địa cầu xoay nhẹ & font cách điệu Hảo Hảo (Gợi ý 1, 3) */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-[#F0D59D] text-xs font-bold border border-white/15 shadow-xs">
            <Globe className="w-4 h-4 text-[#F5C76D] animate-[spin_20s_linear_infinite] shrink-0" />
            <span>Không gian làm việc địa lí của</span>
            <span
              className="text-base sm:text-lg font-bold text-[#FFE6A7] tracking-wider drop-shadow-sm select-none"
              style={{ fontFamily: "'Dancing Script', 'Caveat', cursive" }}
            >
              Hảo Hảo
            </span>
            <Sparkles className="w-3.5 h-3.5 text-[#F5C76D] animate-pulse shrink-0" />
          </div>

          {/* Lời chào biến chuyển theo buổi trong ngày (Gợi ý 2) */}
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white drop-shadow-sm flex items-center gap-2.5 flex-wrap">
            <span>{timeBasedGreeting.greeting}!</span>
            <span className="text-2xl sm:text-3xl inline-block hover:scale-125 transition-transform duration-300 cursor-default select-none">
              {timeBasedGreeting.icon}
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-[#F0D59D]/90 font-medium italic">
            {timeBasedGreeting.wish}
          </p>

          {stats.pendingGrading > 0 ? (
            <p className="text-xs sm:text-sm text-[#D1E3DF] leading-relaxed font-medium">
              Hôm nay có <strong className="text-[#F5C76D] font-black">{stats.pendingGrading} bài kiểm tra</strong> đang chờ Cô chấm điểm và ghi lời phê nhận xét cho học sinh.
            </p>
          ) : (
            <p className="text-xs sm:text-sm text-[#D1E3DF] leading-relaxed font-medium">
              🎉 Tuyệt vời! Hiện không còn bài kiểm tra nào đang chờ chấm. Cô đã hoàn tất nhận xét cho tất cả học sinh.
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <Link
            to="/assignments"
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#C9942C] hover:bg-[#B58022] active:scale-95 text-white font-black text-xs sm:text-sm shadow-md transition cursor-pointer"
          >
            <CalendarCheck className="w-4 h-4 text-white" />
            <span>Tạo Đề & Giao Bài</span>
          </Link>
          <Link
            to="/grading"
            className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 text-white font-bold text-xs sm:text-sm backdrop-blur-xs border border-white/20 transition cursor-pointer"
          >
            <CheckCircle className="w-4 h-4 text-white" />
            <span>Chấm Bài & Nhận Xét</span>
          </Link>
          {/* Sticker Đỉnh núi Fansipan / Tây Bắc */}
          <GeoMountainSticker className="w-14 h-14 hidden lg:inline-block drop-shadow-md" />
        </div>
      </div>

      {/* 4 Thẻ Thống kê Tổng quan (Dữ liệu Thực tế) - Độ tương phản cao, rõ chữ tuyệt đối */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-[#CFDCD9] shadow-xs flex items-center gap-3.5 hover:shadow-md transition">
          <div className="w-12 h-12 rounded-2xl bg-[#EEF4F2] flex items-center justify-center shrink-0 border border-[#D5E2DF]">
            <GeoCompassSticker className="w-7 h-7" />
          </div>
          <div className="min-w-0">
            <div className="text-2xl font-black text-[#1E2D2B]">{stats.totalStudents}</div>
            <div className="text-[11px] text-slate-600 font-bold truncate">Học Sinh ({stats.totalClasses} Lớp)</div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-[#CFDCD9] shadow-xs flex items-center gap-3.5 hover:shadow-md transition">
          <div className="w-12 h-12 rounded-2xl bg-[#FAF6EE] flex items-center justify-center shrink-0 border border-[#ECD9B5]">
            <GeoMapSticker className="w-7 h-7" />
          </div>
          <div className="min-w-0">
            <div className="text-2xl font-black text-[#1E2D2B]">{stats.totalQuestions}</div>
            <div className="text-[11px] text-slate-600 font-bold truncate">Câu Hỏi Kho Đề</div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-[#CFDCD9] shadow-xs flex items-center gap-3.5 hover:shadow-md transition">
          <div className="w-12 h-12 rounded-2xl bg-[#F0F6FA] flex items-center justify-center shrink-0 border border-[#D0E2EE]">
            <GeoSailboatSticker className="w-7 h-7" />
          </div>
          <div className="min-w-0">
            <div className="text-2xl font-black text-[#1E2D2B]">{stats.totalExams}</div>
            <div className="text-[11px] text-slate-600 font-bold truncate">Đợt Giao Bài / Đề Thi</div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-[#CFDCD9] shadow-xs flex items-center gap-3.5 hover:shadow-md transition">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
              stats.pendingGrading > 0 ? 'bg-[#FAF6EE] border-[#ECD9B5]' : 'bg-[#EEF4F2] border-[#D5E2DF]'
            }`}
          >
            {stats.pendingGrading > 0 ? (
              <GeoWeatherSticker className="w-7 h-7" />
            ) : (
              <CheckCircle2 className="w-7 h-7 text-[#2D4441]" />
            )}
          </div>
          <div className="min-w-0">
            <div className="text-2xl font-black text-[#1E2D2B]">{stats.pendingGrading}</div>
            <div className="text-[11px] text-slate-600 font-bold truncate">
              {stats.pendingGrading > 0 ? 'Bài Chờ Nhận Xét' : 'Đã Chấm Hoàn Tất'}
            </div>
          </div>
        </div>
      </div>

      {/* Danh sách bài nộp gần đây cần chấm */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <span>Hàng Đợi Chấm Bài & Ghi Lời Phê Nhận Xét</span>
                {pendingSubmissions.length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                )}
              </h3>
              <p className="text-xs text-slate-500">Các bài nộp thực tế của học sinh đang chờ cô phê duyệt</p>
            </div>
            <Link
              to="/grading"
              className="text-xs font-bold text-ocean-600 hover:text-ocean-700 flex items-center gap-1 cursor-pointer"
            >
              Xem trang chấm bài <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {pendingSubmissions.length === 0 ? (
              <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-emerald-200 p-6 space-y-2">
                <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="font-black text-slate-800 text-sm">
                  🎉 Tuyệt vời! Hiện không còn bài nộp nào đang chờ nhận xét
                </div>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Cô Hảo đã hoàn tất toàn bộ bài kiểm tra của học sinh. Các em đã nhận được điểm số và lời phê.
                </p>
                <Link
                  to="/grading?tab=graded"
                  className="inline-block mt-2 px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition cursor-pointer"
                >
                  Xem Danh Sách Đã Nhận Xét Xong ({submissions.length})
                </Link>
              </div>
            ) : (
              pendingSubmissions.slice(0, 5).map((sub) => (
                <div
                  key={sub.id}
                  className="p-4 rounded-2xl border border-[#D0DEDC] hover:border-[#C9942C] hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{sub.student_name}</span>
                      <span className="text-[11px] font-bold text-slate-500 bg-slate-200/70 px-2 py-0.2 rounded-md">
                        {sub.class_name}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {sub.student_code}
                      </span>
                    </div>
                    <div className="text-xs text-slate-600">{sub.assignment_title}</div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-3">
                      <span>Thời gian nộp: {sub.submitted_at || 'Vừa xong'}</span>
                      <span>
                        Điểm tạm tính: <strong className="text-slate-700">{sub.score}đ</strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedStudentForXp({
                          id: sub.id,
                          username: sub.student_code || sub.student_name,
                          full_name: sub.student_name,
                          role: 'student',
                          xp: 120,
                          level: 2,
                        });
                        setIsGrantXpOpen(true);
                      }}
                      className="p-2 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 transition border border-amber-200 cursor-pointer"
                      title="Tặng điểm XP khen thưởng"
                    >
                      <Zap className="w-4 h-4 fill-amber-500 text-amber-500" />
                    </button>

                    <Link
                      to={`/grading?submissionId=${sub.id}`}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#2D4441] hover:bg-[#233835] text-white text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
                    >
                      <CheckCircle className="w-3.5 h-3.5 text-[#C9942C]" />
                      <span>Nhận Xét & Chấm</span>
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Cột Phải: Widget Hành Trình Địa Lí & Lối tắt thao tác nhanh */}
        <div className="space-y-4">
          {/* Mini Widget Lược Đồ Hành Trình Địa Lí Thế Giới (Gợi ý 3 & 4) */}
          <GeoRouteExplorerWidget />

          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
            <h3 className="font-bold text-slate-900 text-sm">Thao Tác Nhanh Của Cô Hảo</h3>

            <div className="space-y-2">
              <Link
                to="/classes"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-[#FAF6EE] text-slate-700 hover:text-[#774F1B] hover:border-[#ECD9B5] transition border border-slate-100 text-xs font-semibold cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  Quản lý Danh Sách {stats.totalClasses} Lớp & Học Sinh
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>

              <Link
                to="/questions"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 transition border border-slate-100 text-xs font-semibold cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-600" />
                  Ngân hàng câu hỏi ({stats.totalQuestions} câu)
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>

              <Link
                to="/reports"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-700 hover:text-rose-700 transition border border-slate-100 text-xs font-semibold cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  Báo cáo Thống kê & Cảnh báo Học lực
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-3xl p-5 text-white shadow-md space-y-2">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-200" />
              <h4 className="font-bold text-sm">Gamification Tích Cực</h4>
            </div>
            <p className="text-xs text-amber-100 leading-relaxed">
              Học sinh rất thích được tặng điểm XP và nhận huy hiệu. Cô hãy bấm nút tặng XP khi các em có phát biểu hay trong giờ Địa lí nhé!
            </p>
          </div>
        </div>
      </div>

      {/* Modal Tặng XP */}
      <GrantXpModal
        isOpen={isGrantXpOpen}
        onClose={() => setIsGrantXpOpen(false)}
        student={selectedStudentForXp}
      />
    </div>
  );
};
