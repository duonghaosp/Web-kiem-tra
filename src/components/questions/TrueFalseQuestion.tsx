import React, { useMemo } from 'react';
import { Question } from '../../types/database';
import { LatexRenderer } from '../common/LatexRenderer';
import { Check, X } from 'lucide-react';

interface TrueFalseQuestionProps {
  question: Question;
  selectedAnswers: Record<string, boolean> | undefined;
  onAnswerChange: (answers: Record<string, boolean>) => void;
  disabled?: boolean;
  showCorrect?: boolean;
}

export const TrueFalseQuestion: React.FC<TrueFalseQuestionProps> = ({
  question,
  selectedAnswers = {},
  onAnswerChange,
  disabled = false,
  showCorrect = false,
}) => {
  const content = question.content_json || {};
  const tfAnswers: Record<string, boolean> = question.correct_answer_json?.tf_answers || {};

  // Xáo trộn ngẫu nhiên các mệnh đề Đúng / Sai để chống đoán mò vị trí
  const statements: Array<{ id: string; text: string }> = useMemo(() => {
    const raw: Array<{ id: string; text: string }> = content.statements || [];
    if (raw.length <= 1) return raw;

    const shuffled = [...raw];
    let seed = 0;
    const seedStr = (question.id || 'geo_tf_seed') + '_statements';
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

    return shuffled;
  }, [content.statements, question.id]);

  const handleSelect = (statementId: string, val: boolean) => {
    if (disabled) return;
    onAnswerChange({
      ...selectedAnswers,
      [statementId]: val,
    });
  };

  return (
    <div className="space-y-3">
      {content.question && (
        <div className="text-sm sm:text-base font-semibold text-slate-800 mb-3">
          <LatexRenderer content={content.question} />
        </div>
      )}

      <div className="space-y-3">
        {statements.map((st: { id: string; text: string }, idx: number) => {
          const userVal = selectedAnswers[st.id];
          const correctVal = tfAnswers[st.id];

          return (
            <div
              key={st.id || idx}
              className="p-3.5 rounded-xl border border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex-1 text-sm font-medium text-slate-700">
                <span className="font-bold text-slate-400 mr-2">{idx + 1}.</span>
                <LatexRenderer content={st.text} />
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                {/* Nút ĐÚNG */}
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => handleSelect(st.id, true)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold border transition ${
                    userVal === true
                      ? showCorrect && correctVal === true
                        ? 'bg-emerald-500 text-white border-emerald-600 shadow-xs'
                        : showCorrect && correctVal === false
                        ? 'bg-red-500 text-white border-red-600'
                        : 'bg-ocean-600 text-white border-ocean-700 shadow-xs'
                      : showCorrect && correctVal === true
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-400 ring-1 ring-emerald-300'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  } ${disabled ? 'cursor-default' : 'active:scale-95'}`}
                >
                  <Check className="w-3.5 h-3.5" />
                  ĐÚNG
                </button>

                {/* Nút SAI */}
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => handleSelect(st.id, false)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold border transition ${
                    userVal === false
                      ? showCorrect && correctVal === false
                        ? 'bg-emerald-500 text-white border-emerald-600 shadow-xs'
                        : showCorrect && correctVal === true
                        ? 'bg-red-500 text-white border-red-600'
                        : 'bg-rose-600 text-white border-rose-700 shadow-xs'
                      : showCorrect && correctVal === false
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-400 ring-1 ring-emerald-300'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  } ${disabled ? 'cursor-default' : 'active:scale-95'}`}
                >
                  <X className="w-3.5 h-3.5" />
                  SAI
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
