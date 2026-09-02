import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, Copy, Check, Download, Maximize2, X, ExternalLink, ShieldCheck } from 'lucide-react';
import { Assignment } from '../../types/database';

interface AssignmentQrModalProps {
  assignment: Assignment | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AssignmentQrModal: React.FC<AssignmentQrModalProps> = ({
  assignment,
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [isProjectorMode, setIsProjectorMode] = useState(false);

  if (!isOpen || !assignment) return null;

  const examUrl = `${window.location.origin}/take-exam/${assignment.id}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(examUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadQr = () => {
    const svg = document.getElementById('assignment-qr-svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width + 40;
      canvas.height = img.height + 40;
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 20, 20);
        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `QR_${assignment.title.replace(/\s+/g, '_')}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      }
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
      <div
        className={`bg-white rounded-3xl shadow-2xl border border-slate-100 transition-all duration-300 overflow-y-auto ${
          isProjectorMode
            ? 'max-w-3xl w-full p-6 sm:p-10 text-center space-y-6'
            : 'max-w-lg w-full p-5 sm:p-7 space-y-5'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <QrCode className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h3 className="font-black text-slate-900 text-base">
                Mã QR & Đường Link Giao Bài
              </h3>
              <p className="text-xs text-slate-500 font-medium line-clamp-1">
                {assignment.title}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsProjectorMode(!isProjectorMode)}
              className="p-2 text-slate-400 hover:text-purple-700 rounded-xl hover:bg-purple-50 transition cursor-pointer"
              title={isProjectorMode ? 'Thu nhỏ' : 'Chiếu toàn màn hình cho lớp'}
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Thông tin bài kiểm tra */}
        <div className="p-3 bg-purple-50/70 rounded-2xl border border-purple-100 text-xs text-purple-950 flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="font-bold">Thời gian:</span> {assignment.duration_minutes || 15} phút •{' '}
            <span className="font-bold">Đối tượng:</span>{' '}
            {assignment.target_ids?.join(', ') || 'Cả khối'}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-bold bg-emerald-100/80 px-2.5 py-0.5 rounded-full border border-emerald-300">
            <ShieldCheck className="w-3.5 h-3.5" />
            Bắt buộc học sinh đăng nhập
          </div>
        </div>

        {/* Khung chứa mã QR */}
        <div className="flex flex-col items-center justify-center py-2 space-y-3">
          <div className="p-4 bg-white rounded-3xl shadow-md border-2 border-purple-200 inline-block ring-4 ring-purple-50">
            <QRCodeSVG
              id="assignment-qr-svg"
              value={examUrl}
              size={isProjectorMode ? 300 : 200}
              level="H"
              includeMargin={true}
            />
          </div>

          <p className="text-xs text-slate-500 text-center max-w-sm leading-relaxed">
            📱 Học sinh dùng <strong>Zalo</strong> hoặc <strong>Camera điện thoại</strong> quét mã để vào đăng nhập mã số và làm bài ngay!
          </p>
        </div>

        {/* Khung sao chép Link */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700">
            Hoặc gửi đường link trực tiếp cho học sinh / nhóm Zalo:
          </label>
          <div className="flex items-center gap-2 p-1.5 bg-slate-50 border border-slate-200 rounded-xl">
            <input
              type="text"
              readOnly
              value={examUrl}
              className="bg-transparent flex-1 px-2 text-slate-700 font-mono text-xs outline-none select-all"
            />
            <button
              type="button"
              onClick={handleCopy}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-xs cursor-pointer ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-ocean-600 hover:bg-ocean-700 text-white'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Đã Chép
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Sao Chép Link
                </>
              )}
            </button>
          </div>
        </div>

        {/* Nút tải ảnh & Đóng */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={handleDownloadQr}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl text-xs font-bold border border-purple-200 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Tải Ảnh Mã QR (PNG)
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <a
              href={examUrl}
              target="_blank"
              rel="noreferrer"
              className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-2 text-slate-600 hover:text-slate-900 text-xs font-semibold hover:bg-slate-100 rounded-xl transition"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Mở Thử Link
            </a>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
