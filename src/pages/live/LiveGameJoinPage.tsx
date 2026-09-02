import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Globe, ArrowRight, Sparkles, User, KeyRound, AlertCircle, Radio, CheckCircle2, BadgeCheck } from 'lucide-react';
import { isValidActiveRoom, getActiveRooms, ActiveLiveRoom } from '../../lib/liveGameEngine';
import { getStoredStudents } from '../../data/studentsData';

export const LiveGameJoinPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { profile } = useAuth();

  const [pin, setPin] = useState<string>(() => searchParams.get('pin') || '');

  useEffect(() => {
    const urlPin = searchParams.get('pin');
    if (urlPin) setPin(urlPin);
  }, [searchParams]);
  const [nickname, setNickname] = useState<string>(() => {
    if (profile?.full_name) {
      return `${profile.full_name}${profile.class_name ? ` (${profile.class_name})` : ''}`;
    }
    return '';
  });
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [activeRooms, setActiveRooms] = useState<ActiveLiveRoom[]>(() => getActiveRooms());

  useEffect(() => {
    const handleUpdate = () => {
      setActiveRooms(getActiveRooms());
    };
    handleUpdate();
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('geo_active_rooms_updated', handleUpdate);
    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('geo_active_rooms_updated', handleUpdate);
    };
  }, []);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanPin = pin.trim().replace(/\s+/g, '');
    if (!cleanPin || cleanPin.length < 4) {
      setErrorMsg('Vui lòng nhập đúng mã PIN phòng đấu gồm 6 chữ số!');
      return;
    }

    if (!nickname.trim()) {
      setErrorMsg('Vui lòng nhập Họ tên hoặc Mã số của em để Cô và cả lớp cùng biết nhé!');
      return;
    }

    // 🛑 KIỂM TRA XÁC THỰC MÃ PIN VÀ TRẠNG THÁI PHÒNG ĐẤU THỰC TẾ CỦA CÔ HẢO
    const validation = isValidActiveRoom(cleanPin);
    if (!validation.valid) {
      setErrorMsg(validation.error || `Mã PIN ${cleanPin} không tồn tại hoặc phòng chưa được mở!`);
      return;
    }

    // Tự động nhận diện nếu học sinh nhập Mã số (Ví dụ: HS071) -> chuyển thành Tên + Lớp
    let finalDisplayName = nickname.trim();
    try {
      const allStudents = getStoredStudents();
      const cleanUpper = finalDisplayName.toUpperCase().replace(/\s+/g, '');
      const foundStudent = allStudents.find(
        (s) =>
          (s.student_code && s.student_code.toUpperCase() === cleanUpper) ||
          (s.student_code && s.student_code.toUpperCase().replace(/[^A-Z0-9]/g, '') === cleanUpper) ||
          (s.id && s.id.toUpperCase() === cleanUpper)
      );
      if (foundStudent) {
        finalDisplayName = `${foundStudent.full_name} (${foundStudent.class_name || `Khối ${foundStudent.grade}`} - ${foundStudent.student_code})`;
      }
    } catch (e) {
      console.warn(e);
    }

    // Lưu thông tin người chơi
    sessionStorage.setItem('live_game_pin', cleanPin);
    sessionStorage.setItem('live_game_nickname', finalDisplayName);

    navigate(`/live/play/${cleanPin}`);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 animate-in fade-in">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-white space-y-6">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-ocean-500 to-teal-400 text-white flex items-center justify-center mx-auto shadow-md">
            <Globe className="w-8 h-8" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            ĐẤU TRƯỜNG ĐỊA LÍ THCS
          </h2>
          <p className="text-xs text-slate-400">
            Nhập mã PIN 6 số hiển thị trên máy chiếu của Cô Hảo để tham gia
          </p>
        </div>

        {/* Thông báo lỗi mã PIN không hợp lệ */}
        {errorMsg && (
          <div className="p-3.5 bg-rose-950/80 border border-rose-600 rounded-2xl text-xs text-rose-200 flex items-start gap-2.5 animate-shake shadow-lg">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed font-medium">{errorMsg}</div>
          </div>
        )}

        {/* Gợi ý phòng đấu đang mở trực tiếp từ Cô Hảo (nếu có) */}
        {activeRooms.length > 0 && (
          <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-2xl text-xs space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
              <span>Phòng Đấu Đang Mở Trực Tiếp:</span>
            </div>
            {activeRooms.map((r) => (
              <button
                key={r.pin}
                type="button"
                onClick={() => {
                  setPin(r.pin);
                  setErrorMsg('');
                }}
                className="w-full text-left p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 transition flex items-center justify-between cursor-pointer"
              >
                <div>
                  <div className="font-black text-yellow-300 font-mono text-sm tracking-wider">
                    PIN: {r.pin}
                  </div>
                  <div className="text-[11px] text-slate-400">{r.title}</div>
                </div>
                <span className="text-[11px] font-bold text-emerald-400 bg-emerald-900/60 px-2 py-0.5 rounded-lg border border-emerald-700/50">
                  Bấm để điền mã
                </span>
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Mã PIN Phòng Đấu (6 Số):
            </label>
            <div className="relative">
              <input
                type="text"
                maxLength={6}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                placeholder="VD: 849203"
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-800 border border-slate-700 text-yellow-300 font-mono font-black text-xl tracking-widest focus:outline-none focus:ring-2 focus:ring-ocean-500 text-center uppercase placeholder:text-slate-600"
                required
                autoFocus
              />
              <KeyRound className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Họ và Tên (hoặc Mã số học sinh):
            </label>
            <div className="relative">
              <input
                type="text"
                value={nickname}
                onChange={(e) => {
                  setNickname(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                placeholder="VD: Tẩn Thị Lan Anh (7A1) hoặc HS071"
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-800 border border-slate-700 text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500 placeholder:text-slate-500"
                required
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              💡 Tên này sẽ xuất hiện trên màn hình máy chiếu và bảng vàng vinh danh của Cô Hảo.
            </p>
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 active:scale-95 text-white font-black text-sm sm:text-base shadow-lg transition cursor-pointer"
          >
            Vào Phòng Thi Ngay
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
