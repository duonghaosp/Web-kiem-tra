import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Globe,
  ArrowRight,
  User,
  KeyRound,
  AlertCircle,
  Radio,
  BadgeCheck,
  Smartphone,
  Edit3,
} from 'lucide-react';
import {
  checkValidActiveRoom,
  fetchActiveRooms,
  ActiveLiveRoom,
  getOrCreateDeviceId,
} from '../../lib/liveGameEngine';
import { getStoredStudents } from '../../data/studentsData';

export const LiveGameJoinPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { profile } = useAuth();

  const urlPin = searchParams.get('pin') || '';
  const [pin, setPin] = useState<string>(() => urlPin);

  useEffect(() => {
    if (urlPin) setPin(urlPin);
  }, [urlPin]);

  const [nickname, setNickname] = useState<string>(() => {
    if (profile?.full_name) {
      return `${profile.full_name}${profile.class_name ? ` (${profile.class_name})` : ''}`;
    }
    return '';
  });
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [activeRooms, setActiveRooms] = useState<ActiveLiveRoom[]>([]);

  // Kiểm tra xem thiết bị này đã từng tham gia phòng đấu này trước đó hay chưa (1 thiết bị = 1 học sinh)
  const [joinedDeviceName, setJoinedDeviceName] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState<boolean>(false);

  useEffect(() => {
    const cleanPin = pin.trim().replace(/\s+/g, '');
    if (cleanPin && cleanPin.length >= 4) {
      try {
        const stored = localStorage.getItem(`geo_live_joined_${cleanPin}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed?.studentName) {
            setJoinedDeviceName(parsed.studentName);
          } else {
            setJoinedDeviceName(null);
          }
        } else {
          setJoinedDeviceName(null);
        }
      } catch {
        setJoinedDeviceName(null);
      }
    } else {
      setJoinedDeviceName(null);
    }
  }, [pin]);

  // Chỉ lấy danh sách phòng mở khi KHÔNG có urlPin từ mã QR
  useEffect(() => {
    if (urlPin) return; // Quét QR đã có mã PIN thì tuyệt đối không cần lấy danh sách phòng khác

    let isMounted = true;
    const handleUpdate = async () => {
      const rooms = await fetchActiveRooms();
      if (isMounted) setActiveRooms(rooms);
    };
    handleUpdate();
    const timer = setInterval(handleUpdate, 4000);
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('geo_active_rooms_updated', handleUpdate);
    return () => {
      isMounted = false;
      clearInterval(timer);
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('geo_active_rooms_updated', handleUpdate);
    };
  }, [urlPin]);

  const handleJoin = async (e: React.FormEvent) => {
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

    setIsChecking(true);
    // 🛑 KIỂM TRA XÁC THỰC MÃ PIN VÀ TRẠNG THÁI PHÒNG ĐẤU TRÊN SUPABASE CLOUD & LOCALSTORAGE
    const validation = await checkValidActiveRoom(cleanPin);
    setIsChecking(false);

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

    // Ghi nhớ thiết bị này đã tham gia phòng với tên này (khóa 1 thiết bị = 1 tên)
    const deviceId = getOrCreateDeviceId();
    try {
      localStorage.setItem(
        `geo_live_joined_${cleanPin}`,
        JSON.stringify({
          deviceId,
          studentName: finalDisplayName,
          joinedAt: Date.now(),
        })
      );
    } catch (err) {}

    // Lưu thông tin vào sessionStorage phiên thi đấu
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
            {urlPin
              ? 'Em đã quét mã QR thành công, hãy kiểm tra thông tin và nhập tên để vào thi!'
              : 'Nhập mã PIN 6 số hiển thị trên máy chiếu của Cô Hảo để tham gia'}
          </p>
        </div>

        {/* Thông báo lỗi mã PIN không hợp lệ */}
        {errorMsg && (
          <div className="p-3.5 bg-rose-950/80 border border-rose-600 rounded-2xl text-xs text-rose-200 flex items-start gap-2.5 animate-shake shadow-lg">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed font-medium">{errorMsg}</div>
          </div>
        )}

        {/* TRƯỜNG HỢP 1: HỌC SINH QUÉT MÃ QR -> HIỂN THỊ DUY NHẤT MÃ PIN ĐÃ QUÉT (KHÔNG HIỆN PHÒNG KHÁC) */}
        {urlPin && (
          <div className="p-4 bg-emerald-950/60 border border-emerald-500/50 rounded-2xl text-center space-y-1.5 shadow-md">
            <div className="inline-flex items-center gap-1.5 text-emerald-400 font-bold text-xs uppercase tracking-wider">
              <BadgeCheck className="w-4 h-4 text-emerald-400" />
              <span>Đã Quét Mã QR Phòng Đấu</span>
            </div>
            <div className="text-3xl font-black font-mono tracking-widest text-yellow-300 py-0.5">
              PIN: {urlPin}
            </div>
            <div className="text-[11px] text-slate-300 font-medium">
              Đấu Trường Địa Lí THCS • Cô Hảo
            </div>
          </div>
        )}

        {/* TRƯỜNG HỢP 2: HỌC SINH TỰ VÀO WEB KHÔNG QUA QR VÀ CÓ PHÒNG ĐANG MỞ (ẨN NẾU ĐÃ QUÉT QR) */}
        {!urlPin && activeRooms.length > 0 && (
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

        {/* TRƯỜNG HỢP THIẾT BỊ ĐÃ TỪNG ĐĂNG NHẬP PHÒNG NÀY (KHÓA 1 THIẾT BỊ = 1 NGƯỜI CHƠI) */}
        {joinedDeviceName && !isEditingName ? (
          <div className="p-4.5 bg-slate-800/90 border-2 border-emerald-500/60 rounded-3xl space-y-3.5 text-center shadow-xl animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 flex items-center justify-center mx-auto">
              <Smartphone className="w-6 h-6 text-emerald-400" />
            </div>

            <div className="space-y-1">
              <div className="text-xs font-bold text-emerald-400 uppercase tracking-wide">
                Thiết Bị Của Em Đã Tham Gia Phòng
              </div>
              <div className="text-lg font-black text-white">
                {joinedDeviceName}
              </div>
              <div className="text-[11px] text-slate-400">
                Mã PIN: <span className="font-mono font-bold text-yellow-300">{pin}</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed px-1">
              Điện thoại của em đã vào phòng này. Theo quy định, mỗi thiết bị chỉ được thi đấu 1 lần để đảm bảo tính công bằng.
            </p>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  const cleanPin = pin.trim().replace(/\s+/g, '');
                  sessionStorage.setItem('live_game_pin', cleanPin);
                  sessionStorage.setItem('live_game_nickname', joinedDeviceName);
                  navigate(`/live/play/${cleanPin}`);
                }}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black text-sm shadow-lg transition active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Tiếp Tục Thi Đấu Với Tên Này</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsEditingName(true);
                  setNickname(joinedDeviceName);
                }}
                className="text-xs text-slate-400 hover:text-yellow-300 flex items-center justify-center gap-1.5 mx-auto underline cursor-pointer pt-1"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Em lỡ gõ sai tên và muốn sửa lại tên của mình?</span>
              </button>
            </div>
          </div>
        ) : (
          /* FORM NHẬP THÔNG TIN (KHI CHƯA ĐĂNG NHẬP HOẶC KHI ĐANG ĐỔI TÊN THIẾT BỊ) */
          <form onSubmit={handleJoin} className="space-y-4">
            {isEditingName && (
              <div className="p-3 bg-amber-950/70 border border-amber-500/50 rounded-2xl text-xs text-amber-200 space-y-1">
                <div className="font-bold flex items-center gap-1 text-amber-300">
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Cập nhật lại tên cho thiết bị của em:</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Tên mới sẽ thay thế tên cũ trên máy chiếu của Cô Hảo (không tạo thêm học sinh mới).
                </p>
              </div>
            )}

            {/* Nếu chưa quét QR thì hiển thị ô nhập mã PIN; nếu đã quét QR thì hiển thị PIN cố định */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Mã PIN Phòng Đấu (6 Số):
              </label>
              <div className="relative">
                <input
                  type="text"
                  maxLength={6}
                  value={pin}
                  readOnly={Boolean(urlPin)}
                  onChange={(e) => {
                    setPin(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                  placeholder="VD: 849203"
                  className={`w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-800 border font-mono font-black text-xl tracking-widest focus:outline-none focus:ring-2 focus:ring-ocean-500 text-center uppercase ${
                    urlPin
                      ? 'border-emerald-500/50 text-yellow-300 cursor-not-allowed bg-slate-800/90'
                      : 'border-slate-700 text-yellow-300 placeholder:text-slate-600'
                  }`}
                  required
                  autoFocus={!urlPin}
                />
                <KeyRound className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
              {urlPin && (
                <p className="text-[11px] text-emerald-400 mt-1">
                  ✓ Mã PIN đã được tự động điền chính xác từ mã QR của Cô Hảo.
                </p>
              )}
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
                  autoFocus={Boolean(urlPin)}
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                💡 Tên này sẽ xuất hiện trên màn hình máy chiếu và bảng vàng vinh danh của Cô Hảo.
              </p>
            </div>

            <button
              type="submit"
              disabled={isChecking}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 active:scale-95 text-white font-black text-sm sm:text-base shadow-lg transition cursor-pointer"
            >
              {isChecking ? (
                <span>Đang kết nối phòng đấu...</span>
              ) : isEditingName ? (
                <>
                  <span>Cập Nhật Tên & Vào Thi Ngay</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>Vào Phòng Thi Ngay</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
