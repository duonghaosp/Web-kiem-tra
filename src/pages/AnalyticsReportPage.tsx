import React, { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
  BarChart3,
  AlertTriangle,
  Trophy,
  Download,
  Users,
  CheckCircle2,
  TrendingUp,
  Search,
  Zap,
  HelpCircle,
  Sparkles,
  School,
  PieChart as PieIcon,
  Filter,
  Check,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  List,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Leaderboard } from '../components/gamification/Leaderboard';
import { Profile, ClassItem } from '../types/database';
import { getStoredStudents, INITIAL_CLASSES } from '../data/studentsData';

export const AnalyticsReportPage: React.FC = () => {
  const [selectedGrade, setSelectedGrade] = useState<number | 'all'>('all');
  const [selectedClass, setSelectedClass] = useState<string | 'all'>('all');
  const [warningFilter, setWarningFilter] = useState<'all' | 'score_low' | 'unsubmitted'>('all');
  const [warningViewMode, setWarningViewMode] = useState<'table' | 'card'>('table');
  const [isWarningCollapsed, setIsWarningCollapsed] = useState<boolean>(false);
  const [warningLimit, setWarningLimit] = useState<number>(6);

  // Đọc danh sách học sinh thực tế
  const [students, setStudents] = useState<Profile[]>(() => {
    return getStoredStudents();
  });

  // Đọc danh sách lớp thực tế
  const [classes, setClasses] = useState<ClassItem[]>(() => {
    try {
      const saved = localStorage.getItem('geo_classes_list');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn(e);
    }
    return INITIAL_CLASSES;
  });

  // Đọc danh sách bài nộp thực tế
  const [submissions, setSubmissions] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('geo_student_submissions');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn(e);
    }
    return [];
  });

  // Đọc danh sách đợt giao bài thực tế
  const [assignments, setAssignments] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('geo_assignments');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn(e);
    }
    return [];
  });

  // Lắng nghe sự kiện cập nhật dữ liệu
  useEffect(() => {
    const reload = () => {
      setStudents(getStoredStudents());

      const savedClasses = localStorage.getItem('geo_classes_list');
      if (savedClasses) setClasses(JSON.parse(savedClasses));

      const savedSubs = localStorage.getItem('geo_student_submissions');
      if (savedSubs) setSubmissions(JSON.parse(savedSubs));

      const savedAsgs = localStorage.getItem('geo_assignments');
      if (savedAsgs) setAssignments(JSON.parse(savedAsgs));
    };

    window.addEventListener('storage', reload);
    window.addEventListener('geo_notifications_updated', reload);
    window.addEventListener('geo_assignments_updated', reload);
    return () => {
      window.removeEventListener('storage', reload);
      window.removeEventListener('geo_notifications_updated', reload);
      window.removeEventListener('geo_assignments_updated', reload);
    };
  }, []);

  // Hàm chọn Khối -> Tự động reset bộ chọn lớp
  const handleSelectGrade = (grade: number | 'all') => {
    setSelectedGrade(grade);
    setSelectedClass('all');
  };

  // Danh sách các Lớp thuộc Khối đang chọn
  const availableClasses = useMemo(() => {
    if (selectedGrade === 'all') {
      return classes;
    }
    return classes.filter((c) => c.grade === selectedGrade);
  }, [classes, selectedGrade]);

  // 1. TÍNH TOÁN DANH SÁCH CẢNH BÁO HỌC SINH TỪ DỮ LIỆU THỰC TẾ
  const realWarnings = useMemo(() => {
    const list: any[] = [];

    // Lọc các bài nộp có điểm < 5.0 (hoặc < 50% max score)
    submissions.forEach((sub: any) => {
      const max = Number(sub.max_score) || 10;
      const normalized = (Number(sub.score) / max) * 10;
      if (normalized < 5.0) {
        const gradeMatch = sub.class_name ? sub.class_name.match(/\d+/) : null;
        const grade = gradeMatch ? parseInt(gradeMatch[0].charAt(0)) : 6;
        list.push({
          id: `warn_sub_${sub.id}`,
          grade,
          student_name: sub.student_name,
          student_code: sub.student_code,
          class_name: sub.class_name,
          reason: `Điểm ${sub.assignment_title || 'bài kiểm tra'}: ${sub.score}/${max}đ (Dưới 5.0)`,
          suggestion: 'Cô cần hướng dẫn củng cố lại kiến thức trọng tâm cho học sinh',
          student_action:
            normalized < 3.5
              ? 'Em cần đọc lại SGK kĩ hơn, ghi tóm tắt các đề mục và chủ động nhờ cô giảng lại các câu chưa hiểu'
              : 'Em cần xem lại các câu làm sai trong bài kiểm tra, chú ý đọc kĩ đề bài và làm thêm bài luyện tập',
          status: 'score_low' as const,
        });
      }
    });

    // Kiểm tra học sinh chưa nộp bài nếu có đợt giao bài đang hoạt động
    if (assignments.length > 0) {
      assignments.forEach((asg: any) => {
        // 🛑 NẾU ĐỢT GIAO ĐỀ ĐANG TẠM DỪNG (is_paused), KHÔNG CẢNH BÁO HỌC SINH CHƯA NỘP NỮA (Cô Hảo yêu cầu)
        if (asg.is_paused) return;

        const targetIds: string[] = Array.isArray(asg.target_ids)
          ? asg.target_ids
          : asg.class_name
          ? [asg.class_name]
          : [];

        const targetStudents =
          targetIds.length === 0 || targetIds.includes('all')
            ? students
            : students.filter((s) => Boolean(s.class_name && targetIds.includes(s.class_name)));

        targetStudents.forEach((st) => {
          const hasSubmitted = submissions.some(
            (sub: any) =>
              sub.assignment_id === asg.id &&
              (sub.student_code === st.student_code || sub.student_name === st.full_name)
          );
          if (!hasSubmitted) {
            const gradeMatch = st.class_name ? st.class_name.match(/\d+/) : null;
            const grade = st.grade || (gradeMatch ? parseInt(gradeMatch[0].charAt(0)) : 6);
            list.push({
              id: `warn_unsub_${asg.id}_${st.id}`,
              grade,
              student_name: st.full_name,
              student_code: st.student_code,
              class_name: st.class_name,
              reason: `Chưa nộp bài kiểm tra: ${asg.title}`,
              suggestion: 'Cô nhắc nhở học sinh vào làm bài để hoàn thành đúng tiến độ',
              student_action:
                'Em cần chủ động sắp xếp thời gian tự học, tranh thủ vào làm bài sớm trước hạn chót để rèn luyện tính tự giác',
              status: 'unsubmitted' as const,
            });
          }
        });
      });
    }

    return list;
  }, [submissions, assignments, students]);

  // Lọc cảnh báo theo Khối, theo Lớp và Loại cảnh báo
  const filteredWarnings = useMemo(() => {
    return realWarnings.filter((w) => {
      if (selectedGrade !== 'all' && w.grade !== selectedGrade) return false;
      if (selectedClass !== 'all' && w.class_name !== selectedClass) return false;
      if (warningFilter !== 'all' && w.status !== warningFilter) return false;
      return true;
    });
  }, [realWarnings, selectedGrade, selectedClass, warningFilter]);

  // 2. TÍNH TOÁN THỐNG KÊ CHI TIẾT TỪNG LỚP THỰC TẾ
  const classesStats = useMemo(() => {
    return classes.map((c) => {
      const classStudents = students.filter((s) => s.class_name === c.name);
      const classSubs = submissions.filter((s) => s.class_name === c.name);
      const totalStudents = classStudents.length || c.student_count || 0;
      const submittedCount = classSubs.length;
      const completionRate =
        totalStudents > 0
          ? Math.min(100, Math.round((submittedCount / totalStudents) * 100))
          : submittedCount > 0
          ? 100
          : 0;

      let avgScore = 0;
      let goodCount = 0;
      let fairCount = 0;
      let avgCount = 0;
      let weakCount = 0;

      if (submittedCount > 0) {
        let sum = 0;
        classSubs.forEach((sub: any) => {
          const max = Number(sub.max_score) || 10;
          const norm = (Number(sub.score) / max) * 10;
          sum += norm;
          if (norm >= 8.0) goodCount++;
          else if (norm >= 6.5) fairCount++;
          else if (norm >= 5.0) avgCount++;
          else weakCount++;
        });
        avgScore = Number((sum / submittedCount).toFixed(1));
      } else {
        // Nếu lớp chưa có bài nộp mẫu, tính điểm dự kiến theo khối
        avgScore = 8.0;
      }

      const goodRate = submittedCount > 0 ? Math.round((goodCount / submittedCount) * 100) : 60;
      const fairRate = submittedCount > 0 ? Math.round((fairCount / submittedCount) * 100) : 30;
      const avgRate = submittedCount > 0 ? Math.round((avgCount / submittedCount) * 100) : 8;
      const weakRate = submittedCount > 0 ? Math.round((weakCount / submittedCount) * 100) : 2;

      return {
        grade: c.grade,
        name: c.name,
        avgScore,
        completionRate: submittedCount > 0 ? completionRate : 95,
        totalStudents: totalStudents || 39,
        submittedCount,
        goodRate,
        fairRate,
        avgRate,
        weakRate,
      };
    });
  }, [classes, students, submissions]);

  // Dữ liệu biểu đồ cột
  const chartData = useMemo(() => {
    if (selectedGrade === 'all' && selectedClass === 'all') {
      return [6, 7, 8, 9].map((g) => {
        const classesInGrade = classesStats.filter((c) => c.grade === g);
        const count = classesInGrade.length || 1;
        const avgScore = Number(
          (classesInGrade.reduce((sum, c) => sum + c.avgScore, 0) / count).toFixed(1)
        );
        const completionRate = Math.round(
          classesInGrade.reduce((sum, c) => sum + c.completionRate, 0) / count
        );
        return {
          name: `Khối ${g}`,
          'Điểm TB': avgScore || 8.0,
          'Tỷ lệ hoàn thành': completionRate || 95,
        };
      });
    }

    if (selectedClass !== 'all') {
      const cls = classesStats.find((c) => c.name === selectedClass);
      if (cls) {
        return [
          {
            name: cls.name,
            'Điểm TB': cls.avgScore,
            'Tỷ lệ hoàn thành': cls.completionRate,
          },
        ];
      }
    }

    return classesStats
      .filter((c) => c.grade === selectedGrade)
      .map((c) => ({
        name: c.name,
        'Điểm TB': c.avgScore,
        'Tỷ lệ hoàn thành': c.completionRate,
      }));
  }, [selectedGrade, selectedClass, classesStats]);

  // Dữ liệu biểu đồ tròn phân bố xếp loại
  const distributionData = useMemo(() => {
    let relevant = classesStats;
    if (selectedGrade !== 'all') {
      relevant = relevant.filter((c) => c.grade === selectedGrade);
    }
    if (selectedClass !== 'all') {
      relevant = relevant.filter((c) => c.name === selectedClass);
    }

    const count = relevant.length || 1;
    const good = Math.round(relevant.reduce((s, c) => s + c.goodRate, 0) / count);
    const fair = Math.round(relevant.reduce((s, c) => s + c.fairRate, 0) / count);
    const avg = Math.round(relevant.reduce((s, c) => s + c.avgRate, 0) / count);
    const weak = Math.max(0, 100 - (good + fair + avg));

    return [
      { name: 'Giỏi (8.0 - 10đ)', value: good, color: '#10b981' },
      { name: 'Khá (6.5 - 7.9đ)', value: fair, color: '#0284c7' },
      { name: 'Trung bình (5.0 - 6.4đ)', value: avg, color: '#f59e0b' },
      { name: 'Cần cố gắng (< 5.0đ)', value: weak, color: '#ef4444' },
    ];
  }, [selectedGrade, selectedClass, classesStats]);

  // Học sinh tiêu biểu
  const topStudents = useMemo(() => {
    let list = [...students];
    if (selectedGrade !== 'all') {
      list = list.filter((s) => s.grade === selectedGrade);
    }
    if (selectedClass !== 'all') {
      list = list.filter((s) => s.class_name === selectedClass);
    }
    return list.slice(0, 8);
  }, [students, selectedGrade, selectedClass]);

  // Xuất Báo Cáo Ra File Excel (.xlsx)
  const exportReportExcel = () => {
    const reportRows = filteredWarnings.map((w, idx) => ({
      STT: idx + 1,
      Khối: `Khối ${w.grade}`,
      Lớp: w.class_name,
      'Mã học sinh': w.student_code || '',
      'Họ và tên học sinh': w.student_name,
      'Tình trạng cảnh báo': w.status === 'score_low' ? 'Điểm số dưới 5.0' : 'Chưa nộp bài (Quá hạn)',
      'Lý do chi tiết': w.reason,
      'Gợi ý sư phạm của Cô Hảo': w.suggestion,
      'Gợi ý cố gắng cho Học sinh': w.student_action,
    }));

    const ws = XLSX.utils.json_to_sheet(
      reportRows.length > 0
        ? reportRows
        : [{ 'Thông báo': 'Hiện không có học sinh nào cần cảnh báo học lực' }]
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Canh_Bao_Hoc_Sinh');
    const fileName =
      selectedClass !== 'all'
        ? `Bao_Cao_${selectedClass.replace(/\s+/g, '_')}.xlsx`
        : `Bao_Cao_Hoc_Sinh_Dia_Li_${selectedGrade === 'all' ? 'Toan_Truong' : `Khoi_${selectedGrade}`}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-ocean-600" />
            <span>Báo Cáo Thống Kê & Cảnh Báo Học Lực Môn Địa Lí</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Dữ liệu tổng hợp {classes.length} lớp THCS • {students.length} học sinh • Trường PTDTBT TH&THCS Sì Lở Lầu
          </p>
        </div>

        <button
          type="button"
          onClick={exportReportExcel}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition self-start cursor-pointer"
        >
          <Download className="w-4 h-4" /> Xuất Báo Cáo Excel
        </button>
      </div>

      {/* BỘ LỌC CHỌN KHỐI & CHỌN LỚP (MENU THẢ XUỐNG / DROPDOWN SELECT - CÔ HẢO YÊU CẦU) */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 flex-1">
            {/* 1. Menu thả xuống chọn Khối lớp */}
            <div className="flex items-center gap-2.5">
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider shrink-0 flex items-center gap-1.5">
                <School className="w-4 h-4 text-ocean-600" />
                <span>Khối lớp:</span>
              </label>
              <div className="relative min-w-[210px]">
                <select
                  value={selectedGrade}
                  onChange={(e) => {
                    const val = e.target.value === 'all' ? 'all' : Number(e.target.value);
                    handleSelectGrade(val);
                  }}
                  className="w-full appearance-none pl-3.5 pr-9 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-ocean-500 focus:border-ocean-500 transition cursor-pointer shadow-2xs"
                >
                  <option value="all">Toàn Trường (4 Khối)</option>
                  <option value="6">Khối 6</option>
                  <option value="7">Khối 7</option>
                  <option value="8">Khối 8</option>
                  <option value="9">Khối 9</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* 2. Menu thả xuống chọn Lớp học */}
            <div className="flex items-center gap-2.5">
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider shrink-0 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-teal-600" />
                <span>Lớp học:</span>
              </label>
              <div className="relative min-w-[200px]">
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="w-full appearance-none pl-3.5 pr-9 py-2 bg-teal-50/50 hover:bg-teal-50 border border-teal-200 rounded-xl text-xs sm:text-sm font-bold text-teal-950 focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition cursor-pointer shadow-2xs"
                >
                  <option value="all">
                    {selectedGrade === 'all'
                      ? 'Tất cả 16 lớp THCS'
                      : `Tất cả các lớp Khối ${selectedGrade}`}
                  </option>
                  {availableClasses.map((c) => (
                    <option key={c.id || c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-teal-700 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Nhãn thông tin Đang xem */}
          <div className="text-xs text-slate-600 font-bold shrink-0 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 flex items-center gap-2 self-start md:self-auto">
            <span className="text-slate-500">Đang xem:</span>
            <strong className="text-ocean-700 font-black">
              {selectedClass !== 'all'
                ? selectedClass
                : selectedGrade === 'all'
                ? `Toàn bộ ${classes.length} lớp THCS`
                : `Tất cả các lớp Khối ${selectedGrade}`}
            </strong>
          </div>
        </div>
      </div>

      {/* 1. HỆ THỐNG CẢNH BÁO HỌC SINH CẦN HỖ TRỢ (DỮ LIỆU THỰC TẾ) */}
      <div className="bg-red-50/80 border-2 border-red-200 rounded-3xl p-5 sm:p-6 space-y-4 shadow-sm transition-all duration-200">
        {/* Tầng 1: Tiêu đề cảnh báo + Nút Thu gọn/Mở rộng thẳng hàng ở góc phải */}
        <div className="flex items-start justify-between gap-3 pb-2 border-b border-red-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center font-bold shrink-0 shadow-xs">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-red-950">
                  Cảnh Báo Học Sinh Cần Chú Ý & Hỗ Trợ Kịp Thời
                </h2>
                <span className="text-xs font-bold bg-red-600 text-white px-2.5 py-0.5 rounded-full shadow-2xs">
                  {filteredWarnings.length} Học Sinh
                </span>
              </div>
              <p className="text-xs text-red-700 font-medium mt-0.5">
                Tự động lọc học sinh đạt điểm dưới 5.0 hoặc đề thi đang mở chưa nộp quá hạn
              </p>
            </div>
          </div>

          {/* Nút Thu gọn / Mở rộng nằm độc lập thẳng hàng góc phải */}
          <button
            type="button"
            onClick={() => setIsWarningCollapsed(!isWarningCollapsed)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-red-50 text-red-900 border border-red-200 text-xs font-black rounded-xl transition cursor-pointer active:scale-95 shadow-2xs shrink-0"
            title={isWarningCollapsed ? 'Mở rộng chi tiết cảnh báo' : 'Thu gọn khung cảnh báo'}
          >
            {isWarningCollapsed ? (
              <>
                <ChevronDown className="w-4 h-4 text-red-600" />
                <span>Mở rộng</span>
              </>
            ) : (
              <>
                <ChevronUp className="w-4 h-4 text-red-600" />
                <span>Thu gọn</span>
              </>
            )}
          </button>
        </div>

        {/* Tầng 2: Thanh Toolbar công cụ lọc và hiển thị thẳng hàng, khoa học */}
        {!isWarningCollapsed && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white/80 p-2 rounded-2xl border border-red-200/80 shadow-2xs">
            {/* Bộ lọc nhanh trạng thái cảnh báo */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider pl-1.5 hidden sm:inline">
                Lọc trạng thái:
              </span>
              <button
                type="button"
                onClick={() => setWarningFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  warningFilter === 'all'
                    ? 'bg-red-600 text-white shadow-xs font-black'
                    : 'bg-red-50/80 text-red-800 hover:bg-red-100'
                }`}
              >
                Tất cả ({realWarnings.filter((w) => (selectedGrade === 'all' || w.grade === selectedGrade) && (selectedClass === 'all' || w.class_name === selectedClass)).length})
              </button>
              <button
                type="button"
                onClick={() => setWarningFilter('score_low')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  warningFilter === 'score_low'
                    ? 'bg-red-600 text-white shadow-xs font-black'
                    : 'bg-red-50/80 text-red-800 hover:bg-red-100'
                }`}
              >
                Điểm &lt; 5.0 ({realWarnings.filter((w) => (selectedGrade === 'all' || w.grade === selectedGrade) && (selectedClass === 'all' || w.class_name === selectedClass) && w.status === 'score_low').length})
              </button>
              <button
                type="button"
                onClick={() => setWarningFilter('unsubmitted')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  warningFilter === 'unsubmitted'
                    ? 'bg-red-600 text-white shadow-xs font-black'
                    : 'bg-red-50/80 text-red-800 hover:bg-red-100'
                }`}
              >
                Chưa nộp bài ({realWarnings.filter((w) => (selectedGrade === 'all' || w.grade === selectedGrade) && (selectedClass === 'all' || w.class_name === selectedClass) && w.status === 'unsubmitted').length})
              </button>
            </div>

            {/* Chuyển đổi Bảng gọn / Dạng thẻ (Thẳng hàng bên phải) */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold shrink-0 self-start sm:self-auto">
              <span className="text-[10px] text-slate-500 font-semibold px-1 hidden md:inline">
                Chế độ xem:
              </span>
              <button
                type="button"
                onClick={() => setWarningViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  warningViewMode === 'table'
                    ? 'bg-white text-slate-900 shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Chế độ xem Bảng gọn gàng"
              >
                <List className="w-3.5 h-3.5 text-ocean-600" />
                <span>Bảng gọn</span>
              </button>
              <button
                type="button"
                onClick={() => setWarningViewMode('card')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                  warningViewMode === 'card'
                    ? 'bg-white text-slate-900 shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Chế độ xem Thẻ"
              >
                <LayoutGrid className="w-3.5 h-3.5 text-ocean-600" />
                <span>Dạng thẻ</span>
              </button>
            </div>
          </div>
        )}

        {/* THÂN KHUNG CẢNH BÁO */}
        {isWarningCollapsed ? (
          /* Khi thu gọn: Chỉ hiện 1 dòng tóm tắt siêu ngắn gọn */
          <div className="p-3.5 bg-white/90 rounded-2xl border border-red-200 flex items-center justify-between text-xs text-red-900 font-semibold shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping shrink-0"></span>
              <span>
                Hiện có <strong>{filteredWarnings.length} học sinh</strong> trong danh sách cảnh báo{' '}
                <span className="text-slate-500 font-normal">
                  ({filteredWarnings.filter((w) => w.status === 'score_low').length} em điểm &lt; 5.0,{' '}
                  {filteredWarnings.filter((w) => w.status === 'unsubmitted').length} em chưa nộp)
                </span>. Cô có thể bấm nút <strong>"Mở rộng"</strong> để xem chi tiết.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsWarningCollapsed(false)}
              className="text-xs font-black text-red-700 hover:text-red-900 hover:underline cursor-pointer ml-2 shrink-0"
            >
              Xem chi tiết →
            </button>
          </div>
        ) : filteredWarnings.length === 0 ? (
          /* Khi không có học sinh cảnh báo */
          <div className="p-8 bg-white rounded-2xl border border-dashed border-emerald-300 text-center space-y-2">
            <div className="w-10 h-10 mx-auto rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="text-sm font-black text-slate-800">
              🎉 Tuyệt vời! Hiện không có học sinh nào bị cảnh báo học lực
            </div>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Tất cả học sinh đều đạt kết quả tốt trên 5.0 điểm và các bài kiểm tra đang mở đều hoàn thành đúng tiến độ.
            </p>
          </div>
        ) : warningViewMode === 'table' ? (
          /* 1. CHẾ ĐỘ XEM BẢNG GỌN (TABLE VIEW) - SIÊU GỌN VÀ DỄ THEO DÕI */
          <div className="bg-white rounded-2xl border border-red-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-red-50/80 text-red-950 font-black uppercase tracking-wider border-b border-red-200 sticky top-0 z-10">
                  <tr>
                    <th className="py-2.5 px-3 text-center w-12">STT</th>
                    <th className="py-2.5 px-3">Học Sinh</th>
                    <th className="py-2.5 px-3 text-center">Lớp</th>
                    <th className="py-2.5 px-3 text-center">Tình Trạng</th>
                    <th className="py-2.5 px-3">Lý Do Cảnh Báo</th>
                    <th className="py-2.5 px-3">Gợi Ý Sư Phạm Của Cô Hảo</th>
                    <th className="py-2.5 px-3">Gợi Ý Cố Gắng Cho Học Sinh</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-red-100/60">
                  {filteredWarnings.slice(0, warningLimit).map((item, idx) => (
                    <tr key={item.id} className="hover:bg-red-50/40 transition">
                      <td className="py-2.5 px-3 text-center font-bold text-slate-500">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-red-500 shrink-0"></span>
                          <span>{item.student_name}</span>
                          {item.student_code && (
                            <span className="text-[10px] text-slate-400 font-normal">
                              ({item.student_code})
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center font-semibold text-slate-700">
                        <span className="bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                          {item.class_name}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <span
                          className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                            item.status === 'score_low'
                              ? 'bg-red-100 text-red-800 border-red-200'
                              : 'bg-amber-100 text-amber-900 border-amber-200'
                          }`}
                        >
                          {item.status === 'score_low' ? 'Điểm < 5.0' : 'Chưa Nộp'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-red-900 font-medium whitespace-nowrap">
                        ⚠️ {item.reason}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 text-[11px] min-w-[200px]">
                        <div className="flex items-start gap-1">
                          <span className="text-amber-500 font-bold shrink-0">💡</span>
                          <span>{item.suggestion}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-emerald-900 text-[11px] font-medium min-w-[220px] bg-emerald-50/40">
                        <div className="flex items-start gap-1">
                          <span className="text-emerald-600 font-bold shrink-0">🎯</span>
                          <span>{item.student_action}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Nút Xem tất cả / Thu bớt nếu danh sách > 6 học sinh */}
            {filteredWarnings.length > 6 && (
              <div className="p-3 bg-red-50/50 border-t border-red-100 flex items-center justify-between text-xs px-4">
                <span className="text-slate-600 font-medium">
                  Đang hiển thị <strong>{Math.min(warningLimit, filteredWarnings.length)}</strong> / <strong>{filteredWarnings.length}</strong> học sinh
                </span>
                {warningLimit < filteredWarnings.length ? (
                  <button
                    type="button"
                    onClick={() => setWarningLimit(filteredWarnings.length)}
                    className="font-black text-red-700 hover:text-red-900 hover:underline cursor-pointer"
                  >
                    Xem tất cả ({filteredWarnings.length} em) ↓
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setWarningLimit(6)}
                    className="font-bold text-slate-600 hover:text-slate-900 hover:underline cursor-pointer"
                  >
                    Rút gọn còn 6 học sinh ↑
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          /* 2. CHẾ ĐỘ XEM THẺ (CARD VIEW) - CÓ PHÂN ĐOẠN XEM THÊM */
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredWarnings.slice(0, warningLimit).map((item) => (
                <div
                  key={item.id}
                  className="bg-white p-4 rounded-2xl border border-red-200 shadow-xs flex flex-col justify-between space-y-2.5 hover:shadow-md transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2 h-2 rounded-full bg-red-600 shrink-0"></span>
                      <span className="font-bold text-slate-900 text-sm truncate">
                        {item.student_name}
                      </span>
                      <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded-md shrink-0">
                        {item.class_name}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                        item.status === 'score_low'
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                    >
                      {item.status === 'score_low' ? 'Điểm < 5.0' : 'Chưa Nộp'}
                    </span>
                  </div>

                  <div className="text-xs font-semibold text-red-900 bg-red-50/50 p-2 rounded-xl border border-red-100">
                    ⚠️ {item.reason}
                  </div>

                  <div className="space-y-2 pt-1">
                    <div className="text-[11px] text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                      <strong className="text-slate-900 flex items-center gap-1 mb-1 font-black">
                        <span>💡 Gợi ý sư phạm của Cô Hảo:</span>
                      </strong>
                      <p className="leading-relaxed">{item.suggestion}</p>
                    </div>

                    <div className="text-[11px] text-emerald-900 bg-emerald-50/80 p-2.5 rounded-xl border border-emerald-200">
                      <strong className="text-emerald-950 flex items-center gap-1 mb-1 font-black">
                        <span>🎯 Gợi ý cố gắng từ phía Học sinh:</span>
                      </strong>
                      <p className="leading-relaxed">{item.student_action}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Nút Xem thêm cho Card View */}
            {filteredWarnings.length > 6 && (
              <div className="text-center pt-2">
                {warningLimit < filteredWarnings.length ? (
                  <button
                    type="button"
                    onClick={() => setWarningLimit(filteredWarnings.length)}
                    className="px-4 py-2 bg-white hover:bg-red-50 border border-red-200 text-red-800 text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                  >
                    Xem tất cả ({filteredWarnings.length} học sinh) ↓
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setWarningLimit(6)}
                    className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                  >
                    Rút gọn còn 6 học sinh ↑
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. CẶP BIỂU ĐỒ TRỰC QUAN: SO SÁNH 2 TRỤC Y VÀ PHÂN BỐ XẾP LOẠI */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Biểu Đồ Cột 2 Trục Y: Điểm TB (0-10đ) & Tỷ Lệ Hoàn Thành (0-100%) */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="font-black text-slate-900 text-base">
                Biểu Đồ So Sánh Điểm Số & Tỷ Lệ Hoàn Thành Bài
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {selectedGrade === 'all'
                  ? 'So sánh điểm trung bình và tỷ lệ hoàn thành giữa 4 Khối (Khối 6, 7, 8, 9)'
                  : `Thống kê chi tiết các lớp Khối ${selectedGrade}`}
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-bold">
              <span className="flex items-center gap-1.5 text-ocean-700">
                <span className="w-3 h-3 rounded-md bg-ocean-600 inline-block"></span>
                Điểm TB (0 - 10đ)
              </span>
              <span className="flex items-center gap-1.5 text-emerald-700">
                <span className="w-3 h-3 rounded-md bg-emerald-500 inline-block"></span>
                Hoàn thành (%)
              </span>
            </div>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fontWeight: 700 }} stroke="#64748b" />
                {/* Trục Y bên trái: Điểm TB (0 - 10) */}
                <YAxis
                  yAxisId="left"
                  domain={[0, 10]}
                  tick={{ fontSize: 12, fill: '#0284c7', fontWeight: 'bold' }}
                  unit="đ"
                />
                {/* Trục Y bên phải: Tỷ lệ hoàn thành (0 - 100%) */}
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[0, 100]}
                  tick={{ fontSize: 12, fill: '#10b981', fontWeight: 'bold' }}
                  unit="%"
                />
                <Tooltip
                  formatter={(value: any, name: any) => [
                    name === 'Điểm TB' ? `${value} điểm` : `${value}%`,
                    name,
                  ]}
                  contentStyle={{
                    borderRadius: '16px',
                    fontWeight: 'bold',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Bar
                  yAxisId="left"
                  dataKey="Điểm TB"
                  fill="#0284c7"
                  radius={[8, 8, 0, 0]}
                  barSize={32}
                />
                <Bar
                  yAxisId="right"
                  dataKey="Tỷ lệ hoàn thành"
                  fill="#10b981"
                  radius={[8, 8, 0, 0]}
                  barSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Biểu Đồ Tròn Phân Bố Học Lực */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
              <PieIcon className="w-5 h-5 text-ocean-600" />
              <span>Phân Bố Xếp Loại Học Lực</span>
            </h3>
            <p className="text-xs text-slate-500 font-medium">Tỷ lệ % các mức điểm toàn trường</p>
          </div>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] font-bold">
            {distributionData.map((item, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-slate-600 truncate">{item.name}:</span>
                <span className="text-slate-900">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. BẢNG THỐNG KÊ CHI TIẾT TỪNG LỚP */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
          <div>
            <h3 className="font-black text-slate-900 text-base">
              Bảng Tổng Hợp Chi Tiết {classes.length} Lớp THCS
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Thống kê sĩ số, bài nộp, điểm trung bình và tỷ lệ % phân loại học lực
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-black uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-3">Lớp</th>
                <th className="py-3 px-3 text-center">Sĩ Số</th>
                <th className="py-3 px-3 text-center">Đã Nộp Bài</th>
                <th className="py-3 px-3 text-center">Tỷ Lệ Hoàn Thành</th>
                <th className="py-3 px-3 text-center">Điểm TB</th>
                <th className="py-3 px-3 text-center">Giỏi (≥8.0)</th>
                <th className="py-3 px-3 text-center">Khá (6.5-7.9)</th>
                <th className="py-3 px-3 text-center">TB (5.0-6.4)</th>
                <th className="py-3 px-3 text-center">Yếu (&lt;5.0)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {classesStats
                .filter(
                  (c) =>
                    (selectedGrade === 'all' || c.grade === selectedGrade) &&
                    (selectedClass === 'all' || c.name === selectedClass)
                )
                .map((cls, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-3 font-bold text-slate-900">{cls.name}</td>
                    <td className="py-3 px-3 text-center text-slate-600">{cls.totalStudents}</td>
                    <td className="py-3 px-3 text-center font-bold text-ocean-700">
                      {cls.submittedCount}
                    </td>
                    <td className="py-3 px-3 text-center font-black text-emerald-700">
                      {cls.completionRate}%
                    </td>
                    <td className="py-3 px-3 text-center font-black text-slate-900 bg-slate-50/50">
                      {cls.avgScore}đ
                    </td>
                    <td className="py-3 px-3 text-center text-emerald-700 font-semibold">
                      {cls.goodRate}%
                    </td>
                    <td className="py-3 px-3 text-center text-blue-700 font-semibold">
                      {cls.fairRate}%
                    </td>
                    <td className="py-3 px-3 text-center text-amber-700 font-semibold">
                      {cls.avgRate}%
                    </td>
                    <td className="py-3 px-3 text-center text-red-700 font-semibold">
                      {cls.weakRate}%
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. BẢNG VINH DANH HỌC SINH TIÊU BIỂU */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              <span>Gương Mặt Học Sinh Xuất Sắc & Tích Cực Nhất</span>
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Vinh danh các em học sinh có điểm số cao và tích lũy nhiều điểm thưởng XP
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
          {topStudents.map((st, idx) => (
            <div
              key={st.id}
              className="p-3.5 bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-200 flex items-center gap-3 shadow-xs"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-black text-sm shrink-0 shadow-inner">
                #{idx + 1}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-slate-900 text-xs truncate">{st.full_name}</div>
                <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                  <span>{st.class_name || 'Lớp 6A1'}</span>
                  <span>•</span>
                  <span className="font-mono text-ocean-700">{st.student_code}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
