import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Palette,
  Highlighter,
  Superscript,
  Subscript,
  Sparkles,
  ChevronDown,
  RemoveFormatting,
  Undo2,
  Redo2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Type,
} from 'lucide-react';
import { COMMON_GEO_SYMBOLS } from '../../lib/geoSymbolFormatter';

interface RichTextEditorProps {
  value: string;
  onChange: (htmlValue: string) => void;
  placeholder?: string;
  minHeight?: string;
  className?: string;
  required?: boolean;
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

const FONT_SIZES = [
  { label: 'Nhỏ (12px)', value: '2' },
  { label: 'Chuẩn (14px)', value: '3' },
  { label: 'Lớn (16px)', value: '4' },
  { label: 'Rất lớn (18px)', value: '5' },
  { label: 'Tiêu đề (20px)', value: '6' },
];

/**
 * Chuyển đổi Markdown và xuống dòng cũ thành HTML chuẩn để hiển thị trong WYSIWYG editor
 */
function normalizeToHtml(val: string): string {
  if (!val) return '';
  // Nếu đã là HTML có thẻ p/div/span/br/b/i/u thì giữ nguyên
  if (/<[a-z][\s\S]*>/i.test(val)) {
    return val;
  }
  // Chuyển đổi markdown thô thành thẻ HTML
  let html = val
    .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
    .replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, '<i>$1</i>')
    .replace(/__(.*?)__/g, '<u>$1</u>')
    .replace(/\n/g, '<br>');
  return html;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Nhập nội dung...',
  minHeight = '110px',
  className = '',
  required = false,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalUpdate = useRef(false);

  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [showSymbolPicker, setShowSymbolPicker] = useState(false);
  const [showFontSizePicker, setShowFontSizePicker] = useState(false);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.rich-editor-toolbar-dropdown')) {
        setShowColorPicker(false);
        setShowHighlightPicker(false);
        setShowSymbolPicker(false);
        setShowFontSizePicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Đồng bộ giá trị từ props vào contentEditable (khi load ban đầu hoặc thay đổi từ bên ngoài)
  useEffect(() => {
    if (editorRef.current && !isInternalUpdate.current) {
      const currentHtml = editorRef.current.innerHTML;
      const targetHtml = normalizeToHtml(value);
      if (currentHtml !== targetHtml) {
        editorRef.current.innerHTML = targetHtml;
      }
    }
    isInternalUpdate.current = false;
  }, [value]);

  // Cập nhật lên component cha khi người dùng gõ
  const handleInput = useCallback(() => {
    if (editorRef.current) {
      isInternalUpdate.current = true;
      const html = editorRef.current.innerHTML;
      // Nếu chỉ có <br> hoặc rỗng thì truyền chuỗi rỗng
      if (html === '<br>' || html === '<div><br></div>' || html.trim() === '') {
        onChange('');
      } else {
        onChange(html);
      }
    }
  }, [onChange]);

