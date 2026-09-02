import React, { useMemo } from 'react';
import { Question } from '../../types/database';
import { LatexRenderer } from '../common/LatexRenderer';
import { Edit3, CheckCircle2, XCircle, RotateCcw } from 'lucide-react';

interface FillBlankQuestionProps {
  question: Question;
  selectedAnswers: Record<string, string> | undefined;
  onAnswerChange: (answers: Record<string, string>) => void;
  disabled?: boolean;
  showCorrect?: boolean;
}

// Hàm chuẩn hóa chuỗi đáp án (bỏ các tiền tố (1), (2), [1], dấu ngoặc, thẻ HTML)
const cleanAnswerText = (text: any): string => {
  if (!text) return '';
  return String(text)
    .replace(/<[^>]+>/g, '') // Bỏ thẻ HTML
    .replace(/^\s*\(\s*\d+\s*\)\s*/, '') // Bỏ tiền tố "(1) ", "(2) "
    .replace(/^\s*\[\s*\d+\s*\]\s*/, '') // Bỏ tiền tố "[1] "
    .replace(/^\s*\d+[\s:.\-–—)]+/, '') // Bỏ tiền tố "1. ", "1: "
    .trim();
};

export const FillBlankQuestion: React.FC<FillBlankQuestionProps> = ({
  question,
  selectedAnswers = {},
  onAnswerChange,
  disabled = false,
  showCorrect = false,
}) => {
  const content = question.content_json || {};
  const rawTemplate: string = content.template || content.question || question.title || '';
  const correctBlanks: Record<string, string[]> = question.correct_answer_json?.blank_answers || {};

  // 1. LÀM SẠCH VĂN BẢN CÂU HỎI ĐỂ HIỂN THỊ NGUYÊN VẸN TOÀN BỘ NỘI DUNG GIÁO VIÊN NHẬP
  const cleanDisplayTemplate = useMemo(() => {
    let text = rawTemplate;
    // Bỏ chuỗi rác [blank_1], [blank_2]... nếu có ở cuối
    text = text.replace(/\[blank_\w+\]/g, '').trim();
    // Bỏ các chuỗi style thừa
    text = text.replace(/--tw-[^;]+;?/g, '');
    return text;
  }, [rawTemplate]);

  // 2. TẬP HỢP TẤT CẢ CÁC CHỖ TRỐNG DO GIÁO VIÊN RA ĐỀ (1, 2, 3, 4...)
  const allBlankKeys = useMemo(() => {
    const keysSet = new Set<string>();

    // Lấy từ correct_answer_json.blank_answers
    Object.keys(correctBlanks).forEach((k) => keysSet.add(k));

    // Lấy từ content_json.blanks
    if (Array.isArray(content.blanks)) {
      content.blanks.forEach((b: any) => {
        if (b && b.id) keysSet.add(b.id);
      });
    }

    // Quét số thứ tự (1), (2), (3), (4) trong văn bản nếu database chưa có key
    if (keysSet.size === 0) {
      const parenMatches = rawTemplate.match(/\(\s*\d+\s*\)/g);
      if (parenMatches) {
        parenMatches.forEach((m) => {
          const num = m.replace(/\D/g, '');
          if (num) keysSet.add(`blank_${num}`);
        });
      }
    }

    if (keysSet.size === 0) {
      keysSet.add('blank_1');
    }

    return Array.from(keysSet).sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, ''), 10) || 0;
      const numB = parseInt(b.replace(/\D/g, ''), 10) || 0;
      return numA - numB;
    });
  }, [correctBlanks, content.blanks, rawTemplate]);

  // 3. KHO TỪ ĐÁP ÁN ĐỂ SỔ RA DANH SÁCH LỰA CHỌN
  const wordPool = useMemo(() => {
    const wordsSet = new Set<string>();

    // A. Lấy từ đáp án đúng của các chỗ trống (làm sạch bỏ tiền tố (1), (2)...)
    Object.values(correctBlanks).forEach((ansArr) => {
      const arr = Array.isArray(ansArr) ? ansArr : [ansArr];
      arr.forEach((w) => {
        const clean = cleanAnswerText(w);
        if (clean) wordsSet.add(clean);
      });
    });

    // B. Trích xuất từ các từ in nghiêng / đổi màu ở đề bài nếu có
    const italicMatches = rawTemplate.match(/<(?:em|i|span)[^>]*>(.*?)<\/(?:em|i|span)>/gi);
    if (italicMatches) {
      italicMatches.forEach((m) => {
        const plain = cleanAnswerText(m);
        if (plain && plain.length >= 2 && plain.length <= 50 && !plain.includes('--tw-') && !plain.includes('style=')) {
          plain.split(/\s{2,}|\t|•/g).forEach((chunk) => {
            const c = cleanAnswerText(chunk);
            if (c && c.length >= 2 && c.length <= 50) wordsSet.add(c);
          });
        }
      });
    }

    return Array.from(wordsSet);
  }, [rawTemplate, correctBlanks]);

  // 4. DANH SÁCH ĐÁP ÁN SỔ RA CHO TỪNG SỐ (TỰ ĐỘNG ẨN CÁC ĐÁP ÁN ĐÃ CHỌN Ở SỐ KHÁC)
  const getAvailableWordsForBlank = (blankId: string) => {
    const currentVal = cleanAnswerText(selectedAnswers[blankId] || '').toLowerCase();

    // Lấy các đáp án đã được chọn ở các ô khác
    const selectedByOthers = Object.entries(selectedAnswers)
      .filter(([id, val]) => id !== blankId && Boolean(val?.trim()))
      .map(([_, val]) => cleanAnswerText(val).toLowerCase());

    // Chỉ giữ lại đáp án của chính ô này HOẶC đáp án chưa được ai chọn
    return wordPool.filter((w) => {
      const wLower = cleanAnswerText(w).toLowerCase();
      if (wLower === currentVal) return true;
      return !selectedByOthers.includes(wLower);
    });
  };

  const handleInputChange = (blankId: string, val: string) => {
    if (disabled) return;
    onAnswerChange({
      ...selectedAnswers,
      [blankId]: val,
    });
  };

  const handleResetAll = () => {
    if (disabled) return;
    onAnswerChange({});
  };

  const filledCount = allBlankKeys.filter((k) => Boolean(selectedAnswers[k]?.trim())).length;

  return (
    <div className="space-y-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
      {/* 1. HIỂN THỊ TOÀN BỘ NỘI DUNG VĂN BẢN CÂU HỎI NGUYÊN VẸN */}
      <div className="p-4 sm:p-5 bg-slate-50/80 rounded-2xl border border-slate-200/90 leading-relaxed text-slate-800 text-sm sm:text-base font-medium">
        <LatexRenderer content={cleanDisplayTemplate} />
      </div>

      {/* 2. PHẦN ĐÁP ÁN ĐÁNH SỐ 1, 2, 3, 4... SỔ RA CÁC ĐÁP ÁN ĐỂ HỌC SINH CHỌN */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-ocean-100 text-ocean-700 flex items-center justify-center font-bold">
              <Edit3 className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold text-slate-900">
              Chọn đáp án cho {allBlankKeys.length} vị trí chỗ trống ({filledCount}/{allBlankKeys.length} vị trí đã chọn)
            </span>
          </div>

          {filledCount > 0 && !disabled && (
            <button
              type="button"
              onClick={handleResetAll}
              className="flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-red-600 px-2.5 py-1 bg-slate-100 hover:bg-red-50 rounded-lg border border-slate-200 transition cursor-pointer"
              title="Xóa toàn bộ các lựa chọn để chọn lại từ đầu"
            >
              <RotateCcw className="w-3 h-3" /> Chọn lại từ đầu
            </button>
          )}
        </div>

        {/* Danh sách các số (1), (2), (3), (4)... và menu sổ ra đáp án */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {allBlankKeys.map((blankId, bIdx) => {
            const numIndex = bIdx + 1;
            const currentVal = selectedAnswers[blankId] || selectedAnswers[String(numIndex)] || '';
            const rawAllowed = correctBlanks[blankId] || correctBlanks[String(numIndex)] || [];
            const validAnswers = (Array.isArray(rawAllowed) ? rawAllowed : [String(rawAllowed)]).map((v) =>
              cleanAnswerText(v).toLowerCase()
            );
            const isCorrect = validAnswers.includes(cleanAnswerText(currentVal).toLowerCase());
            const availableWords = getAvailableWordsForBlank(blankId);

            let borderStyle = 'border-slate-200 bg-white hover:border-ocean-400';
            if (currentVal) {
              borderStyle = 'border-ocean-500 bg-ocean-50/40 text-ocean-950 font-bold ring-1 ring-ocean-200';
            }

            if (showCorrect) {
              if (isCorrect) {
                borderStyle = 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold';
              } else {
                borderStyle = 'border-rose-500 bg-rose-50 text-rose-950 font-bold';
              }
            }

            return (
              <div
                key={blankId}
                className={`p-3 rounded-2xl border transition shadow-2xs flex items-center justify-between gap-3 ${borderStyle}`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className="w-7 h-7 rounded-xl bg-ocean-600 text-white text-xs font-black flex items-center justify-center shrink-0 shadow-2xs">
                    {numIndex}
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                      Vị trí ({numIndex}):
                    </div>

                    {/* Menu sổ ra danh sách đáp án */}
                    <select
                      disabled={disabled}
                      value={currentVal}
                      onChange={(e) => handleInputChange(blankId, e.target.value)}
                      className="w-full text-xs sm:text-sm font-bold text-slate-900 bg-transparent border-0 p-0 focus:ring-0 focus:outline-none cursor-pointer truncate"
                    >
                      <option value="" className="text-slate-400 font-normal">
                        -- Bấm vào đây để chọn đáp án ({numIndex}) --
                      </option>
                      {availableWords.map((word, wIdx) => (
                        <option key={wIdx} value={word} className="text-slate-900 font-bold py-1.5">
                          {word}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {showCorrect && (
                  <div className="shrink-0 text-right">
                    {isCorrect ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 text-xs font-bold bg-emerald-100/70 px-2 py-1 rounded-lg">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Đúng
                      </span>
                    ) : (
                      <div className="space-y-0.5">
                        <span className="inline-flex items-center gap-1 text-rose-700 text-xs font-bold bg-rose-100/70 px-2 py-0.5 rounded-lg">
                          <XCircle className="w-3.5 h-3.5" /> Sai
                        </span>
                        <div className="text-[11px] text-emerald-800 font-bold">
                          Đáp án đúng: {cleanAnswerText(rawAllowed[0] || '...')}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};


