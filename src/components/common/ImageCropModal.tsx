import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Crop,
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  Check,
  X,
  RefreshCw,
  Maximize2,
  Sparkles,
} from 'lucide-react';
import { compressImage } from '../../lib/imageCompressor';

interface ImageCropModalProps {
  isOpen: boolean;
  imageUrl: string;
  imageTitle?: string;
  onApply: (croppedImageUrl: string, stats?: { originalSize?: number; newSize?: number }) => void;
  onClose: () => void;
}

type AspectRatioType = 'free' | '4:3' | '16:9' | '1:1';

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  isOpen,
  imageUrl,
  imageTitle = 'Chỉnh sửa & Cắt ảnh',
  onApply,
  onClose,
}) => {
  if (!isOpen || !imageUrl) return null;

  const [rotation, setRotation] = useState<number>(0);
  const [flipH, setFlipH] = useState<boolean>(false);
  const [flipV, setFlipV] = useState<boolean>(false);
  const [aspectRatio, setAspectRatio] = useState<AspectRatioType>('free');

  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Vùng crop tính theo tỷ lệ hiển thị trên màn hình
  const [cropRect, setCropRect] = useState<{ x: number; y: number; w: number; h: number }>({
    x: 0,
    y: 0,
    w: 100,
    h: 100,
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Kích thước hiển thị thực tế của ảnh trong container
  const [displayDim, setDisplayDim] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  // Trạng thái kéo thả
  const dragInfo = useRef<{
    isDragging: boolean;
    mode: 'move' | 'nw' | 'ne' | 'se' | 'sw' | 'n' | 's' | 'e' | 'w';
    startX: number;
    startY: number;
    initialRect: { x: number; y: number; w: number; h: number };
  }>({
    isDragging: false,
    mode: 'move',
    startX: 0,
    startY: 0,
    initialRect: { x: 0, y: 0, w: 0, h: 0 },
  });

  // Reset khi mở modal mới
  useEffect(() => {
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setAspectRatio('free');
    setImageLoaded(false);
  }, [imageUrl, isOpen]);

  // Cập nhật khung crop mặc định khi ảnh tải xong hoặc đổi góc xoay
  const initializeCropBox = useCallback((displayWidth: number, displayHeight: number, ratio: AspectRatioType) => {
    let targetW = displayWidth * 0.9;
    let targetH = displayHeight * 0.9;

    if (ratio === '4:3') {
      if (targetW / targetH > 4 / 3) {
        targetW = targetH * (4 / 3);
      } else {
        targetH = targetW / (4 / 3);
      }
    } else if (ratio === '16:9') {
      if (targetW / targetH > 16 / 9) {
        targetW = targetH * (16 / 9);
      } else {
        targetH = targetW / (16 / 9);
      }
    } else if (ratio === '1:1') {
      const minSide = Math.min(targetW, targetH);
      targetW = minSide;
      targetH = minSide;
    }

    const startX = (displayWidth - targetW) / 2;
    const startY = (displayHeight - targetH) / 2;

    setCropRect({
      x: Math.max(0, Math.round(startX)),
      y: Math.max(0, Math.round(startY)),
      w: Math.round(targetW),
      h: Math.round(targetH),
    });
  }, []);

  // Đo kích thước hiển thị ảnh
  const handleImageLoad = () => {
    if (!imageRef.current) return;
    const { clientWidth, clientHeight } = imageRef.current;
    setDisplayDim({ width: clientWidth, height: clientHeight });
    initializeCropBox(clientWidth, clientHeight, aspectRatio);
    setImageLoaded(true);
  };

  // Đổi tỷ lệ cắt
  const handleAspectRatioChange = (ratio: AspectRatioType) => {
    setAspectRatio(ratio);
    if (displayDim.width > 0 && displayDim.height > 0) {
      initializeCropBox(displayDim.width, displayDim.height, ratio);
    }
  };

  // Xoay 90 độ
  const handleRotate = (direction: 'cw' | 'ccw') => {
    setRotation((prev) => {
      const next = direction === 'cw' ? (prev + 90) % 360 : (prev - 90 + 360) % 360;
      return next;
    });
  };

  // Bắt đầu kéo
  const handleMouseDown = (
    e: React.MouseEvent | React.TouchEvent,
    mode: 'move' | 'nw' | 'ne' | 'se' | 'sw' | 'n' | 's' | 'e' | 'w'
  ) => {
    e.stopPropagation();
    e.preventDefault();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    dragInfo.current = {
      isDragging: true,
      mode,
      startX: clientX,
      startY: clientY,
      initialRect: { ...cropRect },
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleMouseUp);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragInfo.current.isDragging) return;
    updateCropRect(e.clientX, e.clientY);
  }, [displayDim]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!dragInfo.current.isDragging) return;
    e.preventDefault();
    updateCropRect(e.touches[0].clientX, e.touches[0].clientY);
  }, [displayDim]);

  const updateCropRect = (clientX: number, clientY: number) => {
    const { mode, startX, startY, initialRect } = dragInfo.current;
    const dx = clientX - startX;
    const dy = clientY - startY;

    const maxW = displayDim.width;
    const maxH = displayDim.height;
    const minSize = 40;

    let newX = initialRect.x;
    let newY = initialRect.y;
    let newW = initialRect.w;
    let newH = initialRect.h;

    if (mode === 'move') {
      newX = Math.max(0, Math.min(maxW - initialRect.w, initialRect.x + dx));
      newY = Math.max(0, Math.min(maxH - initialRect.h, initialRect.y + dy));
    } else {
      if (mode.includes('e')) {
        newW = Math.max(minSize, Math.min(maxW - initialRect.x, initialRect.w + dx));
      }
      if (mode.includes('s')) {
        newH = Math.max(minSize, Math.min(maxH - initialRect.y, initialRect.h + dy));
      }
      if (mode.includes('w')) {
        const potentialW = initialRect.w - dx;
        if (potentialW >= minSize) {
          const potentialX = initialRect.x + dx;
          if (potentialX >= 0) {
            newX = potentialX;
            newW = potentialW;
          }
        }
      }
      if (mode.includes('n')) {
        const potentialH = initialRect.h - dy;
        if (potentialH >= minSize) {
          const potentialY = initialRect.y + dy;
          if (potentialY >= 0) {
            newY = potentialY;
            newH = potentialH;
          }
        }
      }
    }

    setCropRect({
      x: Math.round(newX),
      y: Math.round(newY),
      w: Math.round(newW),
      h: Math.round(newH),
    });
  };

  const handleMouseUp = useCallback(() => {
    dragInfo.current.isDragging = false;
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
    window.removeEventListener('touchmove', handleTouchMove);
    window.removeEventListener('touchend', handleMouseUp);
  }, [handleMouseMove, handleTouchMove]);

  // Áp dụng cắt và nén ảnh
  const handleApplyCrop = async () => {
    if (!imageRef.current) return;
    setIsProcessing(true);

    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageUrl;
      });

      // 1. Tạo Canvas xoay & lật ảnh theo góc đã chọn
      const is90or270 = rotation === 90 || rotation === 270;
      const rotCanvas = document.createElement('canvas');
      rotCanvas.width = is90or270 ? img.naturalHeight : img.naturalWidth;
      rotCanvas.height = is90or270 ? img.naturalWidth : img.naturalHeight;

      const rotCtx = rotCanvas.getContext('2d');
      if (!rotCtx) throw new Error('Không thể tạo context canvas');

      rotCtx.translate(rotCanvas.width / 2, rotCanvas.height / 2);
      rotCtx.rotate((rotation * Math.PI) / 180);
      rotCtx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
      rotCtx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2);

      // 2. Chuyển đổi tọa độ crop từ kích thước hiển thị sang kích thước thực
      const scaleX = rotCanvas.width / displayDim.width;
      const scaleY = rotCanvas.height / displayDim.height;

      const actualCropX = Math.max(0, Math.round(cropRect.x * scaleX));
      const actualCropY = Math.max(0, Math.round(cropRect.y * scaleY));
      const actualCropW = Math.min(rotCanvas.width - actualCropX, Math.round(cropRect.w * scaleX));
      const actualCropH = Math.min(rotCanvas.height - actualCropY, Math.round(cropRect.h * scaleY));

      // 3. Cắt vùng ảnh tương ứng
      const cropCanvas = document.createElement('canvas');
      cropCanvas.width = Math.max(10, actualCropW);
      cropCanvas.height = Math.max(10, actualCropH);

      const cropCtx = cropCanvas.getContext('2d');
      if (!cropCtx) throw new Error('Không thể tạo context crop canvas');

      cropCtx.fillStyle = '#ffffff';
      cropCtx.fillRect(0, 0, cropCanvas.width, cropCanvas.height);
      cropCtx.drawImage(
        rotCanvas,
        actualCropX,
        actualCropY,
        actualCropW,
        actualCropH,
        0,
        0,
        cropCanvas.width,
        cropCanvas.height
      );

      // 4. Xuất ra blob rồi chuyển qua bộ nén tối ưu
      const blob = await new Promise<Blob | null>((resolve) =>
        cropCanvas.toBlob(resolve, 'image/jpeg', 0.9)
      );

      if (!blob) throw new Error('Không thể xuất dữ liệu ảnh sau khi cắt');

      const file = new File([blob], 'cropped_image.jpg', { type: 'image/jpeg' });
      const compressedDataUrl = await compressImage(file, 1200, 1200, 0.85);

      onApply(compressedDataUrl, {
        originalSize: imageUrl.length,
        newSize: compressedDataUrl.length,
      });
      onClose();
    } catch (err) {
      console.error('Lỗi cắt ảnh:', err);
      alert('Đã xảy ra lỗi khi cắt ảnh. Vui lòng thử lại!');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-4xl w-full flex flex-col max-h-[95vh] shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:px-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-ocean-100 text-ocean-700 flex items-center justify-center">
              <Crop className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-sm sm:text-base">
                {imageTitle}
              </h3>
              <p className="text-[11px] text-slate-500">
                Kéo viền ô vuông để chọn vùng bản đồ/biểu đồ cần lấy, xoay hoặc lật theo ý muốn
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200/60 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thanh công cụ Chỉnh sửa (Xoay, Lật, Tỷ lệ) */}
        <div className="px-4 sm:px-6 py-2.5 bg-white border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Nhóm Xoay & Lật */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => handleRotate('ccw')}
              className="px-2.5 py-1.5 rounded-lg font-bold text-slate-700 hover:bg-white hover:shadow-xs transition flex items-center gap-1 cursor-pointer"
              title="Xoay 90 độ sang trái"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Xoay Trái</span>
            </button>

            <button
              type="button"
              onClick={() => handleRotate('cw')}
              className="px-2.5 py-1.5 rounded-lg font-bold text-slate-700 hover:bg-white hover:shadow-xs transition flex items-center gap-1 cursor-pointer"
              title="Xoay 90 độ sang phải"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Xoay Phải</span>
            </button>

            <div className="w-px h-4 bg-slate-200 mx-1" />

            <button
              type="button"
              onClick={() => setFlipH(!flipH)}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer ${
                flipH ? 'bg-ocean-600 text-white shadow-xs' : 'text-slate-700 hover:bg-white hover:shadow-xs'
              }`}
              title="Lật ngang đối xứng"
            >
              <FlipHorizontal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Lật Ngang</span>
            </button>

            <button
              type="button"
              onClick={() => setFlipV(!flipV)}
              className={`px-2.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer ${
                flipV ? 'bg-ocean-600 text-white shadow-xs' : 'text-slate-700 hover:bg-white hover:shadow-xs'
              }`}
              title="Lật dọc"
            >
              <FlipVertical className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Lật Dọc</span>
            </button>
          </div>

          {/* Nhóm Tỷ lệ cắt */}
          <div className="flex items-center gap-1">
            <span className="text-slate-500 font-bold hidden md:inline">Tỷ lệ:</span>
            {(['free', '4:3', '16:9', '1:1'] as AspectRatioType[]).map((ratio) => (
              <button
                key={ratio}
                type="button"
                onClick={() => handleAspectRatioChange(ratio)}
                className={`px-2.5 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                  aspectRatio === ratio
                    ? 'bg-ocean-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {ratio === 'free' ? 'Tự Do' : ratio}
              </button>
            ))}

            <button
              type="button"
              onClick={() => {
                setRotation(0);
                setFlipH(false);
                setFlipV(false);
                setAspectRatio('free');
                if (displayDim.width > 0 && displayDim.height > 0) {
                  initializeCropBox(displayDim.width, displayDim.height, 'free');
                }
              }}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition cursor-pointer ml-1"
              title="Khôi phục góc xoay và kích thước ban đầu"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Khung tương tác cắt ảnh chính */}
        <div className="flex-1 p-4 sm:p-6 bg-slate-950/95 flex items-center justify-center overflow-auto min-h-[320px] max-h-[58vh]">
          <div
            ref={containerRef}
            className="relative inline-block select-none shadow-2xl rounded-xl overflow-hidden"
            style={{
              transform: `rotate(${rotation}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`,
              transition: 'transform 0.2s ease',
            }}
          >
            <img
              ref={imageRef}
              src={imageUrl}
              alt="Cắt ảnh"
              onLoad={handleImageLoad}
              className="max-h-[50vh] max-w-[80vw] object-contain block pointer-events-none"
            />

            {/* Lớp phủ vùng cắt (Overlay & Handles) */}
            {imageLoaded && (
              <div
                className="absolute inset-0 pointer-events-auto"
                style={{
                  transform: `scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`,
                }}
              >
                {/* 4 mảng tối xung quanh vùng crop */}
                {/* Top */}
                <div
                  className="absolute left-0 right-0 top-0 bg-black/60 backdrop-blur-[0.5px]"
                  style={{ height: `${cropRect.y}px` }}
                />
                {/* Bottom */}
                <div
                  className="absolute left-0 right-0 bottom-0 bg-black/60 backdrop-blur-[0.5px]"
                  style={{ height: `${displayDim.height - (cropRect.y + cropRect.h)}px` }}
                />
                {/* Left */}
                <div
                  className="absolute left-0 bg-black/60 backdrop-blur-[0.5px]"
                  style={{
                    top: `${cropRect.y}px`,
                    height: `${cropRect.h}px`,
                    width: `${cropRect.x}px`,
                  }}
                />
                {/* Right */}
                <div
                  className="absolute right-0 bg-black/60 backdrop-blur-[0.5px]"
                  style={{
                    top: `${cropRect.y}px`,
                    height: `${cropRect.h}px`,
                    width: `${displayDim.width - (cropRect.x + cropRect.w)}px`,
                  }}
                />

                {/* Khung viền vùng crop */}
                <div
                  className="absolute border-2 border-white border-dashed shadow-2xl cursor-move flex items-center justify-center group"
                  style={{
                    left: `${cropRect.x}px`,
                    top: `${cropRect.y}px`,
                    width: `${cropRect.w}px`,
                    height: `${cropRect.h}px`,
                    boxShadow: '0 0 0 1px rgba(0, 0, 0, 0.4), inset 0 0 20px rgba(255, 255, 255, 0.1)',
                  }}
                  onMouseDown={(e) => handleMouseDown(e, 'move')}
                  onTouchStart={(e) => handleMouseDown(e, 'move')}
                >
                  {/* Lưới 3x3 hỗ trợ căn chỉnh bố cục bản đồ */}
                  <div className="w-full h-full grid grid-cols-3 grid-rows-3 pointer-events-none opacity-40 group-hover:opacity-70 transition">
                    <div className="border-r border-b border-white/60" />
                    <div className="border-r border-b border-white/60" />
                    <div className="border-b border-white/60" />
                    <div className="border-r border-b border-white/60" />
                    <div className="border-r border-b border-white/60" />
                    <div className="border-b border-white/60" />
                    <div className="border-r border-white/60" />
                    <div className="border-r border-white/60" />
                    <div />
                  </div>

                  {/* 4 tay cầm chỉnh góc (Corner Handles) */}
                  <div
                    className="absolute -top-1.5 -left-1.5 w-4 h-4 bg-white border-2 border-ocean-600 rounded-xs cursor-nwse-resize shadow-md"
                    onMouseDown={(e) => handleMouseDown(e, 'nw')}
                    onTouchStart={(e) => handleMouseDown(e, 'nw')}
                  />
                  <div
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-white border-2 border-ocean-600 rounded-xs cursor-nesw-resize shadow-md"
                    onMouseDown={(e) => handleMouseDown(e, 'ne')}
                    onTouchStart={(e) => handleMouseDown(e, 'ne')}
                  />
                  <div
                    className="absolute -bottom-1.5 -left-1.5 w-4 h-4 bg-white border-2 border-ocean-600 rounded-xs cursor-nesw-resize shadow-md"
                    onMouseDown={(e) => handleMouseDown(e, 'sw')}
                    onTouchStart={(e) => handleMouseDown(e, 'sw')}
                  />
                  <div
                    className="absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-white border-2 border-ocean-600 rounded-xs cursor-nwse-resize shadow-md"
                    onMouseDown={(e) => handleMouseDown(e, 'se')}
                    onTouchStart={(e) => handleMouseDown(e, 'se')}
                  />

                  {/* 4 tay cầm viền cạnh (Edge Handles) */}
                  <div
                    className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-2 bg-white border border-ocean-600 rounded-full cursor-ns-resize"
                    onMouseDown={(e) => handleMouseDown(e, 'n')}
                    onTouchStart={(e) => handleMouseDown(e, 'n')}
                  />
                  <div
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-6 h-2 bg-white border border-ocean-600 rounded-full cursor-ns-resize"
                    onMouseDown={(e) => handleMouseDown(e, 's')}
                    onTouchStart={(e) => handleMouseDown(e, 's')}
                  />
                  <div
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-2 h-6 bg-white border border-ocean-600 rounded-full cursor-ew-resize"
                    onMouseDown={(e) => handleMouseDown(e, 'w')}
                    onTouchStart={(e) => handleMouseDown(e, 'w')}
                  />
                  <div
                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-2 h-6 bg-white border border-ocean-600 rounded-full cursor-ew-resize"
                    onMouseDown={(e) => handleMouseDown(e, 'e')}
                    onTouchStart={(e) => handleMouseDown(e, 'e')}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer & Nút Áp dụng */}
        <div className="p-4 sm:px-6 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 font-medium flex items-center gap-2">
            <span className="bg-slate-200/80 px-2 py-0.5 rounded-md text-slate-700 font-bold">
              Kích thước chọn: {cropRect.w} × {cropRect.h} px
            </span>
            {rotation !== 0 && (
              <span className="text-ocean-700 font-bold">Góc xoay: {rotation}°</span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-white transition cursor-pointer"
              disabled={isProcessing}
            >
              Hủy Bỏ
            </button>

            <button
              type="button"
              onClick={handleApplyCrop}
              disabled={isProcessing || !imageLoaded}
              className="flex-1 sm:flex-none px-5 py-2.5 bg-gradient-to-r from-ocean-600 to-teal-600 hover:from-ocean-700 hover:to-teal-700 active:scale-95 disabled:opacity-50 text-white text-xs font-black rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Đang xử lý & nén ảnh...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Áp Dụng Cắt & Tối Ưu Hóa</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
