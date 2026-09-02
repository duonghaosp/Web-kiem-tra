import React, { useMemo } from 'react';
import { Question } from '../../types/database';
import { LatexRenderer } from '../common/LatexRenderer';
import { ArrowRight, CheckCircle2, XCircle, RefreshCw, Sparkles } from 'lucide-react';

interface DragDropQuestionProps {
  question: Question;
  selectedAnswers: Record<string, string> | undefined;
  onAnswerChange: (answers: Record<string, string>) => void;
  disabled?: boolean;
  showCorrect?: boolean;
}

export const DragDropQuestion: React.FC<DragDropQuestionProps> = ({
  question,
  selectedAnswers = {},
  onAnswerChange,
  disabled = false,
  showCorrect = false,
}) => {
  const content = question.content_json || {};
  const pairs: Array<{ id: string; left: string; right: string }> = content.pairs || [];
  const correctPairs: Record<string, string> = question.correct_answer_json?.drag_pairs || {};

  // Danh sách các lựa chọn bên phải Cột B được XÁO TRỘN NGẪU NHIÊN để chống đoán mò theo thứ tự
  const rightOptions = useMemo(() => {
    const rawList = pairs.map((p) => p.right).filter(Boolean);
    if (rawList.length <= 1) return rawList;

    const shuffled = [...rawList];
    let seed = 0;
    const seedStr = question.id || 'geo_drag_drop_seed';
    for (let i = 0; i < seedStr.length; i++) {
      seed = (seed * 31 + seedStr.charCodeAt(i)) % 1000000007;
    }

    const pseudoRandom = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(pseudoRandom() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Nếu sau khi xáo trộn vẫn vô tình giống 100% thứ tự ban đầu thì xoay vòng
    const isIdentical = shuffled.every((val, idx) => val === rawList[idx]);
    if (isIdentical && shuffled.length > 1) {
      const first = shuffled.shift()!;
      shuffled.push(first);
    }

    return shuffled;
  }, [pairs, question.id]);

  // Quy tắc 1-1: Mỗi ý ở Cột B chỉ được chọn duy nhất 1 lần
  const handleMatch = (leftId: string, rightValue: string) => {
    if (disabled) return;

    if (!rightValue) {
      const updated = { ...selectedAnswers };
      delete updated[leftId];
      onAnswerChange(updated);
      return;
    }

    // Nếu rightValue đã được chọn ở một hàng khác, tự động hủy ở hàng cũ để bảo đảm 1-1
    const updated: Record<string, string> = {};
    Object.entries(selectedAnswers).forEach(([k, v]) => {
      if (k !== leftId && v !== rightValue) {
        updated[k] = v;
      }
    });
    updated[leftId] = rightValue;
    onAnswerChange(updated);
  };

  const handleReset = () => {
    if (disabled) return;
    onAnswerChange({});
  };

  return (
    <div className="space-y-4">
      {content.instruction && (
        <div className="text-sm sm:text-base font-semibold text-slate-800">
          <LatexRenderer content={content.instruction} />
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
        <span className="font-medium flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-ocean-600" />
          <span>Quy tắc: Hãy chọn nội dung Cột B tương ứng với Cột A <strong>(Mỗi ý chỉ được chọn 1 lần duy nhất)</strong>:</span>
        </span>
        {!disabled && Object.keys(selectedAnswers).length > 0 && (
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1 text-ocean-600 hover:text-ocean-800 font-bold self-end sm:self-auto cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Làm lại câu này
          </button>
        )}
      </div>

      <div className="space-y-3">
        {pairs.map((pair, idx) => {
          const currentChosenRight = selectedAnswers[pair.id];
          const targetCorrectRight = correctPairs[pair.id] || pair.right;
          const isCorrect = showCorrect && (currentChosenRight === targetCorrectRight);
          const isWrong = showCorrect && Boolean(currentChosenRight) && (currentChosenRight !== targetCorrectRight);

          return (
            <div
              key={pair.id || idx}
              className={`p-3.5 sm:p-4 rounded-2xl border transition ${
                showCorrect
                  ? isCorrect
                    ? 'bg-emerald-50/80 border-emerald-300 ring-1 ring-emerald-200'
                    : 'bg-rose-50/80 border-rose-300 ring-1 ring-rose-200'
                  : currentChosenRight
                  ? 'bg-ocean-50/50 border-ocean-300 ring-1 ring-ocean-200'
                  : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center gap-3">
                {/* Cột A */}
                <div className="flex-1 flex items-start gap-2.5">
                  <span className="w-6 h-6 rounded-lg bg-ocean-100 text-ocean-800 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <div className="text-xs sm:text-sm font-bold text-slate-900 pt-0.5">
                    <LatexRenderer content={pair.left} />
                  </div>
                </div>

                <div className="hidden md:flex items-center justify-center text-slate-400 shrink-0">
                  <ArrowRight className="w-4 h-4" />
                </div>

                {/* Cột B: Menu lựa chọn kết nối */}
                <div className="flex-1">
                  <select
                    disabled={disabled}
                    value={currentChosenRight || ''}
                    onChange={(e) => handleMatch(pair.id, e.target.value)}
                    className={`w-full p-2.5 rounded-xl border text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 ${
                      showCorrect
                        ? isCorrect
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold'
                          : 'border-rose-400 bg-rose-50 text-rose-950 font-bold'
                        : currentChosenRight
                        ? 'border-ocean-500 bg-white text-ocean-950 font-semibold'
                        : 'border-slate-300 bg-slate-50 text-slate-600'
                    }`}
                  >
                    <option value="">-- Bấm để chọn ý Cột B tương ứng --</option>
                    {rightOptions.map((opt, rIdx) => {
                      // Kiểm tra xem ý này đã được chọn ở hàng khác chưa
                      const isTakenByOther = Object.entries(selectedAnswers).some(
                        ([k, v]) => k !== pair.id && v === opt
                      );
                      const otherIndex = isTakenByOther
                        ? pairs.findIndex((p) => selectedAnswers[p.id] === opt)
                        : -1;

                      return (
                        <option
                          key={rIdx}
                          value={opt}
                          disabled={isTakenByOther}
                          className={isTakenByOther ? 'text-slate-400 bg-slate-100 italic' : ''}
                        >
                          {opt} {isTakenByOther && otherIndex >= 0 ? ` (Đã chọn ở Hàng ${otherIndex + 1})` : ''}
                        </option>
                      );
                    })}
                  </select>

                  {/* Hiển thị phản hồi khi xem kết quả */}
                  {showCorrect && (
                    <div className="mt-1.5 pt-1.5 border-t border-slate-200/60 flex items-center justify-between text-xs">
                      {isCorrect ? (
                        <span className="text-emerald-700 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Nối chính xác (+điểm)
                        </span>
                      ) : (
                        <div className="text-rose-700 font-medium space-y-0.5">
                          <div className="flex items-center gap-1 font-bold">
                            <XCircle className="w-3.5 h-3.5" /> Chưa chính xác
                          </div>
                          <div className="text-emerald-800 text-[11px] font-semibold bg-emerald-100/70 px-2 py-0.5 rounded-md">
                            ✓ Đáp án đúng phải nối với: <strong>{targetCorrectRight}</strong>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
