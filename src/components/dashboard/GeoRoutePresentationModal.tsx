import React, { useState, useEffect } from 'react';
import { X, Maximize2, Minimize2, Volume2, VolumeX, Compass, Navigation, Wind, Waves, Globe, Sparkles, MapPin } from 'lucide-react';
import { playSoftClick, playSwitchTab, isSoundEnabled, toggleSoundEnabled } from '../../utils/soundEffects';

interface GeoRoutePresentationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRouteId?: 'global' | 'monsoon' | 'current';
}

export const GeoRoutePresentationModal: React.FC<GeoRoutePresentationModalProps> = ({
  isOpen,
  onClose,
  initialRouteId = 'global',
}) => {
  const [selectedRoute, setSelectedRoute] = useState<'global' | 'monsoon' | 'current'>(initialRouteId);
  const [soundOn, setSoundOn] = useState(isSoundEnabled());
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    setSelectedRoute(initialRouteId);
  }, [initialRouteId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const toggleFullscreen = () => {
    playSoftClick();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleSoundToggle = () => {
    const next = toggleSoundEnabled();
    setSoundOn(next);
    if (next) playSoftClick();
  };

  const handleSelectRoute = (route: 'global' | 'monsoon' | 'current') => {
    playSwitchTab();
    setSelectedRoute(route);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-7xl h-[94vh] bg-[#1E2D2B] rounded-3xl border border-[#3A5551] shadow-2xl flex flex-col overflow-hidden text-white relative">
        {/* Vầng sáng vàng ấm nghệ thuật */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#C9942C]/10 rounded-full blur-3xl pointer-events-none" />

        {/* 1. Header Trình Chiếu Giảng Dạy */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#162220]/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#C9942C] flex items-center justify-center text-white shadow-md">
              <Globe className="w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-[#F0D59D] uppercase tracking-widest bg-white/10 px-2.5 py-0.5 rounded-full border border-white/15">
                  GIÁO CỤ TRỰC QUAN TRÊN LỚP
                </span>
                <span className="text-xs text-[#8EAFA9] font-medium hidden sm:inline">
                  • Trường PTDTBT TH&THCS Sì Lở Lầu
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-1.5 mt-0.5">
                <span>Lược Đồ Chuyên Đề Môn Địa Lí THCS</span>
                <span className="text-[#C9942C] text-sm">✨</span>
              </h2>
            </div>
          </div>

          {/* Điều khiển: Âm thanh, Toàn màn hình, Đóng */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSoundToggle}
              className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/15 text-[#D5E4E1] transition cursor-pointer"
              title={soundOn ? 'Đang bật âm thanh (Bấm để tắt)' : 'Đang tắt âm thanh (Bấm để bật)'}
            >
              {soundOn ? <Volume2 className="w-4 h-4 text-[#F0D59D]" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
            </button>

            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/15 text-[#D5E4E1] transition cursor-pointer hidden sm:flex"
              title="Phóng to toàn màn hình máy chiếu"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4 text-[#F0D59D]" /> : <Maximize2 className="w-4 h-4 text-[#F0D59D]" />}
            </button>

            <button
              type="button"
              onClick={() => {
                playSoftClick();
                onClose();
              }}
              className="p-2.5 rounded-2xl bg-white/10 hover:bg-rose-500/80 text-white transition cursor-pointer"
              title="Đóng chế độ trình chiếu (Phím Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. Thanh Tabs Chọn Tuyến Chuyên Đề Dạng Viên Nhộng Cỡ Lớn */}
        <div className="px-6 py-3 bg-[#233835]/90 border-b border-white/10 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
            <button
              type="button"
              onClick={() => handleSelectRoute('global')}
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-black transition cursor-pointer ${
                selectedRoute === 'global'
                  ? 'bg-[#C9942C] text-white shadow-lg scale-102'
                  : 'bg-white/10 text-[#C0D6D2] hover:bg-white/15 hover:text-white'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>Chuyên Đề 1: Vòng Quanh Trái Đất & Kinh Vĩ Tuyến</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectRoute('monsoon')}
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-black transition cursor-pointer ${
                selectedRoute === 'monsoon'
                  ? 'bg-[#C9942C] text-white shadow-lg scale-102'
                  : 'bg-white/10 text-[#C0D6D2] hover:bg-white/15 hover:text-white'
              }`}
            >
              <Wind className="w-4 h-4" />
              <span>Chuyên Đề 2: Cơ Chế Gió Mùa Việt Nam & Tây Bắc</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectRoute('current')}
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-black transition cursor-pointer ${
                selectedRoute === 'current'
                  ? 'bg-[#C9942C] text-white shadow-lg scale-102'
                  : 'bg-white/10 text-[#C0D6D2] hover:bg-white/15 hover:text-white'
              }`}
            >
              <Waves className="w-4 h-4" />
              <span>Chuyên Đề 3: Hải Lưu Nóng - Lạnh & Tuần Hoàn Đại Dương</span>
            </button>
          </div>

          <div className="text-xs text-[#A8C4BF] font-semibold hidden md:block">
            📍 Điểm mốc trọng tâm: <strong className="text-white">Trường PTDTBT TH&THCS Sì Lở Lầu (22°34'B, 103°28'Đ)</strong>
          </div>
        </div>

        {/* 3. Khung Bản Đồ Giảng Dạy Khổ Lớn */}
        <div className="flex-1 p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0 overflow-y-auto">
          {/* Cột Bản Đồ (Chiếm 2 phần) */}
          <div className="lg:col-span-2 bg-[#233835] rounded-3xl border border-[#3A5551] p-4 sm:p-6 flex flex-col justify-between relative overflow-hidden shadow-inner min-h-[380px]">
            {/* Lưới chấm ma trận thế giới */}
            <svg className="absolute inset-0 w-full h-full opacity-15 pointer-events-none" viewBox="0 0 800 450">
              <pattern id="bigDotPattern" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1.5" fill="#C9942C" />
              </pattern>
              <rect width="800" height="450" fill="url(#bigDotPattern)" />
            </svg>

            {/* Lược đồ thế giới chi tiết */}
            <svg className="w-full h-full min-h-[300px]" viewBox="0 0 750 360" fill="none">
              {/* Lục địa Á - Âu & Phi */}
              <path
                d="M320,120 Q360,70 430,90 Q500,80 560,110 Q620,140 590,200 Q530,230 460,210 Q400,240 350,190 Z"
                fill="#2E4A45"
                stroke="#3E615B"
                strokeWidth="1.5"
              />
              {/* Lục địa Châu Mỹ */}
              <path
                d="M90,90 Q140,70 170,110 Q190,160 160,200 Q180,260 150,310 Q120,320 100,270 Q80,210 70,150 Z"
                fill="#2E4A45"
                stroke="#3E615B"
                strokeWidth="1.5"
              />
              {/* Châu Úc */}
              <path
                d="M580,240 Q630,230 650,260 Q640,300 600,300 Q560,280 580,240 Z"
                fill="#2E4A45"
                stroke="#3E615B"
                strokeWidth="1.5"
              />

              {/* Đường Xích Đạo (Equator 0°) */}
              <line x1="20" y1="180" x2="730" y2="180" stroke="#FFFFFF" strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />
              <text x="30" y="174" fill="#A8C4BF" fontSize="10" fontWeight="bold">XÍCH ĐẠO 0°</text>

              {/* Kinh tuyến gốc 0° Greenwich */}
              <line x1="380" y1="30" x2="380" y2="330" stroke="#FFFFFF" strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />
              <text x="385" y="45" fill="#A8C4BF" fontSize="10" fontWeight="bold">KINH TUYẾN GỐC 0°</text>

              {/* Tuyến hiển thị theo từng Chuyên Đề */}
              {selectedRoute === 'global' && (
                <>
                  {/* Tuyến Vòng Quanh Trái Đất */}
                  <path
                    d="M485,150 C420,80 320,60 210,120 C100,180 80,240 220,220 C360,200 480,240 540,160 Z"
                    stroke="#C9942C"
                    strokeWidth="3.5"
                    strokeDasharray="8 6"
                    fill="none"
                  />
                  {/* Điểm Greenwich */}
                  <circle cx="380" cy="115" r="5" fill="#C9942C" stroke="#FFFFFF" strokeWidth="2" />
                  <text x="380" y="105" textAnchor="middle" fill="#F0D59D" fontSize="11" fontWeight="bold">
                    Greenwich (0°)
                  </text>
                </>
              )}

              {selectedRoute === 'monsoon' && (
                <>
                  {/* Mũi tên Gió Mùa Đông Bắc (từ cao áp Siberi qua vịnh Bắc Bộ vào Tây Bắc) */}
                  <path
                    d="M510,80 Q490,120 480,145"
                    stroke="#60A5FA"
                    strokeWidth="4"
                    strokeDasharray="6 4"
                    fill="none"
                    markerEnd="url(#arrowBlue)"
                  />
                  <text x="525" y="100" fill="#93C5FD" fontSize="10" fontWeight="bold">Gió Đông Bắc (Lạnh khô/ẩm)</text>

                  {/* Mũi tên Gió Mùa Tây Nam (từ Ấn Độ Dương / Vịnh Bengal vào Tây Bắc) */}
                  <path
                    d="M440,220 Q460,180 478,155"
                    stroke="#F59E0B"
                    strokeWidth="4"
                    strokeDasharray="6 4"
                    fill="none"
                    markerEnd="url(#arrowYellow)"
                  />
                  <text x="380" y="225" fill="#FDE68A" fontSize="10" fontWeight="bold">Gió Tây Nam (Nóng ẩm mưa nhiều)</text>
                </>
              )}

              {selectedRoute === 'current' && (
                <>
                  {/* Dòng biển nóng (Màu đỏ cam) */}
                  <path
                    d="M490,200 Q540,180 560,140"
                    stroke="#EF4444"
                    strokeWidth="3.5"
                    fill="none"
                  />
                  <text x="565" y="160" fill="#FCA5A5" fontSize="10" fontWeight="bold">Dòng Nóng Kuroshio</text>

                  {/* Dòng biển lạnh (Màu xanh dương) */}
                  <path
                    d="M570,80 Q560,110 545,130"
                    stroke="#38BDF8"
                    strokeWidth="3.5"
                    fill="none"
                  />
                  <text x="575" y="100" fill="#BAE6FD" fontSize="10" fontWeight="bold">Dòng Lạnh Oyashio</text>
                </>
              )}

              {/* Tọa độ PTDTBT TH&THCS Sì Lở Lầu (Điểm mốc nhấp nháy phát sóng radar - Gợi ý 1) */}
              <g transform="translate(480, 148)">
                {/* Vòng tròn Radar nhấp nháy (Ping Ripple Effect) */}
                <circle cx="0" cy="0" r="14" fill="#C9942C" opacity="0.35" className="animate-ping" />
                <circle cx="0" cy="0" r="7" fill="#C9942C" opacity="0.6" />
                <circle cx="0" cy="0" r="4.5" fill="#EF4444" stroke="#FFFFFF" strokeWidth="1.5" />

                {/* Nhãn điểm trường Sì Lở Lầu */}
                <rect x="-65" y="-30" width="130" height="20" rx="10" fill="#162220" stroke="#C9942C" strokeWidth="1" />
                <text x="0" y="-16" textAnchor="middle" fill="#FFFFFF" fontSize="9.5" fontWeight="bold">
                  📍 TH&THCS Sì Lở Lầu
                </text>
              </g>

              <defs>
                <marker id="arrowBlue" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#60A5FA" />
                </marker>
                <marker id="arrowYellow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#F59E0B" />
                </marker>
              </defs>
            </svg>

            {/* Bảng chú giải nhanh góc dưới bản đồ */}
            <div className="flex items-center justify-between gap-4 pt-3 border-t border-white/10 text-xs text-[#A8C4BF] flex-wrap">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444] inline-block animate-pulse"></span>
                  <span>Tọa độ Trường Sì Lở Lầu: <strong>22°34'B, 103°28'Đ</strong></span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-4 h-0.5 bg-[#C9942C] inline-block border-t border-dashed"></span>
                  <span>Tuyến thám hiểm vàng Ochre</span>
                </span>
              </div>
              <span className="text-[11px] text-[#F0D59D] font-bold">
                Mẹo: Nhấn nút Esc hoặc dấu X góc trên để đóng
              </span>
            </div>
          </div>

          {/* Cột Kiến thức Bài giảng & Thao tác câu hỏi kiểm tra trên lớp (Chiếm 1 phần) */}
          <div className="space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-[#233835] border border-[#3A5551] space-y-2">
                <div className="text-[11px] font-black text-[#F0D59D] uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#C9942C]" />
                  NỘI DUNG TRỌNG TÂM BÀI HỌC
                </div>
                {selectedRoute === 'global' && (
                  <div className="space-y-2 text-xs text-[#D1E3DF] leading-relaxed">
                    <p>• <strong>Kinh tuyến gốc (0°):</strong> Đi qua đài thiên văn Greenwich ở thủ đô Luân Đôn (Anh).</p>
                    <p>• <strong>Vĩ tuyến gốc (0°):</strong> Chính là đường Xích Đạo, chia Trái Đất thành Bán cầu Bắc và Bán cầu Nam.</p>
                    <p>• <strong>Vị trí Việt Nam:</strong> Hoàn toàn nằm ở Bán cầu Bắc và Bán cầu Đông thuộc vùng nội chí tuyến nhiệt đới gió mùa.</p>
                  </div>
                )}
                {selectedRoute === 'monsoon' && (
                  <div className="space-y-2 text-xs text-[#D1E3DF] leading-relaxed">
                    <p>• <strong>Gió Mùa Mùa Đông:</strong> Hướng Đông Bắc, hoạt động từ tháng 11 đến tháng 4 năm sau, làm miền Bắc và vùng cao Sì Lở Lầu có mùa đông giá rét, khô hanh vào đầu mùa và mưa phùn vào cuối mùa.</p>
                    <p>• <strong>Gió Mùa Mùa Hạ:</strong> Hướng Tây Nam, xuất phát từ áp cao chí tuyến, gây mưa lớn cho cả nước vào mùa hè.</p>
                  </div>
                )}
                {selectedRoute === 'current' && (
                  <div className="space-y-2 text-xs text-[#D1E3DF] leading-relaxed">
                    <p>• <strong>Dòng biển nóng:</strong> Chảy từ xích đạo lên các vĩ độ cao, mang lại khí hậu ấm và ẩm cho các vùng duyên hải ven biển.</p>
                    <p>• <strong>Dòng biển lạnh:</strong> Chảy từ vùng cực và vĩ độ cao về phía xích đạo, thường tạo ra các hoang mạc khô cằn ven bờ.</p>
                  </div>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-[#233835] border border-[#3A5551] space-y-2 text-xs">
                <div className="text-[11px] font-black text-[#A8C4BF] uppercase tracking-wider">
                  ỨNG DỤNG TẠI ĐỊA PHƯƠNG SÌ LỞ LẦU
                </div>
                <p className="text-[#C0D6D2] leading-relaxed">
                  Trường PTDTBT TH&THCS Sì Lở Lầu nằm ở độ cao trên 1.500m so với mực nước biển, chịu ảnh hưởng mạnh của gió mùa Đông Bắc và địa hình đồi núi hiểm trở Tây Bắc, tạo nên tiểu vùng khí hậu á nhiệt đới núi cao đặc thù.
                </p>
              </div>
            </div>

            {/* Nút hành động nhanh trên máy chiếu */}
            <div className="space-y-2 pt-2 border-t border-white/10">
              <a
                href="/live"
                onClick={() => playSoftClick()}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#C9942C] hover:bg-[#B58022] active:scale-95 text-white font-black text-xs transition cursor-pointer shadow-lg"
              >
                <Sparkles className="w-4 h-4" />
                <span>Chiếu Câu Hỏi Đố Nhanh Cho Cả Lớp 🚀</span>
              </a>
              <button
                type="button"
                onClick={() => {
                  playSoftClick();
                  onClose();
                }}
                className="w-full py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition cursor-pointer"
              >
                Trở Về Bàn Làm Việc
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
