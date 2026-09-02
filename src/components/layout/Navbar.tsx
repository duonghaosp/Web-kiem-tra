import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Globe,
  LogOut,
  User,
  Zap,
  Shield,
  Sparkles,
  Gamepad2,
  Settings,
  Camera,
  ChevronDown,
  School,
  CheckCircle2,
  CheckCheck,
  Trash2,
  X,
  ArrowRight,
  Bell,
  MessageSquareQuote,
  Search,
} from 'lucide-react';
import { uploadToStorage } from '../../lib/supabase';
import { GeoGlobeSticker } from '../common/GeoStickers';
import { playSoftClick } from '../../utils/soundEffects';

export const Navbar: React.FC = () => {
  const { profile, role, signOut, quickLogin, updateProfile } = useAuth();
  const navigate = useNavigate();

  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Danh sách thông báo lời phê mới từ Cô Hảo (Gợi ý 2)
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

  // Lắng nghe cập nhật thông báo
  useEffect(() => {
    const handleNotifs = () => {
      try {
        const saved = localStorage.getItem('geo_student_notifications');
        if (saved) setNotifications(JSON.parse(saved));
      } catch (e) {
        console.warn(e);
      }
    };
    window.addEventListener('storage', handleNotifs);
    window.addEventListener('geo_notifications_updated', handleNotifs);
    return () => {
      window.removeEventListener('storage', handleNotifs);
      window.removeEventListener('geo_notifications_updated', handleNotifs);
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const [notificationFilter, setNotificationFilter] = useState<'all' | 'unread'>('all');

  const handleMarkAllRead = () => {
    playSoftClick();
    const updated = notifications.map((n) => ({ ...n, is_read: true }));
    setNotifications(updated);
    localStorage.setItem('geo_student_notifications', JSON.stringify(updated));
    window.dispatchEvent(new Event('geo_notifications_updated'));
  };

  const handleClearRead = () => {
    playSoftClick();
    const updated = notifications.filter((n) => !n.is_read);
    setNotifications(updated);
    localStorage.setItem('geo_student_notifications', JSON.stringify(updated));
    window.dispatchEvent(new Event('geo_notifications_updated'));
  };

  const displayedNotifications = notificationFilter === 'unread'
    ? notifications.filter((n) => !n.is_read)
    : notifications;

  // Form cài đặt
  const [teacherNameInput, setTeacherNameInput] = useState(profile?.full_name || 'Dương Thu Hảo');
  const [schoolNameInput, setSchoolNameInput] = useState(
    localStorage.getItem('geo_school_name') || 'Trường THCS Môn Địa Lí'
  );
  const [schoolLogo, setSchoolLogo] = useState(
    () => localStorage.getItem('geo_school_logo') || ''
  );
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const roleMenuRef = useRef<HTMLDivElement | null>(null);
  const notificationsRef = useRef<HTMLDivElement | null>(null);
  const userDropdownRef = useRef<HTMLDivElement | null>(null);

  // Tự động đóng phần thông báo hoặc menu avatar/logo khi bấm ra ngoài màn hình (Click Outside) hoặc bấm phím Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (showNotifications && notificationsRef.current && !notificationsRef.current.contains(target)) {
        setShowNotifications(false);
      }
      if (showUserDropdown && userDropdownRef.current && !userDropdownRef.current.contains(target)) {
        setShowUserDropdown(false);
      }
      if (showRoleMenu && roleMenuRef.current && !roleMenuRef.current.contains(target)) {
        setShowRoleMenu(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowNotifications(false);
        setShowUserDropdown(false);
        setShowRoleMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showNotifications, showUserDropdown, showRoleMenu]);

  // Lắng nghe sự kiện cập nhật cấu hình từ phân hệ Cài đặt
  useEffect(() => {
    const handleUpdate = () => {
      const storedSchool = localStorage.getItem('geo_school_name');
      if (storedSchool) setSchoolNameInput(storedSchool);
      const storedLogo = localStorage.getItem('geo_school_logo');
      setSchoolLogo(storedLogo || '');
    };
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('geo_settings_updated', handleUpdate);
    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('geo_settings_updated', handleUpdate);
    };
  }, []);

  // Xử lý đổi ảnh đại diện / Logo
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Url = event.target?.result as string;
        await updateProfile({ avatar_url: base64Url });
        setIsUploadingAvatar(false);
      };
      reader.readAsDataURL(file);

      // Upload lên Supabase Storage nếu có kết nối
      const filename = `avatar_${profile?.id || 'teacher'}_${Date.now()}.png`;
      uploadToStorage('avatars', filename, file).then(({ url }) => {
        if (url) {
          updateProfile({ avatar_url: url });
        }
      });
    } catch (err) {
      console.error('Lỗi đổi ảnh:', err);
      setIsUploadingAvatar(false);
    }
  };

  // Lưu cài đặt thông tin
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherNameInput.trim()) return;

    await updateProfile({ full_name: teacherNameInput.trim() });
    localStorage.setItem('geo_school_name', schoolNameInput.trim());

    setShowSettingsModal(false);
    setShowUserDropdown(false);
  };

  // Xử lý Đăng Xuất và chuyển về trang Login
  const handleLogout = async () => {
    setShowUserDropdown(false);
    await signOut();
    navigate('/login');
  };

  const isTeacher = role === 'teacher' || role === 'admin';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      {/* Cảnh báo nổi bật CHỈ KHI cô Hảo đang xem thử giao diện Học sinh */}
      {!isTeacher && sessionStorage.getItem('is_teacher_previewing') === 'true' && (
        <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-orange-500 text-white px-4 py-2 text-xs font-bold flex flex-wrap items-center justify-between gap-2 shadow-inner">
          <div className="flex items-center gap-2">
            <span className="bg-white text-amber-900 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-black">
              Chế Độ Xem Thử
            </span>
            <span>
              Cô Hảo đang xem thử giao diện của học sinh. Các phân hệ quản lý đề thi và lớp học đang được bảo mật và khóa đối với học sinh.
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              sessionStorage.removeItem('is_teacher_previewing');
              quickLogin('teacher', 'Dương Thu Hảo');
              navigate('/teacher-dashboard');
            }}
            className="bg-white hover:bg-amber-50 active:scale-95 text-amber-900 font-extrabold px-3 py-1 rounded-xl shadow-xs transition flex items-center gap-1.5"
          >
            <span>Quay Lại Phân Hệ Cô Hảo</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo & Tên Trường / Tên Môn */}
        <Link to="/" className="flex items-center gap-2.5 group shrink-0">
          {schoolLogo ? (
            <img
              src={schoolLogo}
              alt="Logo Trường"
              className="w-10 h-10 rounded-2xl object-cover shadow-md border border-slate-200 group-hover:scale-105 transition bg-white"
            />
          ) : (
            <GeoGlobeSticker className="w-10 h-10 group-hover:scale-105 transition" />
          )}
          <div>
            <div className="font-black text-slate-900 text-base sm:text-lg leading-tight tracking-tight flex items-center gap-1.5">
              <span>ĐỊA LÍ THCS</span>
              <span className="text-[10px] uppercase font-black bg-[#E0ECE9] text-[#2D4441] px-2 py-0.5 rounded-full border border-[#C3D8D4]">
                Khối 6-9
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium line-clamp-1">
              {schoolNameInput}
            </p>
          </div>
        </Link>

        {/* Thanh tìm kiếm viên thuốc (Capsule Search) chuẩn phong cách ảnh mẫu */}
        <div className="hidden md:flex items-center flex-1 max-w-sm mx-4">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm bài học, câu hỏi, đề thi..."
              className="w-full pl-9 pr-4 py-2 rounded-full bg-[#EDF3F2] hover:bg-[#E5EDEB] focus:bg-white border border-transparent focus:border-[#C9942C] focus:ring-2 focus:ring-[#C9942C]/20 text-xs font-semibold text-slate-800 placeholder:text-slate-400 transition shadow-2xs"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                  navigate(`/questions?search=${encodeURIComponent(e.currentTarget.value.trim())}`);
                }
              }}
            />
          </div>
        </div>

        {/* Action Center */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Nút Đấu Trường Trực Tiếp (Live Game) - Vàng Ochre chuẩn ảnh mẫu */}
          <Link
            to="/live"
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#C9942C] hover:bg-[#B58022] text-white text-xs font-black shadow-md transition active:scale-95 cursor-pointer"
            title="Tạo phòng đấu thi trực tiếp trên máy chiếu lớp học"
          >
            <Gamepad2 className="w-4 h-4 text-white" />
            <span className="hidden sm:inline">Đấu Trường Trực Tiếp</span>
          </Link>

          {/* Chuyển đổi vai trò - CHỈ HIỂN THỊ DÀNH CHO GIÁO VIÊN (HỌC SINH BỊ ẨN HOÀN TOÀN ĐỂ BẢO MẬT) */}
          {isTeacher && (
            <div className="relative" ref={roleMenuRef}>
              <button
                type="button"
                onClick={() => {
                  playSoftClick();
                  setShowRoleMenu((prev) => !prev);
                  setShowUserDropdown(false);
                  setShowNotifications(false);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
                title="Xem trước giao diện Học sinh hoặc về Bàn làm việc"
              >
                <Shield className="w-3.5 h-3.5 text-ocean-600" />
                <span className="hidden md:inline">Vai trò:</span>
                <span>Giáo viên (Cô Hảo)</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showRoleMenu && (
                <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-slate-100 p-2.5 z-50 animate-in fade-in zoom-in-95">
                  <div className="text-[10px] font-bold text-slate-400 px-2 py-1 uppercase tracking-wider">
                    Góc nhìn của Cô Hảo:
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      quickLogin('teacher', 'Dương Thu Hảo');
                      sessionStorage.removeItem('is_teacher_previewing');
                      setShowRoleMenu(false);
                      navigate('/teacher-dashboard');
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-ocean-700 bg-ocean-50/80 transition flex items-center justify-between"
                  >
                    <span>👩‍🏫 Bàn Làm Việc Cô Hảo</span>
                    <span className="w-2 h-2 rounded-full bg-ocean-600"></span>
                  </button>

                  <div className="text-[10px] font-bold text-slate-400 px-2 pt-2.5 pb-1 uppercase tracking-wider border-t border-slate-100 mt-1.5">
                    Xem trước góc nhìn học sinh:
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      sessionStorage.setItem('is_teacher_previewing', 'true');
                      quickLogin('student', 'Học Sinh Mẫu', 6);
                      setShowRoleMenu(false);
                      navigate('/student-dashboard');
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-amber-50 hover:text-amber-800 transition flex items-center justify-between"
                  >
                    <span>👦 Xem Thử Giao Diện Học Sinh</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* CHỈ HIỂN THỊ LEVEL & XP KHI LÀ HỌC SINH (GIÁO VIÊN ĐÃ XÓA HOÀN TOÀN) */}
          {!isTeacher && profile && (
            <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 px-3 py-1 rounded-full">
              <span className="w-5 h-5 rounded-full bg-amber-500 text-white font-black text-[10px] flex items-center justify-center shadow-xs">
                {profile.level || 1}
              </span>
              <span className="text-xs font-bold text-amber-900 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                {(profile.xp || 0).toLocaleString()} XP
              </span>
            </div>
          )}

          {/* GỢI Ý 2: CHUÔNG THÔNG BÁO LỜI PHÊ MỚI TỪ CÔ HẢO */}
          <div className="relative" ref={notificationsRef}>
            <button
              type="button"
              onClick={() => {
                playSoftClick();
                setShowNotifications((prev) => !prev);
                setShowRoleMenu(false);
                setShowUserDropdown(false);
              }}
              className="relative p-2.5 rounded-full bg-[#EDF3F2] hover:bg-[#E5EDEB] border border-[#D0DEDC] text-[#2D4441] transition cursor-pointer active:scale-95 shadow-2xs"
              title="Thông báo nhận xét & lời phê"
            >
              <Bell className="w-4 h-4 text-[#2D4441]" />
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[#C9942C] border-2 border-white rounded-full"></span>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-[#C9942C] text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-xs border border-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Dropdown Thông Báo */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-[420px] bg-white rounded-3xl shadow-2xl border border-slate-100 p-4 z-50 animate-in fade-in zoom-in-95 space-y-3">
                {/* Header: Tiêu đề + Nút Đánh dấu đã đọc tất cả ngay đầu danh sách (Gợi ý 2) */}
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                  <div className="flex items-center gap-2 font-black text-slate-900 text-xs sm:text-sm">
                    <div className="w-7 h-7 rounded-xl bg-[#FAF6EE] flex items-center justify-center border border-[#ECD9B5]">
                      <Bell className="w-3.5 h-3.5 text-[#C9942C]" />
                    </div>
                    <span>Thông Báo Lời Phê Mới</span>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#EDF3F2] text-[#2D4441]">
                      {notifications.length}
                    </span>
                  </div>

                  {/* Nút bấm nổi bật Đã đọc tất cả */}
                  <div>
                    {unreadCount > 0 ? (
                      <button
                        type="button"
                        onClick={handleMarkAllRead}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FAF6EE] hover:bg-[#F4E8D3] text-[#774F1B] border border-[#ECD9B5] text-[11px] font-black transition cursor-pointer active:scale-95 shadow-2xs"
                        title="Đánh dấu tất cả thông báo là đã đọc"
                      >
                        <CheckCheck className="w-3.5 h-3.5 text-[#C9942C]" />
                        <span>Đã đọc tất cả ({unreadCount})</span>
                      </button>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Đã đọc hết</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Thanh bộ lọc con nhộng: Tất cả vs Chưa đọc + Nút dọn dẹp đã đọc */}
                <div className="flex items-center justify-between gap-2 pt-0.5">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        playSoftClick();
                        setNotificationFilter('all');
                      }}
                      className={`px-3 py-1 rounded-full text-[11px] font-bold transition cursor-pointer ${
                        notificationFilter === 'all'
                          ? 'bg-[#2D4441] text-white shadow-xs'
                          : 'bg-[#EDF3F2] text-slate-600 hover:bg-[#E2ECE9]'
                      }`}
                    >
                      Tất cả ({notifications.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        playSoftClick();
                        setNotificationFilter('unread');
                      }}
                      className={`px-3 py-1 rounded-full text-[11px] font-bold transition cursor-pointer flex items-center gap-1 ${
                        notificationFilter === 'unread'
                          ? 'bg-[#C9942C] text-white shadow-xs'
                          : 'bg-[#EDF3F2] text-slate-600 hover:bg-[#E2ECE9]'
                      }`}
                    >
                      <span>Chưa đọc</span>
                      {unreadCount > 0 && (
                        <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center">
                          {unreadCount}
                        </span>
                      )}
                    </button>
                  </div>

                  {notifications.some((n) => n.is_read) && (
                    <button
                      type="button"
                      onClick={handleClearRead}
                      className="text-[10px] text-slate-400 hover:text-rose-600 font-bold transition flex items-center gap-1 cursor-pointer"
                      title="Xóa các thông báo đã đọc để danh sách gọn gàng"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span className="hidden sm:inline">Xóa đã đọc</span>
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {displayedNotifications.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs italic bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
                      {notificationFilter === 'unread'
                        ? '🎉 Không còn thông báo nào chưa đọc.'
                        : 'Chưa có thông báo lời phê mới nào.'}
                    </div>
                  ) : (
                    displayedNotifications.map((notif) => (
                      <Link
                        key={notif.id}
                        to={`/results/${notif.assignment_id || 'asg_1'}`}
                        onClick={() => setShowNotifications(false)}
                        className={`block p-3 rounded-2xl border transition text-xs ${
                          !notif.is_read
                            ? 'bg-[#FAF6EE] border-[#ECD9B5] text-[#1E2D2B] font-medium shadow-2xs'
                            : 'bg-slate-50/70 border-slate-100 text-slate-700 hover:bg-slate-100/80'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold mb-1">
                          <span className="text-[#774F1B] font-bold flex items-center gap-1">
                            <span>👩‍🏫 Lời phê Cô Hảo</span>
                            {!notif.is_read && (
                              <span className="w-1.5 h-1.5 rounded-full bg-[#C9942C]"></span>
                            )}
                          </span>
                          <span>{new Date(notif.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="font-bold text-slate-900 line-clamp-2 italic">
                          "{notif.feedback_text}"
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1 truncate">
                          Đề: <strong>{notif.assignment_title}</strong>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* KHỐI HỒ SƠ CÔ DƯƠNG THU HẢO + DROPDOWN CÀI ĐẶT & ĐĂNG XUẤT */}
          <div className="relative pl-2 border-l border-slate-200" ref={userDropdownRef}>
            <button
              type="button"
              onClick={() => {
                playSoftClick();
                setShowUserDropdown((prev) => !prev);
                setShowRoleMenu(false);
                setShowNotifications(false);
              }}
              className="flex items-center gap-2 p-1 rounded-2xl hover:bg-slate-100 transition active:scale-98 text-left cursor-pointer"
            >
              {/* Ảnh đại diện / Logo */}
              <div className="relative">
                <img
                  src={
                    profile?.avatar_url ||
                    'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=120&q=80'
                  }
                  alt={profile?.full_name || 'Dương Thu Hảo'}
                  className="w-9 h-9 rounded-full object-cover border-2 border-ocean-300 shadow-xs"
                />
                {isTeacher && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"></span>
                )}
              </div>

              {/* Tên hiển thị Dương Thu Hảo */}
              <div className="hidden lg:block text-left">
                <div className="text-xs font-bold text-slate-800 line-clamp-1 max-w-[130px]">
                  {profile?.full_name || 'Dương Thu Hảo'}
                </div>
                <div className="text-[10px] text-slate-500 font-medium">
                  {isTeacher ? 'Giáo viên Địa lí' : 'Học sinh'}
                </div>
              </div>

              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Menu Dropdown Cài đặt & Đăng xuất */}
            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-3xl shadow-2xl border border-slate-100 p-3 z-50 animate-in fade-in zoom-in-95 space-y-2">
                {/* Thông tin cô */}
                <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-2xl border border-slate-100">
                  <img
                    src={
                      profile?.avatar_url ||
                      'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=120&q=80'
                    }
                    alt={profile?.full_name || 'Avatar'}
                    className="w-11 h-11 rounded-full object-cover border border-slate-200 shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 truncate">
                      {profile?.full_name || 'Dương Thu Hảo'}
                    </div>
                    <div className="text-[11px] text-ocean-700 font-medium">
                      {isTeacher ? 'Giáo viên Địa lí THCS' : 'Học sinh'}
                    </div>
                  </div>
                </div>

                {/* Danh sách chức năng trong menu */}
                <div className="space-y-1">
                  {/* Đổi ảnh đại diện / Logo */}
                  <button
                    type="button"
                    onClick={() => {
                      fileInputRef.current?.click();
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition flex items-center gap-2.5"
                  >
                    <Camera className="w-4 h-4 text-ocean-600" />
                    <span>{isUploadingAvatar ? 'Đang đổi ảnh...' : 'Đổi Ảnh Đại Diện / Logo'}</span>
                  </button>

                  {/* Cài đặt thông tin */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowSettingsModal(true);
                      setShowUserDropdown(false);
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition flex items-center gap-2.5"
                  >
                    <Settings className="w-4 h-4 text-slate-600" />
                    <span>Cài Đặt Thông Tin & Tên Trường</span>
                  </button>

                  <div className="border-t border-slate-100 my-1"></div>

                  {/* Nút Đăng Xuất Thực Sự */}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition flex items-center gap-2.5"
                  >
                    <LogOut className="w-4 h-4 text-red-500" />
                    <span>Đăng Xuất Khỏi Hệ Thống</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Input File Ẩn để Đổi Ảnh Đại Diện */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleAvatarUpload}
        className="hidden"
      />

      {/* MODAL CÀI ĐẶT THÔNG TIN GIÁO VIÊN & TÊN TRƯỜNG */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative space-y-4">
            <button
              type="button"
              onClick={() => setShowSettingsModal(false)}
              className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-ocean-100 text-ocean-700 flex items-center justify-center font-bold">
                <Settings className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Cài Đặt Hồ Sơ & Hệ Thống</h3>
                <p className="text-xs text-slate-500">Cập nhật tên giáo viên và tên trường học</p>
              </div>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              {/* Ảnh đại diện / Logo */}
              <div className="flex items-center gap-4 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <img
                  src={
                    profile?.avatar_url ||
                    'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=120&q=80'
                  }
                  alt="Avatar"
                  className="w-14 h-14 rounded-full object-cover border-2 border-ocean-400 shrink-0"
                />
                <div className="space-y-1">
                  <div className="text-xs font-bold text-slate-800">Ảnh chân dung / Logo trường</div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-xs"
                  >
                    <Camera className="w-3.5 h-3.5 text-ocean-600" />
                    Tải ảnh mới từ máy tính
                  </button>
                </div>
              </div>

              {/* Tên Giáo Viên */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Họ và tên Giáo viên hiển thị:
                </label>
                <input
                  type="text"
                  value={teacherNameInput}
                  onChange={(e) => setTeacherNameInput(e.target.value)}
                  placeholder="VD: Dương Thu Hảo"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-ocean-500"
                  required
                />
              </div>

              {/* Tên Trường */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tên trường học của Cô:
                </label>
                <input
                  type="text"
                  value={schoolNameInput}
                  onChange={(e) => setSchoolNameInput(e.target.value)}
                  placeholder="VD: Trường THCS..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-ocean-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-ocean-600 hover:bg-ocean-700 active:scale-95 text-white text-xs font-bold shadow-xs transition"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Lưu Thay Đổi Ngay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
