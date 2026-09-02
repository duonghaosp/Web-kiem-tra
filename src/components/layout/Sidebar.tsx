import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Home,
  LayoutDashboard,
  Users,
  BookOpen,
  CalendarCheck,
  CheckCircle,
  BarChart3,
  Gamepad2,
  Settings,
  Sparkles,
  LogOut,
  Compass,
} from 'lucide-react';
import { GeoGlobeSticker } from '../common/GeoStickers';

export const Sidebar: React.FC = () => {
  const { profile, role, quickLogin, signOut } = useAuth();
  const isTeacher = role === 'teacher' || role === 'admin';

  const [schoolName, setSchoolName] = useState(
    () => localStorage.getItem('geo_school_name') || 'PTDTBT TH&THCS Sì Lờ Lầu'
  );

  useEffect(() => {
    const handleUpdate = () => {
      const stored = localStorage.getItem('geo_school_name');
      if (stored) setSchoolName(stored);
    };
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('geo_settings_updated', handleUpdate);
    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('geo_settings_updated', handleUpdate);
    };
  }, []);

  const teacherNavItems = [
    { to: '/', label: 'Trang Chủ', icon: Home },
    { to: '/teacher-dashboard', label: 'Bàn Làm Việc', icon: LayoutDashboard },
    { to: '/live', label: 'Đấu Trường Trực Tiếp', icon: Gamepad2, highlight: true },
    { to: '/classes', label: 'Lớp Học', icon: Users },
    { to: '/questions', label: 'Kho Đề', icon: BookOpen },
    { to: '/assignments', label: 'Tạo Đề & Giao Bài', icon: CalendarCheck },
    { to: '/grading', label: 'Chấm Bài & Nhận Xét', icon: CheckCircle },
    { to: '/reports', label: 'Báo Cáo & Cảnh Báo', icon: BarChart3 },
    { to: '/settings', label: 'Cài Đặt Hệ Thống', icon: Settings },
  ];

  const studentNavItems = [
    { to: '/', label: 'Trang Chủ', icon: Home },
    { to: '/student-dashboard', label: 'Góc Học Tập & Bài Thi', icon: LayoutDashboard },
    { to: '/live/join', label: 'Vào Đấu Trường PIN', icon: Gamepad2, highlight: true },
  ];

  const navItems = isTeacher ? teacherNavItems : studentNavItems;

  return (
    <aside className="w-full md:w-64 shrink-0 bg-[#2D4441] text-white p-4 sm:p-5 flex flex-col justify-between min-h-[calc(100vh-4rem)] relative z-20 border-r border-[#243835]">
      <div className="space-y-6">
        {/* Profile Card phong cách Aviation/Scandinavian: Vòng tròn Avatar viền vàng Ochre + Chữ ký Hảo Địa lí */}
        <div className="flex flex-col items-center text-center p-3 rounded-2xl bg-[#233835]/70 border border-[#3A5551]">
          <div className="relative mb-2.5">
            <div className="w-16 h-16 rounded-full p-0.5 bg-gradient-to-tr from-[#C9942C] via-[#E8B858] to-[#C9942C] shadow-lg flex items-center justify-center">
              <img
                src={
                  profile?.avatar_url ||
                  'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=120&q=80'
                }
                alt="Cô Hảo"
                className="w-full h-full object-cover rounded-full border-2 border-[#2D4441]"
              />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-[#233835] rounded-full p-0.5 shadow-sm">
              <GeoGlobeSticker className="w-5 h-5" />
            </div>
          </div>

          <div className="font-black text-sm sm:text-base tracking-tight text-white flex items-center gap-1 justify-center">
            <span className="text-[#C9942C] font-black text-lg">Đ</span>ỊA LÍ THCS
          </div>

          {/* Dòng chữ ký nghệ thuật Hảo Địa lí siêu rõ chữ, siêu sắc nét */}
          <div className="mt-1 flex items-center justify-center gap-1.5">
            <span
              className="font-script text-xl sm:text-2xl font-bold text-[#E5B24D] drop-shadow-md tracking-wide select-none leading-none"
              style={{ fontFamily: "'Dancing Script', 'Caveat', cursive" }}
            >
              Hảo Địa lí
            </span>
            <span className="text-[#E5B24D] text-xs animate-bounce">✨</span>
          </div>

          <p className="text-[10px] text-[#9EBAB5] font-semibold mt-1 truncate max-w-[190px]">
            {isTeacher ? 'PTDTBT TH&THCS Sì Lờ Lầu' : 'Góc Học Tập Học Sinh'}
          </p>
        </div>

        {/* Thông báo xem trước học sinh */}
        {!isTeacher && sessionStorage.getItem('is_teacher_previewing') === 'true' && (
          <div className="p-3 bg-white text-[#2D4441] rounded-2xl text-xs space-y-1.5 shadow-xl animate-in fade-in">
            <div className="font-black flex items-center gap-1.5 text-[#C9942C]">
              <Sparkles className="w-3.5 h-3.5" />
              Đang xem thử góc nhìn Học sinh
            </div>
            <p className="text-[11px] text-slate-600 leading-snug font-medium">
              Các phân hệ của Cô đang được khóa an toàn.
            </p>
            <button
              type="button"
              onClick={() => {
                sessionStorage.removeItem('is_teacher_previewing');
                quickLogin('teacher', 'Dương Thu Hảo');
              }}
              className="w-full mt-1 py-1.5 rounded-xl bg-[#C9942C] hover:bg-[#B58022] text-white font-black text-xs transition active:scale-95 shadow-sm cursor-pointer"
            >
              Quay Lại Phân Hệ Cô Hảo
            </button>
          </div>
        )}

        {/* Tiêu đề danh mục */}
        <div className="text-[10px] font-black text-[#8EAFA9] uppercase tracking-widest px-3 flex items-center justify-between">
          <span>{isTeacher ? 'QUẢN LÝ CHUYÊN MÔN' : 'GÓC HỌC TẬP'}</span>
          <Compass className="w-3 h-3 text-[#C9942C]" />
        </div>

        {/* Danh sách Menu - Chuẩn ảnh mẫu: Tab active màu trắng tinh rọi sáng, chữ đậm cực rõ */}
        <nav className="space-y-1.5 relative">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3.5 font-extrabold text-xs sm:text-sm transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-white text-[#2D4441] rounded-r-2xl py-3 pl-4 -mr-4 sm:-mr-5 shadow-xl z-30 font-black'
                      : item.highlight
                      ? 'text-white bg-[#C9942C] hover:bg-[#B58022] rounded-xl py-2.5 px-4 shadow-md font-black'
                      : 'text-[#D2E2DF] hover:text-white hover:bg-white/10 rounded-xl py-2.5 px-4'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive
                          ? 'text-[#C9942C] stroke-[2.5]'
                          : item.highlight
                          ? 'text-white stroke-[2.5]'
                          : 'text-[#C9942C]/90 stroke-[2]'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Gợi ý Đấu trường thời gian thực */}
        {isTeacher && (
          <div className="bg-[#233835]/80 border border-[#3A5551] rounded-2xl p-3.5 text-xs text-white space-y-1 shadow-inner">
            <div className="font-black flex items-center gap-1.5 text-[#E5B24D]">
              <Sparkles className="w-4 h-4 text-[#C9942C]" />
              Đấu Trường Trực Tiếp
            </div>
            <p className="text-[11px] text-[#A8C4BF] leading-relaxed font-medium">
              Chiếu lên máy chiếu để cả lớp cùng chọn 4 nút màu thi đấu trực tiếp!
            </p>
          </div>
        )}
      </div>

      {/* Chân Sidebar: Nút Đăng Xuất (Go Out) dạng viên nhộng & Bản quyền */}
      <div className="pt-4 border-t border-white/10 space-y-3">
        <button
          type="button"
          onClick={() => {
            if (confirm('Cô có chắc chắn muốn đăng xuất khỏi hệ thống?')) {
              signOut();
            }
          }}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white text-xs font-black transition cursor-pointer border border-white/15 shadow-xs"
          title="Đăng xuất khỏi hệ thống"
        >
          <LogOut className="w-4 h-4 text-[#C9942C]" />
          <span>Đăng Xuất (Go Out)</span>
        </button>

        <div className="text-[10px] text-[#8EAFA9] text-center truncate px-1 font-bold">
          © {schoolName}
        </div>
      </div>
    </aside>
  );
};
