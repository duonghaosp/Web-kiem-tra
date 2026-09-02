import React, { useState, useRef, useEffect } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Palette,
  Highlighter,
  Superscript,
  Subscript,
  Sparkles,
  Eye,
  EyeOff,
  ChevronDown,
} from 'lucide-react';
import { COMMON_GEO_SYMBOLS } from '../../lib/geoSymbolFormatter';

interface TextFormatToolbarProps {
  textareaRef?: React.RefObject<HTMLTextAreaElement | HTMLInputElement | null>;
  value: string;
  onChange: (newValue: string) => void;
  className?: string;
  compact?: boolean;
  showSymbols?: boolean;
  placeholderText?: string;
}

const TEXT_COLORS = [
  { label: 'Đỏ đậm', color: '#dc2626', bg: 'bg-red-600' },
  { label: 'Xanh dương', color: '#2563eb', bg: 'bg-blue-600' },
  { label: 'Xanh lục', color: '#16a34a', bg: 'bg-emerald-600' },
  { label: 'Cam tươi', color: '#ea580c', bg: 'bg-orange-600' },
  { label: 'Tím', color: '#9333ea', bg: 'bg-purple-600' },
  { label: 'Xám đen', color: '#1e293b', bg: 'bg-slate-800' },
];

const HIGHLIGHT_COLORS = [
  { label: 'Vàng dạ quang', color: '#fef08a', border: '#facc15', bg: 'bg-yellow-200' },
  { label: 'Xanh lá non', color: '#bbf7d0', border: '#86efac', bg: 'bg-green-200' },
  { label: 'Xanh lơ nhạt', color: '#bae6fd', border: '#7dd3fc', bg: 'bg-sky-200' },
  { label: 'Hồng phấn', color: '#fbcfe8', border: '#f472b6', bg: 'bg-pink-200' },
  { label: 'Cam pastel', color: '#fed7aa', border: '#fdba74', bg: 'bg-orange-200' },
  { label: 'Tím nhạt', color: '#e9d5ff', border: '#d8b4fe', bg: 'bg-purple-200' },
];