  // Thực thi lệnh định dạng trực tiếp trên văn bản được bôi đen (WYSIWYG)
  const execCmd = (command: string, valueArg: string | undefined = undefined) => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
    try {
      document.execCommand(command, false, valueArg);
    } catch (e) {
      console.warn('execCommand failed:', e);
    }
    handleInput();
  };

  // 1. Phím tắt B, I, U, Z, Y
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.ctrlKey || e.metaKey) {
      const key = e.key.toLowerCase();
      if (key === 'b') {
        e.preventDefault();
        execCmd('bold');
      } else if (key === 'i') {
        e.preventDefault();
        execCmd('italic');
      } else if (key === 'u') {
        e.preventDefault();
        execCmd('underline');
      } else if (key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          execCmd('redo');
        } else {
          execCmd('undo');
        }
      } else if (key === 'y') {
        e.preventDefault();
        execCmd('redo');
      }
    }
  };

  // Các lệnh định dạng
  const handleBold = () => execCmd('bold');
  const handleItalic = () => execCmd('italic');
  const handleUnderline = () => execCmd('underline');
  const handleSuperscript = () => execCmd('superscript');
  const handleSubscript = () => execCmd('subscript');
  const handleRemoveFormat = () => execCmd('removeFormat');

  // Hoàn tác & Làm lại
  const handleUndo = () => execCmd('undo');
  const handleRedo = () => execCmd('redo');

  // Căn lề
  const handleAlignLeft = () => execCmd('justifyLeft');
  const handleAlignCenter = () => execCmd('justifyCenter');
  const handleAlignRight = () => execCmd('justifyRight');
  const handleAlignJustify = () => execCmd('justifyFull');

  // Danh sách
  const handleUnorderedList = () => execCmd('insertUnorderedList');
  const handleOrderedList = () => execCmd('insertOrderedList');

  // Cỡ chữ
  const handleFontSize = (sizeVal: string) => {
    execCmd('fontSize', sizeVal);
    setShowFontSizePicker(false);
  };

  // Đổi màu chữ
  const handleTextColor = (colorHex: string) => {
    execCmd('foreColor', colorHex);
    setShowColorPicker(false);
  };

  // Tô màu nền highlight
  const handleHighlight = (colorHex: string) => {
    const success = document.execCommand('hiliteColor', false, colorHex);
    if (!success) {
      document.execCommand('backColor', false, colorHex);
    }
    handleInput();
    setShowHighlightPicker(false);
  };

  // Chèn ký hiệu Địa lí & Toán học
  const handleInsertSymbol = (sym: string) => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
    document.execCommand('insertText', false, sym);
    handleInput();
    setShowSymbolPicker(false);
  };

  return (
    <div className={`rounded-2xl border border-slate-300 bg-white overflow-hidden shadow-2xs focus-within:ring-2 focus-within:ring-ocean-500 focus-within:border-ocean-500 transition ${className}`}>
      {/* THANH CÔNG CỤ SOẠN THẢO TRỰC QUAN (FULL WYSIWYG TOOLBAR) */}
      <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-50 border-b border-slate-200 select-none">
        
        {/* Nhóm 1: Hoàn tác & Làm lại (Ctrl+Z / Ctrl+Y) */}
        <div className="flex items-center gap-0.5 bg-white p-0.5 rounded-xl border border-slate-200 shadow-2xs">
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              handleUndo();
            }}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-700 transition cursor-pointer"
            title="Hoàn tác (Ctrl+Z)"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              handleRedo();
            }}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-700 transition cursor-pointer"
            title="Làm lại (Ctrl+Y)"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Nhóm 2: Định dạng Chữ cơ bản (B / I / U) */}
        <div className="flex items-center gap-0.5 bg-white p-0.5 rounded-xl border border-slate-200 shadow-2xs">
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              handleBold();
            }}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-700 font-bold transition cursor-pointer"
            title="In Đậm (Ctrl+B)"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              handleItalic();
            }}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-700 transition cursor-pointer"
            title="In Nghiêng (Ctrl+I)"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              handleUnderline();
            }}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-700 transition cursor-pointer"
            title="Gạch Chân (Ctrl+U)"
          >
            <Underline className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Nhóm 3: Cỡ Chữ (A+/A-) */}
        <div className="relative rich-editor-toolbar-dropdown">
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              setShowFontSizePicker(!showFontSizePicker);
              setShowColorPicker(false);
              setShowHighlightPicker(false);
              setShowSymbolPicker(false);
            }}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
              showFontSizePicker
                ? 'bg-ocean-100 border-ocean-300 text-ocean-800'
                : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700 shadow-2xs'
            }`}
            title="Kích thước cỡ chữ"
          >
            <Type className="w-3.5 h-3.5 text-ocean-600" />
            <span className="text-[11px] hidden sm:inline">Cỡ chữ</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showFontSizePicker && (
            <div className="absolute top-full left-0 mt-1.5 z-40 p-1.5 bg-white rounded-2xl shadow-2xl border border-slate-200 w-36 space-y-0.5 animate-in fade-in">
              {FONT_SIZES.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleFontSize(f.value);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-slate-100 text-xs font-bold text-slate-700 transition cursor-pointer"
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Nhóm 4: Đổi Màu Chữ */}
        <div className="relative rich-editor-toolbar-dropdown">
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              setShowColorPicker(!showColorPicker);
              setShowHighlightPicker(false);
              setShowSymbolPicker(false);
              setShowFontSizePicker(false);
            }}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
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
            <div className="absolute top-full left-0 mt-1.5 z-40 p-2 bg-white rounded-2xl shadow-2xl border border-slate-200 grid grid-cols-3 gap-1.5 w-48 animate-in fade-in">
              {TEXT_COLORS.map((c) => (
                <button
                  key={c.color}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleTextColor(c.color);
                  }}
                  className="flex items-center gap-1.5 p-1.5 rounded-xl hover:bg-slate-100 text-left transition cursor-pointer"
                  title={c.label}
                >
                  <span className={`w-3.5 h-3.5 rounded-full shrink-0 ${c.bg}`} />
                  <span className="text-[10px] font-bold text-slate-700 truncate">{c.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Nhóm 5: Tô Màu Nền (Highlight) */}
        <div className="relative rich-editor-toolbar-dropdown">
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              setShowHighlightPicker(!showHighlightPicker);
              setShowColorPicker(false);
              setShowSymbolPicker(false);
              setShowFontSizePicker(false);
            }}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
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
            <div className="absolute top-full left-0 mt-1.5 z-40 p-2 bg-white rounded-2xl shadow-2xl border border-slate-200 grid grid-cols-2 gap-1.5 w-52 animate-in fade-in">
              {HIGHLIGHT_COLORS.map((h) => (
                <button
                  key={h.color}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleHighlight(h.color);
                  }}
                  className="flex items-center gap-1.5 p-1.5 rounded-xl hover:bg-slate-100 text-left transition cursor-pointer"
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

        {/* Nhóm 6: Căn Lề Văn Bản (Trái, Giữa, Phải, Đều) */}
        <div className="flex items-center gap-0.5 bg-white p-0.5 rounded-xl border border-slate-200 shadow-2xs">
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              handleAlignLeft();
            }}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-700 transition cursor-pointer"
            title="Căn Lề Trái"
          >
            <AlignLeft className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              handleAlignCenter();
            }}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-700 transition cursor-pointer"
            title="Căn Giữa (Thơ lục bát, Tiêu đề)"
          >
            <AlignCenter className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              handleAlignRight();
            }}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-700 transition cursor-pointer"
            title="Căn Lề Phải"
          >
            <AlignRight className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              handleAlignJustify();
            }}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-700 transition cursor-pointer"
            title="Căn Đều Hai Bên"
          >
            <AlignJustify className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Nhóm 7: Danh Sách Đầu Dòng & Đánh Số */}
        <div className="flex items-center gap-0.5 bg-white p-0.5 rounded-xl border border-slate-200 shadow-2xs">
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              handleUnorderedList();
            }}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-700 transition cursor-pointer"
            title="Danh sách dấu chấm đầu dòng (•)"
          >
            <List className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              handleOrderedList();
            }}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-700 transition cursor-pointer"
            title="Danh sách đánh số thứ tự (1. 2. 3.)"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Nhóm 8: Mũ trên, Chỉ số dưới & Xóa định dạng */}
        <div className="flex items-center gap-0.5 bg-white p-0.5 rounded-xl border border-slate-200 shadow-2xs">
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              handleSuperscript();
            }}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-700 transition cursor-pointer"
            title="Mũ trên (km², m³)"
          >
            <Superscript className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              handleSubscript();
            }}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-700 transition cursor-pointer"
            title="Chỉ số dưới (H₂O, CO₂)"
          >
            <Subscript className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              handleRemoveFormat();
            }}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-red-600 transition cursor-pointer"
            title="Xóa định dạng về chữ thường"
          >
            <RemoveFormatting className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Nhóm 9: Ký Hiệu Địa Lí Nhanh */}
        <div className="relative rich-editor-toolbar-dropdown">
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              setShowSymbolPicker(!showSymbolPicker);
              setShowColorPicker(false);
              setShowHighlightPicker(false);
              setShowFontSizePicker(false);
            }}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer ${
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
            <div className="absolute top-full right-0 sm:left-0 mt-1.5 z-40 p-3 bg-white rounded-2xl shadow-2xl border border-slate-200 w-64 animate-in fade-in space-y-2">
              <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Ký hiệu Địa lí thông dụng:
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                {COMMON_GEO_SYMBOLS.map((s) => (
                  <button
                    key={s.symbol}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleInsertSymbol(s.symbol);
                    }}
                    className="p-1.5 rounded-xl bg-slate-50 hover:bg-teal-50 hover:text-teal-700 border border-slate-200 text-xs font-black transition cursor-pointer flex flex-col items-center"
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
      </div>

      {/* KHUNG SOẠN THẢO TRỰC TIẾP (CONTENT EDITABLE WYSIWYG) */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onBlur={handleInput}
        onKeyDown={handleKeyDown}
        style={{ minHeight }}
        data-placeholder={placeholder}
        className="p-4 text-xs sm:text-sm font-normal text-slate-900 focus:outline-none leading-relaxed overflow-y-auto rich-editor-content"
      />

      <style>{`
        .rich-editor-content:empty:before {
          content: attr(data-placeholder);
          color: #94a3b8;
          pointer-events: none;
        }
        .rich-editor-content font[size="2"] { font-size: 12px; }
        .rich-editor-content font[size="3"] { font-size: 14px; }
        .rich-editor-content font[size="4"] { font-size: 16px; }
        .rich-editor-content font[size="5"] { font-size: 18px; }
        .rich-editor-content font[size="6"] { font-size: 20px; font-weight: bold; }
        .rich-editor-content ul { list-style-type: disc; padding-left: 1.5rem; margin: 0.5rem 0; }
        .rich-editor-content ol { list-style-type: decimal; padding-left: 1.5rem; margin: 0.5rem 0; }
      `}</style>
    </div>
  );
};
