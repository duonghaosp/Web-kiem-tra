import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Globe, Lock, User, Sparkles, Shield, ArrowRight, CheckCircle2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { user, profile, role, loading: authLoading, signInAsTeacher, signInAsStudent, quickLogin } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'student' | 'teacher'>('student');
  const [studentCode, setStudentCode] = useState<string>('');
  const [studentGrade, setStudentGrade] = useState<number>(7);
  const [teacherEmail, setTeacherEmail] = useState<string>('cohao@diali.edu.vn');
  const [teacherPassword, setTeacherPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Nếu người dùng đã đăng nhập từ trước, tự động chuyển vào trang điều khiển
  useEffect(() => {
    if (!authLoading && (user || profile)) {
      if (role === 'teacher' || role === 'admin') {
        navigate('/teacher-dashboard', { replace: true });
      } else {
        navigate('/student-dashboard', { replace: true });
      }
    }
  }, [user, profile, role, authLoading, navigate]);

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentCode.trim()) {
      setErrorMsg('Em vui lòng nhập mã số học sinh của mình!');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    const { error } = await signInAsStudent(studentCode, studentGrade);
    setLoading(false);

    if (error) {
      setErrorMsg(error.message || 'Không tìm thấy mã học sinh!');
    } else {
      navigate('/student-dashboard');
    }
  };

  const handleTeacherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherEmail.trim()) {
      setErrorMsg('Cô vui lòng nhập email đăng nhập giáo viên!');
      return;
    }
    if (!teacherPassword.trim()) {
      setErrorMsg('Cô vui lòng nhập mật khẩu giáo viên!');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    const { error } = await signInAsTeacher(teacherEmail, teacherPassword);
    setLoading(false);

    if (error) {
      setErrorMsg(error.message || 'Sai thông tin đăng nhập Giáo viên!');
    } else {
      navigate('/teacher-dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-[#DFE7E5] flex items-center justify-center p-3 sm:p-6 transition-colors">
      <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200/80 space-y-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-ocean-600 to-teal-500 text-white flex items-center justify-center mx-auto shadow-md">
            <Globe className="w-8 h-8" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Đăng Nhập Môn Địa Lí THCS
          </h2>
          <p className="text-xs text-slate-500">
            Hệ thống kiểm tra, đánh giá & rèn luyện kiến thức trực tuyến
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => {
              setActiveTab('student');
              setErrorMsg('');
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'student'
                ? 'bg-white text-ocean-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-4 h-4" />
            Học Sinh Đăng Nhập
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('teacher');
              setErrorMsg('');
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'teacher'
                ? 'bg-white text-ocean-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Shield className="w-4 h-4" />
            Giáo Viên Đăng Nhập
          </button>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-red-50 text-red-700 text-xs border border-red-200 font-bold leading-relaxed">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* FORM HỌC SINH TỐI GIẢN */}
        {activeTab === 'student' ? (
          <form onSubmit={handleStudentSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mã số học sinh của em:
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={studentCode}
                  onChange={(e) => setStudentCode(e.target.value)}
                  placeholder="VD: HS071 (Khối 7) hoặc HS091 (Khối 9)"
                  autoComplete="off"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-ocean-500 uppercase tracking-wider"
                  required
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                (Học sinh nhập đúng mã số của mình và chọn đúng Khối lớp để vào làm bài)
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Khối lớp của em:
              </label>
              <select
                value={studentGrade}
                onChange={(e) => setStudentGrade(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-ocean-500 bg-white cursor-pointer"
              >
                <option value={6}>Khối 6 (Lớp 6A1, 6A2, 6A3, 6A4)</option>
                <option value={7}>Khối 7 (Lớp 7A1, 7A2, 7A3, 7A4)</option>
                <option value={8}>Khối 8 (Lớp 8A1, 8A2, 8A3, 8A4)</option>
                <option value={9}>Khối 9 (Lớp 9A1, 9A2, 9A3, 9A4)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-xl transition shadow-md disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Đang xác thực...' : 'Vào Học & Làm Bài Ngay'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        ) : (
          /* FORM GIÁO VIÊN */
          <form onSubmit={handleTeacherSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tài khoản hoặc Email Giáo Viên:
              </label>
              <input
                type="text"
                name="username"
                id="username"
                value={teacherEmail}
                onChange={(e) => setTeacherEmail(e.target.value)}
                placeholder="cohao@diali.edu.vn"
                autoComplete="username"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-ocean-500 bg-slate-50/50"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mật khẩu:
              </label>
              <div className="relative">
                <input
                  type="password"
                  name="password"
                  id="password"
                  value={teacherPassword}
                  onChange={(e) => setTeacherPassword(e.target.value)}
                  placeholder="Nhập mật khẩu bảo mật..."
                  autoComplete="current-password"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-ocean-500"
                  required
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#2D4441] hover:bg-[#233835] active:scale-95 text-white font-bold text-xs sm:text-sm rounded-xl transition shadow-md disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Đang xác thực...' : 'Đăng Nhập Bàn Làm Việc'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