export const TextFormatToolbar: React.FC<TextFormatToolbarProps> = ({
  textareaRef,
  value,
  onChange,
  className = '',
  compact = false,
  showSymbols = true,
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [showSymbolPicker, setShowSymbolPicker] = useState(false);

  const colorRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const symbolRef = useRef<HTMLDivElement>(null);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (colorRef.current && !colorRef.current.contains(e.target as Node)) {
        setShowColorPicker(false);
      }
      if (highlightRef.current && !highlightRef.current.contains(e.target as Node)) {
        setShowHighlightPicker(false);
      }
      if (symbolRef.current && !symbolRef.current.contains(e.target as Node)) {
        setShowSymbolPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /**
   * Bọc văn bản đang chọn (hoặc chèn tag vào vị trí con trỏ)
   */
  const applyWrap = (prefix: string, suffix: string, defaultText: string = 'văn bản') => {
    const el = textareaRef?.current;
    if (!el) {
      onChange(value + `${prefix}${defaultText}${suffix}`);
      return;
    }

    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    const selected = value.substring(start, end);
    const content = selected || defaultText;

    const replacement = `${prefix}${content}${suffix}`;
    const nextValue = value.substring(0, start) + replacement + value.substring(end);
    onChange(nextValue);

    // Đặt lại con trỏ chuột chính xác sau khi chèn
    setTimeout(() => {
      el.focus();
      const newCursorPos = start + prefix.length + content.length + suffix.length;
      el.setSelectionRange(newCursorPos, newCursorPos);
    }, 10);
  };

  // In đậm
  const handleBold = () => applyWrap('**', '**', 'văn bản in đậm');

  // In nghiêng
  const handleItalic = () => applyWrap('*', '*', 'văn bản in nghiêng');

  // Gạch chân
  const handleUnderline = () => applyWrap('<u>', '</u>', 'văn bản gạch chân');

  // Mũ trên (superscript)
  const handleSuperscript = () => applyWrap('<sup>', '</sup>', '2');

  // Chỉ số dưới (subscript)
  const handleSubscript = () => applyWrap('<sub>', '</sub>', '2');

  // Đổi màu chữ
  const handleTextColor = (colorHex: string) => {
    applyWrap(`<span style="color: ${colorHex}">`, '</span>', 'chữ đổi màu');
    setShowColorPicker(false);
  };

  // Tô màu nền highlight
  const handleHighlight = (colorHex: string) => {
    applyWrap(`<mark style="background-color: ${colorHex}">`, '</mark>', 'văn bản tô màu');
    setShowHighlightPicker(false);
  };

  // Chèn ký hiệu nhanh
  const handleInsertSymbol = (sym: string) => {
    applyWrap('', sym, '');
    setShowSymbolPicker(false);
  };

  return (
    <div
      className={`flex flex-wrap items-center gap-1 p-1.5 bg-slate-100/90 border border-slate-200 rounded-xl select-none ${className}`}
    >
      {/* 1. Nhóm Định Dạng Chữ Cơ Bản */}
      <div className="flex items-center gap-0.5 bg-white p-0.5 rounded-lg border border-slate-200 shadow-2xs">
        <button
          type="button"
          onClick={handleBold}
          className="p-1.5 rounded-md hover:bg-slate-100 text-slate-700 font-bold transition cursor-pointer"
          title="In Đậm (Ctrl+B) - **chữ**"
        >
          <Bold className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={handleItalic}
          className="p-1.5 rounded-md hover:bg-slate-100 text-slate-700 transition cursor-pointer"
          title="In Nghiêng (Ctrl+I) - *chữ*"
        >
          <Italic className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={handleUnderline}
          className="p-1.5 rounded-md hover:bg-slate-100 text-slate-700 transition cursor-pointer"
          title="Gạch Chân (Ctrl+U) - <u>chữ</u>"
        >
          <Underline className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 2. Nhóm Đổi Màu Chữ (Text Color) */}
      <div className="relative" ref={colorRef}>
        <button
          type="button"
          onClick={() => {
            setShowColorPicker(!showColorPicker);
            setShowHighlightPicker(false);
            setShowSymbolPicker(false);
          }}
          className={`flex items-center gap-1 px-2 py-1.5 rounded-lg border text-xs font-bold transition cursor-pointer ${
            showColorPicker
              ? 'bg-ocean-100 border-ocean-300 text-ocean-800'
              : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700 shadow-2xs'
          }`}
          title="Đổi màu chữ"
        >
          <Palette className="w-3.5 h-3.5 text-rose-500" />
          <span className="text-[11px] hidden sm:inline">Màu chữ</span>
          <ChevronDown className="w-3 h-3 text-slate-400" />
        </button>

        {showColorPicker && (
          <div className="absolute top-full left-0 mt-1 z-30 p-2 bg-white rounded-xl shadow-xl border border-slate-200 grid grid-cols-3 gap-1.5 w-44 animate-in fade-in">
            {TEXT_COLORS.map((c) => (
              <button
                key={c.color}
                type="button"
                onClick={() => handleTextColor(c.color)}
                className="flex items-center gap-1.5 p-1.5 rounded-lg hover:bg-slate-100 text-left transition cursor-pointer"
                title={c.label}
              >
                <span className={`w-3.5 h-3.5 rounded-full shrink-0 ${c.bg}`} />
                <span className="text-[10px] font-bold text-slate-700 truncate">{c.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 3. Nhóm Tô Màu Nền / Highlight */}
      <div className="relative" ref={highlightRef}>
        <button
          type="button"
          onClick={() => {
            setShowHighlightPicker(!showHighlightPicker);
            setShowColorPicker(false);
            setShowSymbolPicker(false);
          }}
          className={`flex items-center gap-1 px-2 py-1.5 rounded-lg border text-xs font-bold transition cursor-pointer ${
            showHighlightPicker
              ? 'bg-amber-100 border-amber-300 text-amber-800'
              : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700 shadow-2xs'
          }`}
          title="Tô màu nền (Highlight)"
        >
          <Highlighter className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-[11px] hidden sm:inline">Tô màu</span>
          <ChevronDown className="w-3 h-3 text-slate-400" />
        </button>

        {showHighlightPicker && (
          <div className="absolute top-full left-0 mt-1 z-30 p-2 bg-white rounded-xl shadow-xl border border-slate-200 grid grid-cols-2 gap-1.5 w-48 animate-in fade-in">
            {HIGHLIGHT_COLORS.map((h) => (
              <button
                key={h.color}
                type="button"
                onClick={() => handleHighlight(h.color)}
                className="flex items-center gap-1.5 p-1.5 rounded-lg hover:bg-slate-100 text-left transition cursor-pointer"
                title={h.label}
              >
                <span
                  className="w-3.5 h-3.5 rounded-md shrink-0 border"
                  style={{ backgroundColor: h.color, borderColor: h.border }}
                />
                <span className="text-[10px] font-bold text-slate-700 truncate">{h.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 4. Mũ Trên & Chỉ Số Dưới */}
      <div className="flex items-center gap-0.5 bg-white p-0.5 rounded-lg border border-slate-200 shadow-2xs">
        <button
          type="button"
          onClick={handleSuperscript}
          className="p-1.5 rounded-md hover:bg-slate-100 text-slate-700 transition cursor-pointer"
          title="Mũ trên (km², m³) - <sup>2</sup>"
        >
          <Superscript className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={handleSubscript}
          className="p-1.5 rounded-md hover:bg-slate-100 text-slate-700 transition cursor-pointer"
          title="Chỉ số dưới (H₂O, CO₂) - <sub>2</sub>"
        >
          <Subscript className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 5. Ký Hiệu Địa Lí Nhanh */}
      {showSymbols && (
        <div className="relative" ref={symbolRef}>
          <button
            type="button"
            onClick={() => {
              setShowSymbolPicker(!showSymbolPicker);
              setShowColorPicker(false);
              setShowHighlightPicker(false);
            }}
            className={`flex items-center gap-1 px-2 py-1.5 rounded-lg border text-xs font-bold transition cursor-pointer ${
              showSymbolPicker
                ? 'bg-teal-100 border-teal-300 text-teal-800'
                : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700 shadow-2xs'
            }`}
            title="Chèn ký hiệu Địa lí & Toán học"
          >
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span className="text-[11px] hidden sm:inline">Ký hiệu</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showSymbolPicker && (
            <div className="absolute top-full right-0 mt-1 z-30 p-2.5 bg-white rounded-xl shadow-xl border border-slate-200 w-56 animate-in fade-in space-y-2">
              <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Ký hiệu Địa lí thông dụng:
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                {COMMON_GEO_SYMBOLS.map((s) => (
                  <button
                    key={s.symbol}
                    type="button"
                    onClick={() => handleInsertSymbol(s.symbol)}
                    className="p-1.5 rounded-lg bg-slate-50 hover:bg-teal-50 hover:text-teal-700 border border-slate-200 text-xs font-black transition cursor-pointer flex flex-col items-center"
                    title={s.label}
                  >
                    <span>{s.symbol}</span>
                    <span className="text-[8px] text-slate-400 font-normal truncate max-w-full">
                      {s.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
