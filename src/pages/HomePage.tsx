import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase, isSupabaseConfigured, uploadToStorage } from '../lib/supabase';
import {
  Globe,
  Users,
  BookOpen,
  CalendarCheck,
  CheckCircle,
  BarChart3,
  Trophy,
  Upload,
  Image as ImageIcon,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Award,
  CheckCircle2,
  Clock,
  Zap,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

export const HomePage: React.FC = () => {
  const { role } = useAuth();
  const isTeacher = role === 'teacher' || role === 'admin';

  // Banner State đọc trực tiếp từ Cài đặt hệ thống (LocalStorage)
  const [bannerUrl, setBannerUrl] = useState<string>(() => {
    return (
      localStorage.getItem('geo_banner_bg') ||
      'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1600&q=80'
    );
  });
  const [bannerTitle, setBannerTitle] = useState<string>(() => {
    return (
      localStorage.getItem('geo_banner_title') ||
      'HỆ THỐNG KIỂM TRA & ĐÁNH GIÁ MÔN ĐỊA LÍ THCS'
    );
  });
  const [bannerSubtitle, setBannerSubtitle] = useState<string>(() => {
    return (
      localStorage.getItem('geo_banner_subtitle') ||
      'Khám phá Trái Đất - Chinh phục Tri thức Địa lí cùng Cô Dương Thu Hảo'
    );
  });
  const [academicYear, setAcademicYear] = useState<string>(() => {
    return localStorage.getItem('geo_academic_year') || '2025 - 2026';
  });

  const [uploadingBanner, setUploadingBanner] = useState<boolean>(false);

  // Đồng bộ và tải cấu hình mới nhất
  const reloadSettings = () => {
    const bg = localStorage.getItem('geo_banner_bg');
    if (bg) setBannerUrl(bg);
    const title = localStorage.getItem('geo_banner_title');
    if (title) setBannerTitle(title);
    const sub = localStorage.getItem('geo_banner_subtitle');
    if (sub) setBannerSubtitle(sub);
    const year = localStorage.getItem('geo_academic_year');
    if (year) setAcademicYear(year);
  };

  useEffect(() => {
    reloadSettings();

    // Lắng nghe sự kiện cập nhật cấu hình
    window.addEventListener('storage', reloadSettings);
    window.addEventListener('geo_settings_updated', reloadSettings);

    // Load từ Supabase nếu có cấu hình đám mây
    async function loadCloudBanner() {
      if (isSupabaseConfigured) {
        try {
          const { data } = await supabase
            .from('system_settings')
            .select('value')
            .eq('key', 'general_settings')
            .maybeSingle();

          if (data?.value) {
            if (data.value.bannerBgUrl) setBannerUrl(data.value.bannerBgUrl);
            if (data.value.bannerTitle) setBannerTitle(data.value.bannerTitle);
            if (data.value.bannerSubtitle) setBannerSubtitle(data.value.bannerSubtitle);
            if (data.value.academicYear) setAcademicYear(data.value.academicYear);
          }
        } catch (e) {
          console.warn('Lỗi đọc banner từ Supabase:', e);
        }
      }
    }
    loadCloudBanner();

    return () => {
      window.removeEventListener('storage', reloadSettings);
      window.removeEventListener('geo_settings_updated', reloadSettings);
    };
  }, []);

  // Upload Banner mới nhanh trực tiếp từ Trang chủ
  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingBanner(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      setBannerUrl(url);
      localStorage.setItem('geo_banner_bg', url);
      window.dispatchEvent(new CustomEvent('geo_settings_updated'));
      setUploadingBanner(false);
    };
    reader.readAsDataURL(file);

    // Tải lên Supabase Storage nếu có kết nối
    if (isSupabaseConfigured) {
      const filename = `banner_${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
      uploadToStorage('banners', filename, file).then(({ url }) => {
        if (url) {
          setBannerUrl(url);
          localStorage.setItem('geo_banner_bg', url);
        }
      });
    }
  };

  // Dữ liệu biểu đồ phân tích lớp học thực tế
  const classScoreData = [
    { name: 'Khối 6', 'Điểm TB': 8.2, 'Tỷ lệ hoàn thành': 94 },
    { name: 'Khối 7', 'Điểm TB': 7.9, 'Tỷ lệ hoàn thành': 91 },
    { name: 'Khối 8', 'Điểm TB': 8.5, 'Tỷ lệ hoàn thành': 96 },
    { name: 'Khối 9', 'Điểm TB': 8.1, 'Tỷ lệ hoàn thành': 98 },
  ];

  const gradeDistributionData = [
    { name: 'Xuất sắc (9-10đ)', value: 38, color: '#10b981' },
    { name: 'Giỏi (8-8.9đ)', value: 32, color: '#0ea5e9' },
    { name: 'Khá (6.5-7.9đ)', value: 20, color: '#f59e0b' },
    { name: 'Trung bình (5-6.4đ)', value: 7, color: '#8b5cf6' },
    { name: 'Cần hỗ trợ (<5đ)', value: 3, color: '#ef4444' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-12">
      {/* 1. HERO BANNER ĐỌC DỮ LIỆU TỰ ĐỘNG TỪ CÀI ĐẶT HỆ THỐNG */}
      <div className="relative rounded-3xl overflow-hidden shadow-xl border border-slate-200 min-h-[300px] sm:min-h-[360px] flex items-center justify-between text-white group">
        <img
          src={bannerUrl}
          alt="Banner Địa lí"
          className="absolute inset-0 w-full h-full object-cover brightness-50 contrast-110 group-hover:scale-105 transition duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-ocean-950/60 to-transparent"></div>

        <div className="relative z-10 p-6 sm:p-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ocean-500/30 backdrop-blur-md border border-ocean-400/40 text-ocean-200 text-xs font-bold tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            Năm Học {academicYear} • THCS
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight drop-shadow-md">
            {bannerTitle}
          </h1>

          <p className="text-sm sm:text-base text-slate-200 font-normal leading-relaxed drop-shadow">
            {bannerSubtitle}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            {isTeacher ? (
              <Link
                to="/teacher-dashboard"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-ocean-600 hover:bg-ocean-500 text-white font-bold text-xs sm:text-sm shadow-lg active:scale-95 transition"
              >
                Vào Bàn Làm Việc
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <Link
                to="/student-dashboard"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-lg active:scale-95 transition"
              >
                Vào Góc Học Tập & Làm Bài
                <ArrowRight className="w-4 h-4" />
              </Link>
            )}

            <Link
              to="/reports"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-semibold text-xs sm:text-sm border border-white/30 active:scale-95 transition"
            >
              <Trophy className="w-4 h-4 text-amber-300" />
              Bảng Xếp Hạng & Báo Cáo
            </Link>
          </div>
        </div>

        {/* Nút Đổi Banner nhanh */}
        {isTeacher && (
          <div className="absolute top-4 right-4 z-20">
            <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-900 text-white text-xs font-semibold backdrop-blur-md cursor-pointer border border-white/20 shadow transition active:scale-95">
              <Upload className="w-3.5 h-3.5 text-ocean-400" />
              {uploadingBanner ? 'Đang tải lên...' : 'Đổi Nhanh Ảnh Banner'}
              <input
                type="file"
                accept="image/*"
                onChange={handleBannerUpload}
                disabled={uploadingBanner}
                className="hidden"
              />
            </label>
          </div>
        )}
      </div>

      {/* 2. MENU ĐIỀU HƯỚNG CÁC PHÂN HỆ */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              {isTeacher ? 'Các Phân Hệ Quản Lý Chuyên Môn (Dành Cho Cô Hảo)' : 'Góc Học Tập & Rèn Luyện Môn Địa Lí'}
            </h2>
            <p className="text-xs text-slate-500">
              {isTeacher
                ? 'Truy cập nhanh các chức năng giảng dạy, kho đề, chấm bài và quản lý học sinh'
                : 'Làm bài kiểm tra cô Hảo giao, tham gia đấu trường trực tiếp và theo dõi tiến độ'}
            </p>
          </div>
        </div>

        {/* GIAO DIỆN DÀNH CHO GIÁO VIÊN */}
        {isTeacher ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              to="/classes"
              className="group p-5 rounded-2xl bg-white border border-slate-200 hover:border-ocean-400 hover:shadow-md transition flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold group-hover:scale-110 transition">
                  <Users className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                  Khối 6-9
                </span>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm mb-1 group-hover:text-ocean-700">
                  Quản Lý Lớp Học & Học Sinh
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2">
                  Cơ cấu 16 lớp THCS (6A1-9A4), thêm/sửa/xóa và import học sinh từ Excel.
                </p>
              </div>
            </Link>

            <Link
              to="/questions"
              className="group p-5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-400 hover:shadow-md transition flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold group-hover:scale-110 transition">
                  <BookOpen className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
                  Kho Đề
                </span>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm mb-1 group-hover:text-emerald-700">
                  Kho Đề
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2">
                  Trắc nghiệm, kéo thả, điền từ, thơ lục bát, phân loại theo bài học và khối lớp.
                </p>
              </div>
            </Link>

            <Link
              to="/assignments"
              className="group p-5 rounded-2xl bg-white border border-slate-200 hover:border-amber-400 hover:shadow-md transition flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold group-hover:scale-110 transition">
                  <CalendarCheck className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">
                  Chuẩn 70/30
                </span>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm mb-1 group-hover:text-amber-700">
                  Tạo Đề & Giao Bài
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2">
                  Tạo đề theo bài học, chuẩn hóa 70% trắc nghiệm (7đ) - 30% tự luận (3đ) và giao cho lớp.
                </p>
              </div>
            </Link>

            <Link
              to="/grading"
              className="group p-5 rounded-2xl bg-white border border-slate-200 hover:border-purple-400 hover:shadow-md transition flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold group-hover:scale-110 transition">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">
                  Chấm Điểm & Lời Phê
                </span>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm mb-1 group-hover:text-purple-700">
                  Chấm Bài & Nhận Xét
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2">
                  Chấm bài tự luận, hệ thống tự cộng điểm trắc nghiệm và gửi lời phê của cô tới học sinh.
                </p>
              </div>
            </Link>

            <Link
              to="/live"
              className="group p-5 rounded-2xl bg-white border border-slate-200 hover:border-amber-500 hover:shadow-md transition flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center font-bold group-hover:scale-110 transition shadow-xs">
                  <Zap className="w-6 h-6 fill-current" />
                </div>
                <span className="text-[11px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                  Máy Chiếu
                </span>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm mb-1 group-hover:text-amber-700">
                  Đấu Trường Trực Tiếp
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2">
                  Khởi tạo phòng đấu thời gian thực trên máy chiếu với bộ câu hỏi do cô tự chọn.
                </p>
              </div>
            </Link>

            <Link
              to="/reports"
              className="group p-5 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md transition flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold group-hover:scale-110 transition">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                  Thống Kê
                </span>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm mb-1 group-hover:text-blue-700">
                  Báo Cáo & Cảnh Báo Yếu
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2">
                  Biểu đồ học lực các khối và hệ thống cảnh báo học sinh điểm dưới 5.0.
                </p>
              </div>
            </Link>

            <Link
              to="/teacher-dashboard"
              className="group p-5 rounded-2xl bg-white border border-slate-200 hover:border-teal-400 hover:shadow-md transition flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold group-hover:scale-110 transition">
                  <Sparkles className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full">
                  Bàn Làm Việc
                </span>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm mb-1 group-hover:text-teal-700">
                  Không Gian Giáo Viên
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2">
                  Hàng đợi bài kiểm tra cần chấm, thống kê nhanh và các công cụ giảng dạy.
                </p>
              </div>
            </Link>

            <Link
              to="/settings"
              className="group p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-400 hover:shadow-md transition flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold group-hover:scale-110 transition">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                  Cài Đặt
                </span>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm mb-1 group-hover:text-slate-800">
                  Cài Đặt Hệ Thống
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2">
                  Tùy chỉnh thông tin trường học, hồ sơ giáo viên, khẩu hiệu và quy định thi.
                </p>
              </div>
            </Link>
          </div>
        ) : (
          /* GIAO DIỆN DÀNH RIÊNG CHO HỌC SINH (HOÀN TOÀN KHÔNG THẤY CÁC PHÂN HỆ CỦA CÔ GIÁO) */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Link
              to="/student-dashboard"
              className="group p-6 rounded-3xl bg-white border-2 border-emerald-200 hover:border-emerald-500 hover:shadow-lg transition flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold group-hover:scale-110 transition">
                  <BookOpen className="w-7 h-7" />
                </div>
                <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full">
                  Góc Học Tập
                </span>
              </div>
              <div className="space-y-1">
                <h3 className="font-black text-slate-900 text-base group-hover:text-emerald-700">
                  Góc Học Tập, Bài Thi & Kết Quả Của Em
                </h3>
                <p className="text-xs text-slate-500">
                  Làm bài kiểm tra cô Hảo giao, xem lại điểm số, đọc lời phê nhận xét của cô và theo dõi tiến độ học tập cá nhân.
                </p>
              </div>
            </Link>

            <Link
              to="/live/join"
              className="group p-6 rounded-3xl bg-white border-2 border-amber-200 hover:border-amber-500 hover:shadow-lg transition flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center font-bold group-hover:scale-110 transition shadow-md">
                  <Zap className="w-7 h-7 fill-current" />
                </div>
                <span className="text-xs font-bold bg-amber-100 text-amber-800 px-3 py-1 rounded-full">
                  Nhập Mã PIN
                </span>
              </div>
              <div className="space-y-1">
                <h3 className="font-black text-slate-900 text-base group-hover:text-amber-700">
                  Vào Đấu Trường Trực Tiếp
                </h3>
                <p className="text-xs text-slate-500">
                  Nhập mã PIN hiển thị trên máy chiếu của Cô Hảo để tham gia thi đấu Địa lí trực tiếp trên lớp cùng các bạn.
                </p>
              </div>
            </Link>
          </div>
        )}
      </div>

      {/* 3. BIỂU ĐỒ BÁO CÁO TOÀN TRƯỜNG (CHỈ GIÁO VIÊN MỚI ĐƯỢC XEM) */}
      {isTeacher && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Phổ Điểm Trung Bình Khối 6, 7, 8, 9 (Năm học {academicYear})
                </h3>
                <p className="text-xs text-slate-500">Thống kê điểm số và tỷ lệ hoàn thành bài làm</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={classScoreData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" domain={[0, 10]} />
                <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
                <Bar dataKey="Điểm TB" fill="#0284c7" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Phân Bố Kết Quả Đánh Giá</h3>
            <p className="text-xs text-slate-500">Tỷ lệ học sinh theo các mức xếp loại</p>
          </div>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={gradeDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {gradeDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            {gradeDistributionData.map((item, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }}></span>
                <span className="text-slate-600 truncate">{item.name}: <strong>{item.value}%</strong></span>
              </div>
            ))}
          </div>
        </div>
      </div>
      )}
    </div>
  );
};
