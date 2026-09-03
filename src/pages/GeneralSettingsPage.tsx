import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  Settings,
  School,
  User,
  Sliders,
  Image as ImageIcon,
  CheckCircle2,
  Camera,
  Save,
  Loader2,
  Sparkles,
  Award,
  HardDriveDownload,
  HardDriveUpload,
  Database,
  ShieldCheck,
  FileJson,
  RotateCcw,
  Lock,
} from 'lucide-react';
import { triggerCelebration } from '../lib/gamification';

export const GeneralSettingsPage: React.FC = () => {
  const { profile, updateProfile } = useAuth();

  // Tab State
  const [activeTab, setActiveTab] = useState<'school' | 'teacher' | 'exam' | 'banner' | 'backup'>('school');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [backupMessage, setBackupMessage] = useState<string | null>(null);

  // 1. Thông tin trường học & đơn vị
  const [schoolName, setSchoolName] = useState(
    () => localStorage.getItem('geo_school_name') || 'Trường PTDTBT TH&THCS Sì Lờ Lầu'
  );
  const [departmentName, setDepartmentName] = useState(
    () => localStorage.getItem('geo_dept_name') || 'Tổ Khoa học Xã hội'
  );
  const [academicYear, setAcademicYear] = useState(
    () => localStorage.getItem('geo_academic_year') || '2025 - 2026'
  );
  const [schoolLogoUrl, setSchoolLogoUrl] = useState(
    () => localStorage.getItem('geo_school_logo') || ''
  );

  // 2. Thông tin giáo viên
  const [teacherName, setTeacherName] = useState(profile?.full_name || 'Dương Thu Hảo');
  const [teacherTitle, setTeacherTitle] = useState(
    () => localStorage.getItem('geo_teacher_title') || 'Giáo viên bộ môn Địa lí THCS'
  );
  const [teacherEmail, setTeacherEmail] = useState(
    () => localStorage.getItem('geo_teacher_email') || 'duongthuhao@diali.edu.vn'
  );
  const [teacherPhone, setTeacherPhone] = useState(
    () => localStorage.getItem('geo_teacher_phone') || ''
  );
  const [teacherPassword, setTeacherPassword] = useState(
    () => localStorage.getItem('geo_teacher_secret_password') || '123456'
  );
  const [defaultFeedback, setDefaultFeedback] = useState(
    () => localStorage.getItem('geo_default_feedback') || 'Cô khen ngợi tinh thần làm bài chăm chỉ của em!'
  );

  // 3. Cấu hình kiểm tra & đánh giá
  const [weakThreshold, setWeakThreshold] = useState<number>(
    () => Number(localStorage.getItem('geo_weak_threshold')) || 5.0
  );
  const [allowLateSubmission, setAllowLateSubmission] = useState<boolean>(
    () => localStorage.getItem('geo_allow_late') !== 'false'
  );
  const [showAnswerKey, setShowAnswerKey] = useState<boolean>(
    () => localStorage.getItem('geo_show_answer_key') !== 'false'
  );
  const [defaultDuration, setDefaultDuration] = useState<number>(
    () => Number(localStorage.getItem('geo_default_duration')) || 45
  );

  // 4. Banner trang chủ
  const [bannerTitle, setBannerTitle] = useState(
    () => localStorage.getItem('geo_banner_title') || 'HỆ THỐNG KIỂM TRA & ĐÁNH GIÁ MÔN ĐỊA LÍ THCS'
  );
  const [bannerSubtitle, setBannerSubtitle] = useState(
    () =>
      localStorage.getItem('geo_banner_subtitle') ||
      'Khám phá Trái Đất - Chinh phục Tri thức Địa lí cùng Cô Dương Thu Hảo'
  );
  const [bannerBgUrl, setBannerBgUrl] = useState(
    () =>
      localStorage.getItem('geo_banner_bg') ||
      'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1600&q=80'
  );

  const fileInputLogoRef = useRef<HTMLInputElement | null>(null);
  const fileInputAvatarRef = useRef<HTMLInputElement | null>(null);
  const fileInputBannerRef = useRef<HTMLInputElement | null>(null);

  // Upload Logo
  const handleUploadLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      setSchoolLogoUrl(url);
      localStorage.setItem('geo_school_logo', url);
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('geo_settings_updated'));
    };
    reader.readAsDataURL(file);
  };

  // Xóa Logo / Đặt lại mặc định
  const handleRemoveLogo = () => {
    setSchoolLogoUrl('');
    localStorage.removeItem('geo_school_logo');
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('geo_settings_updated'));
  };

  // Upload Avatar
  const handleUploadAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const url = event.target?.result as string;
      await updateProfile({ avatar_url: url });
    };
    reader.readAsDataURL(file);
  };

  // Upload Banner
  const handleUploadBanner = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      setBannerBgUrl(url);
      localStorage.setItem('geo_banner_bg', url);
    };
    reader.readAsDataURL(file);
  };

  // Lưu toàn bộ cấu hình hệ thống
  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      // 1. Lưu tất cả vào LocalStorage
      localStorage.setItem('geo_school_name', schoolName.trim());
      localStorage.setItem('geo_dept_name', departmentName.trim());
      localStorage.setItem('geo_academic_year', academicYear.trim());
      localStorage.setItem('geo_teacher_title', teacherTitle.trim());
      localStorage.setItem('geo_teacher_email', teacherEmail.trim());
      localStorage.setItem('geo_teacher_phone', teacherPhone.trim());
      localStorage.setItem('geo_teacher_secret_password', teacherPassword.trim());
      localStorage.setItem('geo_default_feedback', defaultFeedback.trim());
      localStorage.setItem('geo_weak_threshold', String(weakThreshold));
      localStorage.setItem('geo_allow_late', String(allowLateSubmission));
      localStorage.setItem('geo_show_answer_key', String(showAnswerKey));
      localStorage.setItem('geo_default_duration', String(defaultDuration));
      localStorage.setItem('geo_banner_title', bannerTitle.trim());
      localStorage.setItem('geo_banner_subtitle', bannerSubtitle.trim());
      localStorage.setItem('geo_banner_bg', bannerBgUrl);

      // 2. Cập nhật Profile Auth
      await updateProfile({ full_name: teacherName.trim() });

      // 3. Đồng bộ lên Supabase (nếu có kết nối)
      if (isSupabaseConfigured) {
        try {
          await supabase.from('system_settings').upsert({
            key: 'general_settings',
            value: {
              schoolName: schoolName.trim(),
              departmentName: departmentName.trim(),
              academicYear: academicYear.trim(),
              teacherName: teacherName.trim(),
              weakThreshold,
              bannerTitle: bannerTitle.trim(),
              bannerSubtitle: bannerSubtitle.trim(),
              bannerBgUrl,
            },
          });
        } catch (err) {
          console.warn('Lỗi lưu cấu hình lên Supabase:', err);
        }
      }

      // Phát sự kiện để Navbar, Footer và Trang chủ cập nhật tức thì
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('geo_settings_updated'));

      setIsSaving(false);
      setSaveSuccess(true);
      triggerCelebration();

      setTimeout(() => {
        setSaveSuccess(false);
      }, 4000);
    } catch (err) {
      console.error('Lỗi khi lưu cấu hình:', err);
      setIsSaving(false);
      alert('Đã xảy ra lỗi khi lưu cấu hình, vui lòng thử lại!');
    }
  };

  // XUẤT TOÀN BỘ DỮ LIỆU RA FILE SAO LƯU JSON (.json)
  const handleExportBackup = () => {
    try {
      const backupData = {
        version: '2026.1',
        exportedAt: new Date().toISOString(),
        teacherName,
        schoolName,
        data: {
          geo_school_name: localStorage.getItem('geo_school_name'),
          geo_dept_name: localStorage.getItem('geo_dept_name'),
          geo_academic_year: localStorage.getItem('geo_academic_year'),
          geo_teacher_title: localStorage.getItem('geo_teacher_title'),
          geo_teacher_email: localStorage.getItem('geo_teacher_email'),
          geo_teacher_phone: localStorage.getItem('geo_teacher_phone'),
          geo_default_feedback: localStorage.getItem('geo_default_feedback'),
          geo_weak_threshold: localStorage.getItem('geo_weak_threshold'),
          geo_allow_late: localStorage.getItem('geo_allow_late'),
          geo_show_answer_key: localStorage.getItem('geo_show_answer_key'),
          geo_default_duration: localStorage.getItem('geo_default_duration'),
          geo_banner_title: localStorage.getItem('geo_banner_title'),
          geo_banner_subtitle: localStorage.getItem('geo_banner_subtitle'),
          geo_banner_bg: localStorage.getItem('geo_banner_bg'),
          geo_school_logo: localStorage.getItem('geo_school_logo'),
          geo_classes_list: localStorage.getItem('geo_classes_list'),
          geo_classes_students: localStorage.getItem('geo_classes_students'),
          geo_curriculum_lessons: localStorage.getItem('geo_curriculum_lessons'),
          geo_question_bank: localStorage.getItem('geo_question_bank'),
          geo_assignments: localStorage.getItem('geo_assignments'),
          geo_student_submissions: localStorage.getItem('geo_student_submissions'),
        },
      };

      const jsonStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const dateStr = new Date().toISOString().slice(0, 10);
      link.href = url;
      link.download = `Sao_Luu_Du_Lieu_Web_Dia_Li_${dateStr}.json`;
      link.click();
      URL.revokeObjectURL(url);

      setBackupMessage('✅ Đã tải xuống thành công file sao lưu toàn bộ dữ liệu hệ thống!');
      triggerCelebration();
      setTimeout(() => setBackupMessage(null), 5000);
    } catch (err) {
      console.error('Lỗi khi xuất file sao lưu:', err);
      alert('Không thể xuất file sao lưu, vui lòng thử lại!');
    }
  };

  // NHẬP & PHỤC HỒI DỮ LIỆU TỪ FILE JSON
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        if (!parsed || !parsed.data) {
          alert('File sao lưu không hợp lệ hoặc thiếu dữ liệu!');
          return;
        }

        const confirmRestore = confirm(
          'Cô có chắc chắn muốn khôi phục dữ liệu từ file này không? Dữ liệu hiện tại sẽ được thay thế bằng dữ liệu từ bản sao lưu.'
        );
        if (!confirmRestore) return;

        // Khôi phục từng key vào LocalStorage
        Object.entries(parsed.data).forEach(([key, val]) => {
          if (val !== null && val !== undefined) {
            localStorage.setItem(key, typeof val === 'string' ? val : JSON.stringify(val));
          }
        });

        // Bắn sự kiện cập nhật
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new CustomEvent('geo_settings_updated'));

        setBackupMessage('🎉 Khôi phục dữ liệu thành công 100%! Đang tải lại trang...');
        triggerCelebration();
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } catch (err) {
        console.error('Lỗi khi đọc file sao lưu:', err);
        alert('File sao lưu bị hỏng hoặc định dạng không đúng!');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16 relative">
      {/* Header Phân Hệ Cài Đặt Chung */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-ocean-50 text-ocean-600 border border-ocean-200 flex items-center justify-center font-bold">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-ocean-100 text-ocean-800 font-extrabold text-[11px] uppercase tracking-wider mb-1">
              Phân Hệ Quản Trị
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900">
              Cài Đặt Chung Toàn Hệ Thống
            </h1>
            <p className="text-xs text-slate-500">
              Tùy chỉnh thông tin trường học, hồ sơ giáo viên, tiêu chuẩn chấm điểm và giao diện
            </p>
          </div>
        </div>

        {saveSuccess && (
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold rounded-2xl animate-in zoom-in-95">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Đã Lưu Thành Công Cấu Hình!
          </div>
        )}
      </div>

      {/* Tabs Menu Điều Hướng Cài Đặt */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('school')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition ${
            activeTab === 'school'
              ? 'bg-ocean-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <School className="w-4 h-4" />
          1. Thông Tin Trường & Tổ Bộ Môn
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('teacher')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition ${
            activeTab === 'teacher'
              ? 'bg-ocean-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <User className="w-4 h-4" />
          2. Hồ Sơ Giáo Viên (Dương Thu Hảo)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('exam')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition ${
            activeTab === 'exam'
              ? 'bg-ocean-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Sliders className="w-4 h-4" />
          3. Quy Định Đánh Giá & Cảnh Báo
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('banner')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition ${
            activeTab === 'banner'
              ? 'bg-ocean-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          4. Biểu Ngữ & Giao Diện Trang Chủ
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('backup')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition ${
            activeTab === 'backup'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-300'
          }`}
        >
          <Database className="w-4 h-4 text-emerald-600" />
          5. Sao Lưu & Phục Hồi Dữ Liệu (.json)
        </button>
      </div>

      {/* Nội Dung Các Tab */}
      <div className="space-y-6">
        {/* TAB 1: THÔNG TIN TRƯỜNG HỌC */}
        {activeTab === 'school' && (
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6 animate-in fade-in">
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <School className="w-5 h-5 text-ocean-600" />
              Thông Tin Đơn Vị Giảng Dạy & Trường Học
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tên Trường Học:
                </label>
                <input
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  placeholder="VD: Trường PTDTBT TH&THCS Sì Lờ Lầu"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-bold text-slate-800 focus:ring-2 focus:ring-ocean-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tổ Chuyên Môn / Bộ Môn:
                </label>
                <input
                  type="text"
                  value={departmentName}
                  onChange={(e) => setDepartmentName(e.target.value)}
                  placeholder="VD: Tổ Khoa học Xã hội"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-ocean-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Năm Học:
                </label>
                <input
                  type="text"
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  placeholder="VD: 2025 - 2026"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-ocean-500"
                />
              </div>

              {/* Logo Trường */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Logo / Huy Hiệu Trường Học:
                </label>
                <div className="flex flex-wrap items-center gap-3">
                  {schoolLogoUrl ? (
                    <img
                      src={schoolLogoUrl}
                      alt="Logo Trường"
                      className="w-14 h-14 rounded-2xl object-contain border border-slate-200 bg-slate-50 p-1 shadow-xs"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-ocean-50 text-ocean-600 flex items-center justify-center border border-ocean-200 font-black text-xs shadow-xs">
                      LOGO
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputLogoRef.current?.click()}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition cursor-pointer shadow-2xs active:scale-95"
                    >
                      <Camera className="w-3.5 h-3.5" /> Tải Logo Mới
                    </button>
                    {schoolLogoUrl && (
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-xs font-bold text-red-700 border border-red-200 transition cursor-pointer active:scale-95"
                      >
                        Đặt lại mặc định
                      </button>
                    )}
                  </div>
                  <input
                    ref={fileInputLogoRef}
                    type="file"
                    accept="image/*"
                    onChange={handleUploadLogo}
                    className="hidden"
                  />
                </div>

                {/* 📍 Khối hướng dẫn vị trí hiển thị rõ ràng cho Cô Hảo */}
                <div className="mt-3 p-3 bg-ocean-50/80 rounded-2xl border border-ocean-200 text-xs text-ocean-950 space-y-1.5 max-w-2xl">
                  <div className="font-bold flex items-center gap-1.5 text-ocean-900">
                    <Sparkles className="w-4 h-4 text-ocean-600 shrink-0" />
                    <span>Vị trí hiển thị của Logo / Huy hiệu trường học trên hệ thống:</span>
                  </div>
                  <ul className="list-disc pl-5 text-[11px] text-ocean-800 space-y-1">
                    <li>
                      <strong>Thanh tiêu đề chính (Header/Navbar):</strong> Xuất hiện trang trọng ở góc trái trên cùng của tất cả các trang cạnh chữ "ĐỊA LÍ THCS - Trường PTDTBT TH&THCS Sì Lở Lầu".
                    </li>
                    <li>
                      <strong>Giao diện làm bài thi của học sinh:</strong> Xuất hiện ở đầu bài thi và màn hình xác nhận làm bài để tạo cảm giác chuyên nghiệp như đề thi chính thức.
                    </li>
                    <li>
                      <strong>Chân trang website (Footer):</strong> Xuất hiện cạnh thông tin bản quyền trường học.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: HỒ SƠ GIÁO VIÊN */}
        {activeTab === 'teacher' && (
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6 animate-in fade-in">
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <User className="w-5 h-5 text-ocean-600" />
              Hồ Sơ Giáo Viên Quản Trị Hệ Thống
            </h2>

            <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <img
                src={
                  profile?.avatar_url ||
                  'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=150&q=80'
                }
                alt="Chân dung cô"
                className="w-16 h-16 rounded-2xl object-cover border-2 border-ocean-400 shadow-xs shrink-0"
              />
              <div className="space-y-1">
                <div className="text-xs font-bold text-slate-900">Ảnh Chân Dung Giáo Viên</div>
                <button
                  type="button"
                  onClick={() => fileInputAvatarRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-xs transition"
                >
                  <Camera className="w-3.5 h-3.5 text-ocean-600" /> Tải Ảnh Mới
                </button>
                <input
                  ref={fileInputAvatarRef}
                  type="file"
                  accept="image/*"
                  onChange={handleUploadAvatar}
                  className="hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Họ và Tên Giáo Viên:
                </label>
                <input
                  type="text"
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  placeholder="VD: Dương Thu Hảo"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-bold text-slate-800 focus:ring-2 focus:ring-ocean-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Chức Danh / Bộ Môn Giảng Dạy:
                </label>
                <input
                  type="text"
                  value={teacherTitle}
                  onChange={(e) => setTeacherTitle(e.target.value)}
                  placeholder="VD: Giáo viên bộ môn Địa lí THCS"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-ocean-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email Liên Hệ:
                </label>
                <input
                  type="email"
                  value={teacherEmail}
                  onChange={(e) => setTeacherEmail(e.target.value)}
                  placeholder="VD: duongthuhao@diali.edu.vn"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-ocean-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Số Điện Thoại (Tùy chọn):
                </label>
                <input
                  type="text"
                  value={teacherPhone}
                  onChange={(e) => setTeacherPhone(e.target.value)}
                  placeholder="VD: 0987.xxx.xxx"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-ocean-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Lời Nhận Xét Mẫu Mặc Định Khi Chấm Bài:
                </label>
                <input
                  type="text"
                  value={defaultFeedback}
                  onChange={(e) => setDefaultFeedback(e.target.value)}
                  placeholder="VD: Cô khen ngợi tinh thần làm bài chăm chỉ của em!"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-ocean-500"
                />
              </div>

              <div className="md:col-span-2 p-4 bg-amber-50/80 border border-amber-200 rounded-2xl space-y-2">
                <label className="block text-xs font-bold text-amber-950 flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-amber-700" />
                  Mật Khẩu Đăng Nhập Giáo Viên (Bảo Mật Bàn Làm Việc):
                </label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <input
                    type="password"
                    value={teacherPassword}
                    onChange={(e) => setTeacherPassword(e.target.value)}
                    placeholder="Nhập mật khẩu bí mật của cô..."
                    className="w-full sm:w-64 px-4 py-2.5 rounded-xl border border-amber-300 text-xs sm:text-sm font-bold text-slate-900 bg-white focus:ring-2 focus:ring-amber-500"
                  />
                  <span className="text-[11px] text-amber-800 leading-relaxed">
                    💡 Đây là mật khẩu bí mật của Cô Hảo để truy cập bàn làm việc, quản lý đề thi và chấm điểm. Học sinh không biết mật khẩu này sẽ tuyệt đối không thể đăng nhập vào được.
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: QUY ĐỊNH ĐÁNH GIÁ & CẢNH BÁO */}
        {activeTab === 'exam' && (
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6 animate-in fade-in">
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-ocean-600" />
              Cấu Hình Quy Định Kiểm Tra & Hệ Thống Cảnh Báo
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ngưỡng Điểm Cảnh Báo Học Sinh Yếu (Đánh nhãn đỏ):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={weakThreshold}
                    onChange={(e) => setWeakThreshold(Number(e.target.value))}
                    className="w-32 px-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-bold text-red-600 focus:ring-2 focus:ring-ocean-500"
                  />
                  <span className="text-xs text-slate-500">
                    (Điểm số dưới mức này sẽ tự động đưa vào danh sách cảnh báo cần cô chú ý)
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Thời Gian Làm Bài Mặc Định Cho Đề Mới (Phút):
                </label>
                <input
                  type="number"
                  value={defaultDuration}
                  onChange={(e) => setDefaultDuration(Number(e.target.value))}
                  className="w-32 px-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-bold text-slate-800 focus:ring-2 focus:ring-ocean-500"
                />
              </div>

              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <input
                  type="checkbox"
                  id="allowLate"
                  checked={allowLateSubmission}
                  onChange={(e) => setAllowLateSubmission(e.target.checked)}
                  className="w-5 h-5 rounded text-ocean-600 focus:ring-ocean-500"
                />
                <label htmlFor="allowLate" className="text-xs font-bold text-slate-800 cursor-pointer">
                  Cho Phép Nộp Bài Muộn Sau Hạn Chót (Có gắn nhãn "Nộp muộn")
                </label>
              </div>

              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <input
                  type="checkbox"
                  id="showAnswer"
                  checked={showAnswerKey}
                  onChange={(e) => setShowAnswerKey(e.target.checked)}
                  className="w-5 h-5 rounded text-ocean-600 focus:ring-ocean-500"
                />
                <label htmlFor="showAnswer" className="text-xs font-bold text-slate-800 cursor-pointer">
                  Hiển Thị Lời Giải & Đáp Án Chi Tiết Ngay Sau Khi Nộp Bài
                </label>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: BANNER & GIAO DIỆN */}
        {activeTab === 'banner' && (
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6 animate-in fade-in">
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-ocean-600" />
              Tùy Chỉnh Biểu Ngữ (Banner) Trang Chủ
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tiêu Đề Banner Chính:
                </label>
                <input
                  type="text"
                  value={bannerTitle}
                  onChange={(e) => setBannerTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-bold text-slate-800 focus:ring-2 focus:ring-ocean-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Khẩu Hiệu / Lời Chào Mừng:
                </label>
                <input
                  type="text"
                  value={bannerSubtitle}
                  onChange={(e) => setBannerSubtitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-ocean-500"
                />
              </div>

              {/* Ảnh nền Banner */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ảnh Nền Banner (Xem trước):
                </label>
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 h-40 group">
                  <img src={bannerBgUrl} alt="Banner" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => fileInputBannerRef.current?.click()}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-slate-900 font-bold text-xs shadow-lg hover:bg-slate-100 transition"
                    >
                      <Camera className="w-4 h-4 text-ocean-600" /> Thay Ảnh Nền Banner
                    </button>
                    <input
                      ref={fileInputBannerRef}
                      type="file"
                      accept="image/*"
                      onChange={handleUploadBanner}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: SAO LƯU & PHỤC HỒI DỮ LIỆU JSON (AN TOÀN TUYỆT ĐỐI) */}
        {activeTab === 'backup' && (
          <div className="space-y-6 animate-in fade-in">
            {backupMessage && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs sm:text-sm font-bold flex items-center gap-2 animate-in zoom-in-95">
                <Sparkles className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{backupMessage}</span>
              </div>
            )}

            {/* Khối Cam Kết Bảo Toàn Dữ Liệu */}
            <div className="bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-200 rounded-3xl p-6 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-bold shadow-sm">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-teal-950 text-base">
                    Cơ Chế Bảo Vệ & Lưu Trữ Dữ Liệu An Toàn 100%
                  </h3>
                  <p className="text-xs text-teal-800 font-medium">
                    Mọi thay đổi của Cô Hảo trên Localhost (câu hỏi, đề thi, học sinh, điểm số) đều được lưu trữ vĩnh viễn và tự động bảo vệ khi chỉnh sửa code.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card 1: Xuất Bản Sao Lưu Ra Máy Tính */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-bold">
                    <HardDriveDownload className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 text-base">
                      1. Xuất Bản Sao Lưu Hệ Thống (.json)
                    </h4>
                    <p className="text-xs text-slate-500 font-medium mt-1">
                      Tải về một file <strong>.json</strong> chứa toàn bộ câu hỏi, 16 lớp THCS, danh sách học sinh, bài làm và cài đặt của cô.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5 text-xs text-slate-600">
                    <div className="font-bold text-slate-700">Dữ liệu được sao lưu gồm:</div>
                    <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-500">
                      <li>Toàn bộ Kho đề thi & câu hỏi của cả 4 khối</li>
                      <li>Danh mục 31 bài học Địa lí Khối 6 và các khối khác</li>
                      <li>Danh sách 16 lớp & hồ sơ học sinh THCS</li>
                      <li>Các đề kiểm tra 70/30 đã giao và bài chấm điểm</li>
                      <li>Cấu hình trường, tên giáo viên và lời phê</li>
                    </ul>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleExportBackup}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-black text-xs shadow-md transition"
                >
                  <FileJson className="w-4 h-4" />
                  <span>📥 Tải Xuống File Sao Lưu (.json)</span>
                </button>
              </div>

              {/* Card 2: Nạp & Khôi Phục Dữ Liệu Từ File */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center font-bold">
                    <HardDriveUpload className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 text-base">
                      2. Khôi Phục Dữ Liệu Từ File Đã Lưu
                    </h4>
                    <p className="text-xs text-slate-500 font-medium mt-1">
                      Khi cô chuyển sang máy tính khác hoặc cài lại trình duyệt, chỉ cần chọn file <strong>.json</strong> để khôi phục lại 100% dữ liệu nguyên vẹn.
                    </p>
                  </div>

                  <div className="p-3 bg-emerald-50/60 rounded-2xl border border-emerald-100 space-y-1 text-xs text-emerald-900">
                    <div className="font-bold flex items-center gap-1.5 text-emerald-800">
                      <Sparkles className="w-3.5 h-3.5" /> Khôi phục nhanh chóng:
                    </div>
                    <p className="text-[11px] text-emerald-700 leading-snug">
                      Hệ thống tự động nạp lại toàn bộ đề thi, câu hỏi và học sinh ngay lập tức mà không làm gián đoạn việc giảng dạy.
                    </p>
                  </div>
                </div>

                <label className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs shadow-md cursor-pointer transition">
                  <HardDriveUpload className="w-4 h-4" />
                  <span>📤 Chọn File .json Để Khôi Phục Dữ Liệu</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportBackup}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Nút Lưu Cấu Hình Toàn Hệ Thống Nổi Bật Kèm Thông Báo Ngay Cạnh Nút */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-4 pt-4 border-t border-slate-200">
          {saveSuccess && (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 text-white text-xs font-bold rounded-2xl shadow-md animate-in slide-in-from-right-4">
              <CheckCircle2 className="w-4 h-4" />
              <span>Đã Lưu Cấu Hình Thành Công Vào Hệ Thống!</span>
            </div>
          )}

          <button
            type="button"
            disabled={isSaving}
            onClick={handleSaveAll}
            className={`flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl font-black text-sm shadow-lg transition active:scale-95 ${
              isSaving
                ? 'bg-slate-400 text-white cursor-not-allowed'
                : saveSuccess
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'bg-ocean-600 hover:bg-ocean-700 text-white'
            }`}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Đang Lưu Cấu Hình...</span>
              </>
            ) : saveSuccess ? (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>✓ Đã Lưu Thành Công!</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>Lưu Cấu Hình Toàn Hệ Thống Ngay</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Thông Báo Nổi (Floating Toast) Luôn Hiển Thị Giữa Màn Hình Khi Bấm Lưu */}
      {saveSuccess && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-3.5 bg-slate-900/95 text-white rounded-3xl shadow-2xl border border-emerald-500/50 backdrop-blur-md animate-in slide-in-from-bottom-5">
          <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold">
            ✓
          </div>
          <div>
            <div className="text-xs font-bold text-emerald-400">THÔNG BÁO TỪ HỆ THỐNG</div>
            <div className="text-sm font-bold text-white">Toàn bộ cài đặt đã được lưu thành công!</div>
          </div>
        </div>
      )}
    </div>
  );
};
