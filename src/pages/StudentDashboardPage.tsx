import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  BookOpen,
  CalendarCheck,
  CheckCircle,
  Trophy,
  Zap,
  Clock,
  ArrowRight,
  Sparkles,
  Award,
  BarChart2,
  FileCheck2,
  Info,
  LayoutDashboard,
  BellRing,
  MessageSquareQuote,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react';
import { LevelProgressBar } from '../components/gamification/LevelProgressBar';
import { BadgeList } from '../components/common/BadgeList';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { fetchAssignmentsFromCloud } from '../lib/assignmentCloudSync';
import { getStudentBadges, getStudentLookupKeys, ALL_BADGES } from '../data/badgeService';
import { GeoGlobeSticker, GeoTelescopeSticker, GeoCompassSticker, GeoMountainSticker } from '../components/common/GeoStickers';
import { playSoftClick } from '../utils/soundEffects';

export const StudentDashboardPage: React.FC = () => {
  const { profile, role } = useAuth();
  const isTeacher = role === 'teacher' || role === 'admin';

  // Nhận diện Học Sinh Mẫu Thử Nghiệm hoặc Giáo viên đang xem trước
  const isMockStudent = useMemo(() => {
    return Boolean(
      isTeacher ||
      sessionStorage.getItem('is_teacher_previewing') === 'true' ||
      profile?.full_name?.toLowerCase().includes('học sinh mẫu') ||
      profile?.username?.toLowerCase().includes('hoc_sinh_mau') ||
      profile?.student_code === 'HS_MOCK' ||
      profile?.student_code === 'HS0601'
    );
  }, [isTeacher, profile]);

  // Bộ lọc Khối dành riêng cho Học sinh mẫu thử nghiệm
  const [mockGradeFilter, setMockGradeFilter] = useState<'all' | '6' | '7' | '8' | '9'>('all');

  // 1. Quản lý Huy hiệu thực tế được Cô Hảo trao tặng
  const studentKey = profile?.student_code || profile?.id || profile?.username || profile?.full_name || '';
  const studentName = profile?.full_name || '';
  const [unlockedBadgeIds, setUnlockedBadgeIds] = useState<string[]>(() =>
    getStudentBadges(studentKey, studentName)
  );

  useEffect(() => {
    const handleBadgeChange = () => {
      const currentKey = profile?.student_code || profile?.id || profile?.username || profile?.full_name || '';
      const currentName = profile?.full_name || '';
      setUnlockedBadgeIds(getStudentBadges(currentKey, currentName));
    };
    handleBadgeChange();
    window.addEventListener('storage', handleBadgeChange);
    window.addEventListener('geo_badges_updated', handleBadgeChange);
    return () => {
      window.removeEventListener('storage', handleBadgeChange);
      window.removeEventListener('geo_badges_updated', handleBadgeChange);
    };
  }, [profile, studentKey, studentName]);

  // Đọc danh sách thông báo từ Cô Hảo
  const [notifications, setNotifications] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('geo_student_notifications');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn(e);
    }
    return [];
  });

  // Xác định chính xác Khối lớp của học sinh (Khối 6, 7, 8, hoặc 9)
  const studentGrade = useMemo(() => {
    if (profile?.grade) return Number(profile.grade);
    if (profile?.class_name) {
      const match = profile.class_name.match(/\d+/);
      if (match) return Number(match[0]);
    }
    if (profile?.student_code) {
      const match = profile.student_code.match(/\d+/);
      if (match) {
        const numStr = match[0];
        if (numStr.startsWith('0') && numStr.length >= 2) return Number(numStr[1]);
        if (numStr.length >= 2) return Number(numStr[0]);
        if (numStr.length === 1) return Number(numStr);
      }
    }
    return 7; // Mặc định khối 7
  }, [profile]);

  // Hàm đọc và lọc danh sách bài tập/đề thi chuẩn theo đúng Khối & Lớp của học sinh
  const loadFilteredAssignments = () => {
    try {
      const storedAsgs = localStorage.getItem('geo_assignments');
      const allSubs = JSON.parse(localStorage.getItem('geo_student_submissions') || '[]');
      const lookupKeys = getStudentLookupKeys(
        profile?.student_code || profile?.id || profile?.username || profile?.full_name || '',
        profile?.full_name || ''
      ).map((k) => k.toLowerCase());

      const MOCK_ASG_IDS = ['asg_1', 'asg_2', 'asg_3', 'asg_4'];
      let rawAsgs: any[] = [];
      if (storedAsgs !== null) {
        const parsed = JSON.parse(storedAsgs);
        if (Array.isArray(parsed)) {
          // Lọc bỏ hoàn toàn các bài mẫu mặc định cũ theo yêu cầu của Cô Hảo
          rawAsgs = parsed.filter((a: any) => !MOCK_ASG_IDS.includes(a.id));
          // Nếu có chứa bài mẫu cũ, dọn sạch ngay trong LocalStorage
          if (rawAsgs.length !== parsed.length) {
            localStorage.setItem('geo_assignments', JSON.stringify(rawAsgs));
          }
        }
      }
      // Khi giáo viên chưa giao bài nào thì danh sách hoàn toàn trống (rawAsgs = [])

      const studentClass = profile?.class_name || '';

      // 🛑 BỘ LỌC BÀI KIỂM TRA:
      const filtered = rawAsgs.filter((a: any) => {
        // ✨ HỌC SINH MẪU / GIÁO VIÊN THỬ NGHIỆM:
        // Được phép xem và tham gia BẤT KỲ bài kiểm tra nào do giáo viên đưa ra của mọi Khối 6, 7, 8, 9
        if (isMockStudent) {
          if (mockGradeFilter !== 'all') {
            return Number(a.grade) === Number(mockGradeFilter);
          }
          return true; // Hiển thị toàn bộ bài thi để cô Hảo thử nghiệm
        }

        // 1. Kiểm tra Khối lớp với học sinh thật
        const asgGrade = Number(a.grade);
        if (asgGrade && asgGrade !== studentGrade) {
          return false; // Khác khối lớp -> ẨN TUYỆT ĐỐI
        }

        // 2. Kiểm tra danh sách Lớp được giao (target_ids)
        if (Array.isArray(a.target_ids) && a.target_ids.length > 0) {
          if (!a.target_ids.includes('all')) {
            if (studentClass) {
              const matchedClass = a.target_ids.some((t: string) =>
                t.toLowerCase().includes(studentClass.toLowerCase()) ||
                studentClass.toLowerCase().includes(t.toLowerCase())
              );
              if (!matchedClass) return false; // Không thuộc lớp được giao -> ẨN
            }
          }
        }

        return true;
      });

      return filtered.map((a: any) => {
        // Lấy bài nộp CỦA RIÊNG HỌC SINH NÀY
        const mySub = allSubs.find((s: any) => {
          if (s.assignment_id !== a.id) return false;
          const sCode = (s.student_code || '').toLowerCase();
          const sName = (s.student_name || '').toLowerCase();
          return lookupKeys.includes(sCode) || lookupKeys.includes(sName);
        });

        const isDone = Boolean(mySub);
        const finalScore = mySub?.score ?? null;
        const feedback = mySub?.teacher_feedback_text || '';

        return {
          id: a.id,
          title: a.title,
          exam_id: a.exam_id,
          grade: a.grade || studentGrade,
          category: a.category || 'Đánh giá thường xuyên',
          duration_minutes: a.duration_minutes || 15,
          deadline: a.deadline ? new Date(a.deadline).toLocaleString('vi-VN') : 'Không giới hạn',
          status: isDone ? 'completed' : 'pending',
          score: finalScore,
          teacher_feedback: feedback,
          questions_count: a.questions_count || (a.questions ? a.questions.length : 10),
          is_paused: Boolean(a.is_paused),
        };
      });
    } catch (e) {
      console.warn('Lỗi đọc assignments:', e);
      return [];
    }
  };

  const [assignments, setAssignments] = useState<any[]>(() => loadFilteredAssignments());

  // Lắng nghe sự kiện cập nhật đề thi hoặc bài nộp mới
  useEffect(() => {
    const reloadData = () => {
      try {
        const savedNotifs = localStorage.getItem('geo_student_notifications');
        if (savedNotifs) setNotifications(JSON.parse(savedNotifs));
        setAssignments(loadFilteredAssignments());
      } catch (e) {
        console.warn(e);
      }
    };

    reloadData();
    fetchAssignmentsFromCloud().then(() => {
      reloadData();
    });
    window.addEventListener('storage', reloadData);
    window.addEventListener('geo_notifications_updated', reloadData);
    window.addEventListener('geo_assignments_updated', reloadData);
    window.addEventListener('geo_student_submissions_updated', reloadData);
    return () => {
      window.removeEventListener('storage', reloadData);
      window.removeEventListener('geo_notifications_updated', reloadData);
      window.removeEventListener('geo_assignments_updated', reloadData);
      window.removeEventListener('geo_student_submissions_updated', reloadData);
    };
  }, [profile, studentGrade, isTeacher, isMockStudent, mockGradeFilter]);

  // Lọc thông báo chỉ dành riêng cho học sinh này
  const myNotifications = useMemo(() => {
    if (!profile) return [];
    const lookupKeys = getStudentLookupKeys(
      profile.student_code || profile.id || profile.username || profile.full_name || ''
    ).map((k) => k.toLowerCase());

    return notifications.filter((n: any) => {
      const nCode = (n.student_code || '').toLowerCase();
      const nName = (n.student_name || '').toLowerCase();
      if (!nCode && !nName) return true; // Thông báo chung
      return lookupKeys.includes(nCode) || lookupKeys.includes(nName);
    });
  }, [notifications, profile]);

  // Xóa toàn bộ bài làm thử nghiệm của học sinh mẫu (Gợi ý 3)
  const handleClearMockSubmissions = () => {
    playSoftClick();
    const allSubs = JSON.parse(localStorage.getItem('geo_student_submissions') || '[]');
    const lookupKeys = getStudentLookupKeys(
      profile?.student_code || profile?.id || profile?.username || profile?.full_name || '',
      profile?.full_name || ''
    ).map((k) => k.toLowerCase());

    const remaining = allSubs.filter((s: any) => {
      const sCode = (s.student_code || '').toLowerCase();
      const sName = (s.student_name || '').toLowerCase();
      const isMock =
        lookupKeys.includes(sCode) ||
        lookupKeys.includes(sName) ||
        sName.includes('học sinh mẫu') ||
        sCode.includes('hs_mock') ||
        sCode.includes('hs_test');
      return !isMock;
    });

    localStorage.setItem('geo_student_submissions', JSON.stringify(remaining));

    // Dọn dẹp cả kết quả lưu tạm thời geo_result_...
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('geo_result_')) {
          try {
            const data = JSON.parse(localStorage.getItem(key) || '{}');
            const name = (data.student_name || '').toLowerCase();
            const code = (data.student_code || '').toLowerCase();
            if (name.includes('học sinh mẫu') || code.includes('hs_mock') || code.includes('hs_test') || lookupKeys.includes(code)) {
              keysToRemove.push(key);
            }
          } catch (e) {}
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch (e) {
      console.warn(e);
    }

    window.dispatchEvent(new Event('geo_student_submissions_updated'));
    window.dispatchEvent(new Event('geo_assignments_updated'));
    alert('✨ Đã làm mới lịch sử thử nghiệm! Toàn bộ đề thi đã trở về trạng thái chưa làm để cô tiếp tục kiểm tra.');
  };

  const latestNotification = myNotifications.length > 0 ? myNotifications[0] : null;

  // Lấy danh sách bài kiểm tra đã hoàn thành thực tế của học sinh này
  const completedExams = assignments
    .filter((a) => a.status === 'completed' && a.score !== null)
    .sort((a, b) => a.id.localeCompare(b.id));

  const realScoreHistory = completedExams.map((a, idx) => ({
    test: `Bài ${idx + 1}`,
    name: a.title,
    'Điểm Số': Number(a.score),
  }));

  // Tính chênh lệch điểm số thực tế
  let growthBadgeText = 'Chưa có bài kiểm tra';
  let growthBadgeClass = 'bg-slate-100 text-slate-600';
  if (realScoreHistory.length >= 2) {
    const firstScore = realScoreHistory[0]['Điểm Số'];
    const lastScore = realScoreHistory[realScoreHistory.length - 1]['Điểm Số'];
    const diff = Number((lastScore - firstScore).toFixed(1));
    if (diff > 0) {
      growthBadgeText = `Tăng trưởng +${diff}đ`;
      growthBadgeClass = 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    } else if (diff < 0) {
      growthBadgeText = `Thay đổi ${diff}đ`;
      growthBadgeClass = 'bg-amber-50 text-amber-800 border border-amber-200';
    } else {
      growthBadgeText = `Ổn định ${lastScore}đ`;
      growthBadgeClass = 'bg-blue-50 text-blue-700 border border-blue-200';
    }
  } else if (realScoreHistory.length === 1) {
    growthBadgeText = `Bài 1: ${realScoreHistory[0]['Điểm Số']}đ`;
    growthBadgeClass = 'bg-ocean-50 text-ocean-700 border border-ocean-200';
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* ⚠️ THÔNG BÁO GIẢI THÍCH DÀNH RIÊNG CHO GIÁO VIÊN KHI XEM TRƯỚC MÀN HÌNH HỌC SINH */}
      {(isTeacher || isMockStudent) && (
        <div className="p-4 bg-gradient-to-r from-amber-50 via-sky-50 to-emerald-50 border-2 border-amber-300 rounded-3xl text-slate-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-2xl bg-amber-200 text-amber-900 flex items-center justify-center shrink-0 font-bold shadow-xs">
              <Sparkles className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <div className="text-xs font-black text-amber-950 uppercase tracking-wide flex items-center gap-2">
                <span>Chế Độ Thử Nghiệm: Học Sinh Mẫu Toàn Năng (Dành Cho Cô Hảo)</span>
                <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full font-bold">
                  Khối 6-9
                </span>
              </div>
              <p className="text-xs text-slate-700 mt-0.5 leading-relaxed">
                Cô đang xem trước dưới góc nhìn <strong>Học Sinh Mẫu</strong>. Hệ thống cho phép học sinh mẫu tham gia <strong>bất kỳ bài kiểm tra nào của tất cả các Khối 6, 7, 8, 9</strong> do cô đưa ra để cô dễ dàng thử nghiệm đề, làm bài thử và chấm thử.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={handleClearMockSubmissions}
              className="flex items-center gap-1.5 px-3 py-2 bg-amber-200/90 hover:bg-amber-300 text-amber-950 rounded-xl text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer whitespace-nowrap"
              title="Xóa kết quả làm thử của học sinh mẫu để đưa tất cả các bài kiểm tra về trạng thái mới ban đầu"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Làm Mới Bài Làm Thử
            </button>

            <Link
              to="/teacher-dashboard"
              className="flex items-center gap-1.5 px-4 py-2 bg-[#2D4441] hover:bg-[#233835] text-white rounded-xl text-xs font-black shrink-0 shadow-xs transition active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <LayoutDashboard className="w-4 h-4 text-[#C9942C]" />
              Về Bàn Làm Việc
            </Link>
          </div>
        </div>
      )}

      {/* KHUNG THÔNG BÁO LỜI PHÊ HOẶC HUY HIỆU DANH DỰ TỪ CÔ HẢO */}
      {latestNotification && (
        <div
          className={`p-4 sm:p-5 rounded-3xl text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border ${
            latestNotification.type === 'badge' || latestNotification.badge_id
              ? 'bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 border-amber-400/50'
              : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-ocean-700 border-emerald-400/40'
          }`}
        >
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-yellow-300 shrink-0 font-black shadow-inner">
              {latestNotification.type === 'badge' || latestNotification.badge_id ? (
                <Award className="w-6 h-6 animate-bounce" />
              ) : (
                <BellRing className="w-6 h-6 animate-pulse" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    latestNotification.type === 'badge' || latestNotification.badge_id
                      ? 'bg-yellow-300 text-amber-950'
                      : 'bg-yellow-400 text-yellow-950'
                  }`}
                >
                  {latestNotification.type === 'badge' || latestNotification.badge_id
                    ? '🎖️ Huy Hiệu Khen Thưởng Mới Từ Cô Hảo'
                    : 'Lời Phê Mới Từ Cô Hảo'}
                </span>
                <span className="text-[10px] text-amber-100 font-medium">
                  {new Date(latestNotification.created_at).toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <p className="text-xs sm:text-sm font-bold text-white mt-1 leading-snug">
                "{latestNotification.feedback_text}"
              </p>
              {latestNotification.assignment_title && !latestNotification.type && (
                <div className="text-[11px] text-emerald-100/90 mt-0.5">
                  Bài kiểm tra: <strong>{latestNotification.assignment_title}</strong>
                </div>
              )}
            </div>
          </div>

          {latestNotification.type === 'badge' || latestNotification.badge_id ? (
            <a
              href="#badge-collection"
              className="px-4 py-2.5 bg-yellow-300 hover:bg-yellow-200 text-amber-950 rounded-2xl text-xs font-black shrink-0 shadow-md transition active:scale-95 flex items-center gap-1.5 cursor-pointer self-end sm:self-auto"
            >
              <Award className="w-4 h-4" />
              Xem Bộ Sưu Tập Huy Hiệu 🏆
            </a>
          ) : (
            <Link
              to={`/results/${latestNotification.assignment_id || 'asg_1'}`}
              className="px-4 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-amber-950 rounded-2xl text-xs font-black shrink-0 shadow-md transition active:scale-95 flex items-center gap-1.5 cursor-pointer self-end sm:self-auto"
            >
              <MessageSquareQuote className="w-4 h-4" />
              Xem Chi Tiết Lời Phê & Điểm Số
            </Link>
          )}
        </div>
      )}

      {/* Header Cá nhân Học sinh - Phong cách Scandinavian Forest & Golden Ochre (Ảnh mẫu mới) */}
      <div className="bg-[#2D4441] rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-[#1E2D2B]/15 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden border border-[#385551]">
        {/* Đường cong lượn sóng hải trình màu vàng Ochre */}
        <svg
          className="absolute right-0 bottom-0 w-full max-w-lg h-36 opacity-30 pointer-events-none"
          viewBox="0 0 500 150"
          fill="none"
        >
          <path
            d="M0 120C100 60 180 140 260 80C340 20 420 100 500 40V150H0Z"
            fill="url(#studentTrendFill)"
          />
          <path
            d="M0 120C100 60 180 140 260 80C340 20 420 100 500 40"
            stroke="#C9942C"
            strokeWidth="2.5"
            strokeDasharray="6 4"
          />
          <circle cx="260" cy="80" r="5" fill="#C9942C" stroke="#FFFFFF" strokeWidth="2" />
          <circle cx="420" cy="100" r="4" fill="#C9942C" stroke="#FFFFFF" strokeWidth="1.5" />
          <defs>
            <linearGradient id="studentTrendFill" x1="0" y1="0" x2="0" y2="150" gradientUnits="userSpaceOnUse">
              <stop stopColor="#C9942C" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#2D4441" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>

        <div className="space-y-2 relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-md text-[#F0D59D] text-xs font-bold border border-white/15 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#C9942C]" />
            <span>{isTeacher ? 'Góc Học Tập Môn Địa Lí (Màn Hình Mẫu Học Sinh)' : 'Góc Học Tập Môn Địa Lí'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white drop-shadow-sm">
            {isTeacher ? 'Chào mừng Em Học Sinh! 🚀' : `Chào mừng ${profile?.full_name || 'Em Học Sinh'}! 🚀`}
          </h1>
          <p className="text-xs sm:text-sm text-[#D1E3DF] leading-relaxed font-medium">
            Hãy hoàn thành bài kiểm tra đúng hạn để tích lũy thật nhiều điểm thưởng XP và leo top bảng xếp hạng cùng các bạn trong lớp nhé!
          </p>
        </div>

        <div className="flex items-center gap-4 relative z-10">
          <div className="flex items-center gap-3.5 bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/20 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-[#C9942C] text-white flex items-center justify-center font-black text-xl shadow-md">
              {isTeacher ? 3 : (profile?.level || 3)}
            </div>
            <div>
              <div className="text-[11px] text-[#A8C4BF] font-bold uppercase tracking-wider">CẤP ĐỘ CỦA EM</div>
              <div className="text-lg font-black text-white flex items-center gap-1">
                <Zap className="w-4 h-4 fill-[#C9942C] text-[#C9942C]" />
                <span>{(isTeacher ? 320 : (profile?.xp || 320)).toLocaleString()} XP</span>
              </div>
            </div>
          </div>
          {/* Sticker Quả địa cầu */}
          <GeoGlobeSticker className="w-16 h-16 hidden sm:inline-block drop-shadow-md" />
        </div>
      </div>

      {/* 1. Thanh Tiến Độ Level 1-100 (Dành cho Học sinh) */}
      <LevelProgressBar xp={isTeacher ? 320 : (profile?.xp || 320)} />

      {/* 2. Danh Sách Bài Kiểm Tra Cần Làm */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-ocean-600" />
              <span>Bài Kiểm Tra & Đố Vui Đang Chờ Em</span>
            </h3>
            <p className="text-xs text-slate-500">Bấm "Bắt đầu làm bài" để vào màn hình kiểm tra có tính giờ</p>
          </div>

          {/* Bộ lọc Khối lớp dành riêng cho Học sinh mẫu thử nghiệm */}
          {isMockStudent && (
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200 self-start sm:self-auto overflow-x-auto max-w-full">
              {(['all', '6', '7', '8', '9'] as const).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => {
                    playSoftClick();
                    setMockGradeFilter(g);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer whitespace-nowrap ${
                    mockGradeFilter === g
                      ? 'bg-[#2D4441] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                  }`}
                >
                  {g === 'all' ? 'Tất Cả Khối' : `Khối ${g}`}
                </button>
              ))}
            </div>
          )}
        </div>

        {assignments.length === 0 ? (
          <div className="text-center py-12 px-6 bg-slate-50/80 rounded-3xl border-2 border-dashed border-slate-200 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-[#E6F0ED] text-[#2D4441] flex items-center justify-center mx-auto shadow-inner border border-[#CFDCD9]">
              <CalendarCheck className="w-7 h-7 text-[#2D4441]" />
            </div>
            <h4 className="font-black text-slate-800 text-base">
              {isMockStudent
                ? `Hiện Tại Chưa Có Bài Kiểm Tra Nào Được Giao ${mockGradeFilter !== 'all' ? `(Khối ${mockGradeFilter})` : ''}`
                : `Hiện Tại Cô Hảo Chưa Giao Bài Kiểm Tra Nào Cho Em`}
            </h4>
            <p className="text-xs text-slate-500 max-w-lg mx-auto leading-relaxed">
              {isMockStudent
                ? 'Khi Cô Hảo vào mục "Quản Lý Bài Tập & Đề Thi" để tạo đề thi mới và giao cho các lớp, danh sách bài kiểm tra sẽ tự động xuất hiện tại đây để cô thử nghiệm hoặc học sinh làm bài.'
                : `Khi nào Cô Hảo giao bài kiểm tra hoặc đố vui cho Khối ${studentGrade} ${profile?.class_name ? `(${profile.class_name})` : ''}, đề thi sẽ tự động hiển thị tại đây để em làm bài nhé!`}
            </p>
            {isMockStudent && (
              <div className="pt-2">
                <Link
                  to="/assignments"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2D4441] hover:bg-[#233835] text-white text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  <span>➕ Vào Quản Lý & Giao Bài Mới Ngay</span>
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {assignments.map((asg) => (
              <div
                key={asg.id}
                className={`p-4 sm:p-5 rounded-2xl border transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  asg.status === 'completed'
                    ? 'bg-emerald-50/40 border-emerald-300'
                    : 'bg-white border-slate-200 hover:border-ocean-300 shadow-xs'
                }`}
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-bold bg-[#FAF6EE] text-[#774F1B] border border-[#ECD9B5] px-2.5 py-0.5 rounded-full">
                      Khối {asg.grade}
                    </span>
                    <span className="text-[11px] font-bold bg-ocean-100 text-ocean-800 px-2.5 py-0.5 rounded-full">
                      {asg.category}
                    </span>
                    {asg.is_paused && (
                      <span className="text-[11px] font-black bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                        <Clock className="w-3.5 h-3.5 text-amber-700" /> Tạm Dừng Nhận Bài
                      </span>
                    )}
                    <span className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                      <Clock className="w-3.5 h-3.5" /> {asg.duration_minutes} phút
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      • {asg.questions_count} câu hỏi
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                    {asg.title}
                  </h4>

                  <div className="text-xs text-slate-500 flex items-center gap-2">
                    <span>Hạn chót nộp: <strong className="text-slate-700">{asg.deadline}</strong></span>
                  </div>

                  {/* Hiển thị điểm và lời phê của Cô Hảo */}
                  {asg.status === 'completed' && (
                    <div className="pt-1.5 space-y-1">
                      <div className="text-xs font-semibold text-emerald-800 flex items-center gap-2 flex-wrap">
                        <span className="bg-emerald-100 text-emerald-950 px-2.5 py-0.5 rounded-md font-black">
                          Điểm Đạt Được: {asg.score !== null ? `${asg.score}đ` : 'Đang cập nhật'}
                        </span>
                        {asg.teacher_feedback ? (
                          <span className="text-emerald-900 font-bold flex items-center gap-1 bg-emerald-100/60 px-2 py-0.5 rounded-md">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            Cô Hảo đã gửi nhận xét
                          </span>
                        ) : (
                          <span className="text-amber-700 text-[11px] font-semibold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            ⏳ Chờ cô ghi lời phê
                          </span>
                        )}
                      </div>

                      {asg.teacher_feedback && (
                        <div className="text-xs text-slate-700 font-medium italic bg-white/80 p-2.5 rounded-xl border border-emerald-200">
                          "{asg.teacher_feedback}"
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="shrink-0 self-end md:self-center flex flex-wrap items-center gap-2">
                  {asg.status === 'completed' ? (
                    <>
                      <Link
                        to={`/results/${asg.id}`}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                      >
                        <FileCheck2 className="w-4 h-4 text-emerald-600" />
                        Xem Lại Bài & Lời Phê
                      </Link>
                      {isMockStudent && (
                        <Link
                          to={`/take-exam/${asg.id}`}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FAF6EE] hover:bg-[#F4E8D3] text-[#774F1B] border border-[#ECD9B5] text-xs font-bold transition cursor-pointer shadow-2xs active:scale-95"
                          title="Làm lại bài kiểm tra thử nghiệm để kiểm tra nhiều tình huống điểm số khác nhau"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-[#C9942C]" />
                          Làm Lại Thử Nghiệm
                        </Link>
                      )}
                    </>
                  ) : asg.is_paused ? (
                    isMockStudent ? (
                      <Link
                        to={`/take-exam/${asg.id}`}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition cursor-pointer shadow-xs active:scale-95"
                        title="Đề đang tạm dừng với học sinh thật, nhưng cho phép cô Hảo làm thử"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                        Làm Thử (Đề Tạm Dừng)
                      </Link>
                    ) : (
                      <div className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-50 text-amber-900 border border-amber-300 text-xs font-bold cursor-not-allowed shadow-2xs">
                        <span>⏸️ Đang Tạm Dừng</span>
                      </div>
                    )
                  ) : (
                    <Link
                      to={`/take-exam/${asg.id}`}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs sm:text-sm font-bold shadow transition cursor-pointer"
                    >
                      Bắt Đầu Làm Bài
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Lưới 2 Cột: Biểu đồ Tiến bộ Cá nhân Thực tế + Bộ Sưu Tập Huy Hiệu do Cô Hảo Trao */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Biểu đồ tiến bộ thực tế */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-ocean-600" />
              Biểu Đồ Phát Triển Năng Lực Địa Lí Của Học Sinh
            </h3>
            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${growthBadgeClass}`}>
              {growthBadgeText}
            </span>
          </div>

          {realScoreHistory.length === 0 ? (
            <div className="py-12 px-4 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
              <BarChart2 className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="font-bold text-slate-700 text-xs sm:text-sm">
                Chưa có dữ liệu bài kiểm tra thực tế
              </p>
              <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
                Sau khi em làm các bài kiểm tra cô Hảo giao và được chấm điểm, biểu đồ đường sẽ tự động vẽ theo dõi tiến bộ của em tại đây!
              </p>
            </div>
          ) : (
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={realScoreHistory} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="test" tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-2.5 rounded-xl shadow-lg border border-slate-200 text-xs space-y-1">
                            <div className="font-bold text-slate-800">{data.name}</div>
                            <div className="font-black text-ocean-700">
                              Điểm số: {data['Điểm Số']} / 10đ
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Điểm Số"
                    stroke="#0284c7"
                    strokeWidth={3}
                    dot={{ r: 5, fill: '#0284c7', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Huy hiệu rèn luyện do Cô Hảo trao tặng */}
        <div id="badge-collection" className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4 scroll-mt-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              Bộ Sưu Tập Huy Hiệu Địa Lí Đã Mở Khóa
            </h3>
            <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
              {unlockedBadgeIds.length}/{ALL_BADGES.length} Huy hiệu
            </span>
          </div>

          <BadgeList unlockedBadgeIds={unlockedBadgeIds} />
        </div>
      </div>
    </div>
  );
};
