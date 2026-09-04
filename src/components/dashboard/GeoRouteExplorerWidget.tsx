import React, { useState } from 'react';
import { Compass, Navigation, Sparkles, Maximize2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { playSoftClick, playSwitchTab } from '../../utils/soundEffects';
import { GeoRoutePresentationModal } from './GeoRoutePresentationModal';

interface RouteOption {
  id: 'global' | 'monsoon' | 'current';
  name: string;
  from: string;
  to: string;
  distance: string;
  description: string;
  fromLabel: string;
  toLabel: string;
}

const ROUTE_OPTIONS: RouteOption[] = [
  {
    id: 'global',
    name: 'Vòng Quanh Trái Đất',
    from: 'HÀ NỘI (VN)',
    to: 'GREENWICH (UK)',
    distance: '40,075 KM • XÍCH ĐẠO',
    description: 'Hành trình thám hiểm vĩ tuyến 0° và kinh tuyến gốc nối liền Đông - Tây bán cầu.',
    fromLabel: 'Sì Lở Lầu',
    toLabel: 'Greenwich',
  },
  {
    id: 'monsoon',
    name: 'Tuyến Gió Mùa',
    from: 'XÍCH ĐẠO NAM',
    to: 'TÂY BẮC (VN)',
    distance: 'GIÓ TÂY NAM & ĐÔNG BẮC',
    description: 'Luồng gió mùa mang theo hơi ẩm nhiệt đới định hình khí hậu và mùa màng Việt Nam.',
    fromLabel: 'Ấn Độ Dương',
    toLabel: 'Tây Bắc, VN',
  },
  {
    id: 'current',
    name: 'Hải Lưu Đại Dương',
    from: 'DÒNG NÓNG',
    to: 'DÒNG LẠNH',
    distance: 'THÁI BÌNH DƯƠNG',
    description: 'Hệ thống tuần hoàn hải lưu điều hòa nhiệt độ và thời tiết khắp các châu lục.',
    fromLabel: 'Dòng Kuroshio',
    toLabel: 'Dòng Oyashio',
  },
];

export const GeoRouteExplorerWidget: React.FC = () => {
  const [selectedRouteId, setSelectedRouteId] = useState<'global' | 'monsoon' | 'current'>('global');
  const [durationRange, setDurationRange] = useState<number>(15);
  const [isPresentationOpen, setIsPresentationOpen] = useState<boolean>(false);

  const activeRoute = ROUTE_OPTIONS.find((r) => r.id === selectedRouteId) || ROUTE_OPTIONS[0];

  return (
    <>
      <div className="bg-[#2D4441] rounded-3xl p-5 sm:p-6 text-white border border-[#3A5551] shadow-xl space-y-4 relative overflow-hidden">
        {/* Vầng sáng vàng kim mờ nghệ thuật */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-[#C9942C]/10 rounded-full blur-2xl pointer-events-none" />

        {/* 1. Header Tuyến hành trình (FROM - TO) + Nút Phóng to Chiếu lớp (Gợi ý 3) */}
        <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3">
          <div>
            <div className="text-[10px] text-[#A8C4BF] font-black uppercase tracking-wider">ĐIỂM XUẤT PHÁT</div>
            <div className="text-sm font-black text-white tracking-wide flex items-center gap-1">
              <Navigation className="w-3.5 h-3.5 text-[#C9942C]" />
              <span>{activeRoute.from}</span>
            </div>
          </div>

          <div className="flex flex-col items-center">
            {/* Nút Mở Chế Độ Trình Chiếu Toàn Màn Hình Giảng Dạy */}
            <button
              type="button"
              onClick={() => {
                playSoftClick();
                setIsPresentationOpen(true);
              }}
              className="flex items-center gap-1 text-[9px] font-black px-2.5 py-1 rounded-full bg-white/10 hover:bg-[#C9942C] text-[#F0D59D] hover:text-white uppercase tracking-wider border border-white/15 transition cursor-pointer active:scale-95 shadow-xs"
              title="Phóng to toàn màn hình máy chiếu để giảng dạy trên lớp"
            >
              <Maximize2 className="w-3 h-3" />
              <span>Chiếu Lớp</span>
            </button>
            <div className="w-12 h-0.5 bg-gradient-to-r from-transparent via-[#C9942C] to-transparent mt-1" />
          </div>

          <div className="text-right">
            <div className="text-[10px] text-[#A8C4BF] font-black uppercase tracking-wider">ĐÍCH ĐẾN KHÁM PHÁ</div>
            <div className="text-sm font-black text-white tracking-wide flex items-center justify-end gap-1">
              <Compass className="w-3.5 h-3.5 text-[#C9942C]" />
              <span>{activeRoute.to}</span>
            </div>
          </div>
        </div>

        {/* 2. Bản đồ thế giới Dot-Matrix & Điểm Sì Lở Lầu phát sóng Radar (Gợi ý 1) */}
        <div className="relative h-36 rounded-2xl bg-[#233835]/90 border border-[#3A5551] p-2 flex items-center justify-center overflow-hidden">
          {/* Lưới chấm bản đồ thế giới giả lập */}
          <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none" viewBox="0 0 400 160">
            <pattern id="dotPattern" x="0" y="0" width="12" height="12" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="#C9942C" />
            </pattern>
            <rect width="400" height="160" fill="url(#dotPattern)" />
          </svg>

          {/* Bản đồ vector lục địa */}
          <svg className="w-full h-full" viewBox="0 0 360 140" fill="none">
            {/* Lược đồ lục địa mờ */}
            <path
              d="M40,50 Q60,30 90,45 Q120,60 100,85 Q80,105 50,90 Z"
              fill="#34544F"
              opacity="0.6"
            />
            <path
              d="M170,40 Q210,35 230,55 Q250,75 220,100 Q190,110 175,90 Z"
              fill="#34544F"
              opacity="0.6"
            />
            <path
              d="M260,65 Q300,50 330,70 Q340,100 310,115 Q280,110 270,85 Z"
              fill="#34544F"
              opacity="0.6"
            />

            {/* Đường hành trình cong màu vàng Ochre */}
            <path
              d="M85,85 C140,25 220,30 280,75"
              stroke="#C9942C"
              strokeWidth="2.5"
              strokeDasharray="5 4"
              fill="none"
            />

            {/* Điểm xuất phát Sì Lở Lầu nhấp nháy Radar (Gợi ý 1) */}
            <g transform="translate(85, 85)">
              <circle cx="0" cy="0" r="11" fill="#C9942C" opacity="0.45" className="animate-ping" />
              <circle cx="0" cy="0" r="6" fill="#C9942C" opacity="0.8" />
              <circle cx="0" cy="0" r="3.5" fill="#EF4444" stroke="#FFFFFF" strokeWidth="1.5" />
              <text x="0" y="18" textAnchor="middle" fill="#F0D59D" fontSize="9" fontWeight="bold">
                {activeRoute.fromLabel} 📍
              </text>
            </g>

            {/* Điểm đích đến */}
            <g transform="translate(280, 75)">
              <circle cx="0" cy="0" r="4.5" fill="#C9942C" stroke="#FFFFFF" strokeWidth="2" />
              <text x="0" y="18" textAnchor="middle" fill="#D5E4E1" fontSize="9" fontWeight="bold">
                {activeRoute.toLabel}
              </text>
            </g>

            {/* Biểu tượng máy bay / thám hiểm ở đỉnh đường cong */}
            <g transform="translate(182, 33) rotate(22)">
              <circle cx="0" cy="0" r="10" fill="#2D4441" stroke="#C9942C" strokeWidth="1.5" />
              <path
                d="M-4,0 L4,0 M0,-4 L0,4 M2,-2 L-2,2"
                stroke="#F0D59D"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </g>
          </svg>
        </div>

        {/* 3. Bộ lọc viên thuốc (Capsule Filters) có âm thanh click êm ái (Gợi ý 2) */}
        <div className="flex items-center justify-between gap-1.5 p-1 rounded-2xl bg-[#233835] border border-[#3A5551]">
          {ROUTE_OPTIONS.map((route) => (
            <button
              key={route.id}
              type="button"
              onClick={() => {
                playSwitchTab();
                setSelectedRouteId(route.id);
              }}
              className={`flex-1 py-1.5 px-2 rounded-xl text-[10px] font-black transition cursor-pointer text-center truncate ${
                selectedRouteId === route.id
                  ? 'bg-[#C9942C] text-white shadow-sm'
                  : 'text-[#9EBAB5] hover:text-white hover:bg-white/5'
              }`}
            >
              {route.name}
            </button>
          ))}
        </div>

        {/* Mô tả tuyến đường */}
        <p className="text-[11px] text-[#C0D6D2] leading-relaxed italic bg-white/5 p-2.5 rounded-xl border border-white/10">
          💡 {activeRoute.description}
        </p>

        {/* 4. Thanh trượt chọn thời lượng / tiêu chuẩn bài tập có âm thanh mượt mà */}
        <div className="space-y-2 pt-1 border-t border-white/10">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[#9EBAB5] font-black uppercase tracking-wider">TIÊU CHUẨN THỜI GIAN</span>
            <span className="text-[#F0D59D] font-black">{durationRange} Phút</span>
          </div>

          {/* Custom Slider với núm vàng Ochre */}
          <div className="relative flex items-center">
            <input
              type="range"
              min={5}
              max={45}
              step={5}
              value={durationRange}
              onChange={(e) => {
                playSoftClick();
                setDurationRange(Number(e.target.value));
              }}
              className="w-full h-1.5 bg-[#233835] rounded-lg appearance-none cursor-pointer accent-[#C9942C]"
            />
          </div>

          <div className="flex items-center justify-between text-[10px] text-[#8FAEA8] font-bold">
            <span className="px-2 py-0.5 rounded-md bg-[#233835]">5 Phút (Đố nhanh)</span>
            <span className="px-2 py-0.5 rounded-md bg-[#233835]">15 Phút (15 câu)</span>
            <span className="px-2 py-0.5 rounded-md bg-[#233835]">45 Phút (Giữa kỳ)</span>
          </div>
        </div>

        {/* Nút Khởi động Đấu trường theo thời lượng */}
        <Link
          to="/live"
          onClick={() => playSoftClick()}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full bg-[#C9942C] hover:bg-[#B58022] active:scale-95 text-white text-xs font-black transition cursor-pointer shadow-md"
        >
          <Sparkles className="w-4 h-4" />
          <span>Khởi Động Đấu Trường Địa Lí ({durationRange}p)</span>
        </Link>
      </div>

      {/* Modal Trình Chiếu Toàn Màn Hình Khi Giảng Dạy Trên Lớp (Gợi ý 3) */}
      <GeoRoutePresentationModal
        isOpen={isPresentationOpen}
        onClose={() => setIsPresentationOpen(false)}
        initialRouteId={selectedRouteId}
      />
    </>
  );
};
