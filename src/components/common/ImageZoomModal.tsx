import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ZoomIn, ZoomOut, RotateCw, Maximize2, X, Move, Undo2 } from 'lucide-react';

interface ImageZoomModalProps {
  imageUrl: string;
  caption?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ImageZoomModal: React.FC<ImageZoomModalProps> = ({
  imageUrl,
  caption,
  isOpen,
  onClose,
}) => {
  const [scale, setScale] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Đặt lại trạng thái khi mở modal mới
  useEffect(() => {
    if (isOpen) {
      setScale(1);
      setRotation(0);
      setPosition({ x: 0, y: 0 });
    }
  }, [isOpen, imageUrl]);

  // Phím tắt ESC để đóng, +/- để zoom
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === '+' || e.key === '=') {
        handleZoomIn();
      } else if (e.key === '-' || e.key === '_') {
        handleZoomOut();
      } else if (e.key === '0') {
        handleReset();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.25, 4));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleReset = () => {
    setScale(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  // Zoom bằng con lăn chuột (Wheel Zoom)
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.15 : 0.15;
    setScale((prev) => {
      const next = Math.min(Math.max(prev + delta, 0.5), 4);
      return Math.round(next * 100) / 100;
    });
  }, []);

  // Xử lý kéo rê chuột (Pan / Drag)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Hỗ trợ cảm ứng trên điện thoại / tablet
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      dragStartRef.current = {
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPosition({
      x: e.touches[0].clientX - dragStartRef.current.x,
      y: e.touches[0].clientY - dragStartRef.current.y,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-md flex flex-col justify-between p-3 sm:p-6 animate-in fade-in duration-200 select-none"
      onClick={onClose}
    >
      {/* THANH ĐIỀU KHIỂN PHÍA TRÊN (HEADER & TOOLBAR) */}
      <div
        className="w-full max-w-6xl mx-auto flex items-center justify-between gap-3 pb-3 border-b border-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 min-w-0 pr-2">
          <div className="w-8 h-8 rounded-xl bg-ocean-600/30 text-ocean-400 border border-ocean-500/30 flex items-center justify-center shrink-0">
            <Maximize2 className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h4 className="text-white text-xs sm:text-sm font-bold truncate">
              {caption || 'Kính Lúp Soi Bản Đồ & Biểu Đồ Địa Lí'}
            </h4>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Lăn con lăn chuột hoặc bấm nút để phóng to • Kéo giữ chuột để di chuyển bản đồ
            </p>
          </div>
        </div>

        {/* CÁC NÚT TÁC VỤ: PHÓNG TO, THU NHỎ, XOAY, ĐẶT LẠI, ĐÓNG */}
        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 p-1 rounded-2xl shadow-xl shrink-0">
          <span className="px-2.5 py-1 text-xs font-mono font-black text-ocean-300 min-w-[52px] text-center">
            {Math.round(scale * 100)}%
          </span>

          <button
            type="button"
            onClick={handleZoomIn}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Phóng to (+)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleZoomOut}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Thu nhỏ (-)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleRotate}
            className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Xoay 90 độ"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="p-2 rounded-xl text-slate-300 hover:text-amber-400 hover:bg-slate-800 transition cursor-pointer"
            title="Đặt lại 100% (Phím 0)"
          >
            <Undo2 className="w-4 h-4" />
          </button>

          <div className="w-[1px] h-5 bg-slate-700 mx-0.5" />

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-950/40 transition cursor-pointer"
            title="Đóng (ESC)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* KHUNG HIỂN THỊ HÌNH ẢNH TOÀN MÀN HÌNH CÓ KHẢ NĂNG KÉO RÊ & ZOOM */}
      <div
        ref={containerRef}
        className="flex-1 w-full max-w-6xl mx-auto my-3 overflow-hidden rounded-3xl bg-slate-900/60 border border-slate-800 relative flex items-center justify-center cursor-grab active:cursor-grabbing"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
            transition: isDragging ? 'none' : 'transform 0.15s ease-out',
            transformOrigin: 'center center',
          }}
          className="max-w-full max-h-full flex items-center justify-center pointer-events-none"
        >
          <img
            src={imageUrl}
            alt={caption || 'Tư liệu phóng to'}
            className="max-h-[78vh] w-auto max-w-full object-contain rounded-xl shadow-2xl pointer-events-none select-none"
            draggable={false}
          />
        </div>

        {/* Gợi ý tương tác góc dưới */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-800 text-[11px] text-slate-300 flex items-center gap-2 pointer-events-none">
          <Move className="w-3.5 h-3.5 text-ocean-400" />
          <span>Kéo rê chuột để di chuyển • Lăn chuột để phóng to/thu nhỏ</span>
        </div>
      </div>

      {/* FOOTER CHÚ THÍCH */}
      {caption && (
        <div
          className="w-full max-w-4xl mx-auto text-center py-2 text-xs sm:text-sm font-semibold text-amber-300 italic truncate px-4"
          onClick={(e) => e.stopPropagation()}
        >
          {caption}
        </div>
      )}
    </div>
  );
};
