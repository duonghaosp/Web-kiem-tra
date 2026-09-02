import React, { useState } from 'react';
import { Question } from '../../types/database';
import { LatexRenderer } from '../common/LatexRenderer';
import { CheckSquare, Square, ZoomIn, Image as ImageIcon } from 'lucide-react';
import { ImageZoomModal } from '../common/ImageZoomModal';

interface MultipleChoiceQuestionProps {
  question: Question;
  selectedAnswers: number[] | undefined;
  onAnswerChange: (answers: number[]) => void;
  disabled?: boolean;
  showCorrect?: boolean;
}

export const MultipleChoiceQuestion: React.FC<MultipleChoiceQuestionProps> = ({
  question,
  selectedAnswers = [],
  onAnswerChange,
  disabled = false,
  showCorrect = false,
}) => {
  const [zoomModal, setZoomModal] = useState<{ isOpen: boolean; url: string; caption?: string }>({
    isOpen: false,
    url: '',
    caption: '',
  });

  const content = question.content_json || {};
  const options: string[] = content.options || [];
  const optionImages: (string | null | undefined)[] = content.option_images || [];
  const correctIndices: number[] = (question.correct_answer_json?.correct_indices || []).map(Number);
  const optionLetters = ['A', 'B', 'C', 'D', 'E', 'F'];

  const toggleOption = (idx: number) => {
    if (disabled) return;
    const current = selectedAnswers || [];
    if (current.includes(idx)) {
      onAnswerChange(current.filter((i) => i !== idx));
    } else {
      onAnswerChange([...current, idx]);
    }
  };

  return (
    <div className="space-y-3">
      {content.question && (
        <div className="text-sm sm:text-base font-semibold text-slate-800 mb-2">
          <LatexRenderer content={content.question} />
        </div>
      )}

      {/* KHỐI HÌNH ẢNH / TƯ LIỆU QUAN SÁT */}
      {content.image_url && (
        <div className="mb-4">
          <div className="relative group bg-slate-50 border-2 border-slate-200 hover:border-ocean-400 rounded-2xl p-2.5 sm:p-4 text-center transition shadow-xs max-w-2xl mx-auto">
            <img
              src={content.image_url}
              alt={content.image_caption || 'Tư liệu quan sát'}
              onClick={() =>
                setZoomModal({
                  isOpen: true,
                  url: content.image_url!,
                  caption: content.image_caption || 'Tư liệu câu hỏi',
                })
              }
              className="max-h-80 sm:max-h-[460px] w-auto max-w-full object-contain rounded-xl mx-auto cursor-zoom-in transition-transform duration-200 group-hover:scale-[1.01]"
            />

            <button
              type="button"
              onClick={() =>
                setZoomModal({
                  isOpen: true,
                  url: content.image_url!,
                  caption: content.image_caption || 'Tư liệu câu hỏi',
                })
              }
              className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-900 text-white text-xs font-bold shadow-md backdrop-blur-xs transition cursor-pointer"
            >
              <ZoomIn className="w-4 h-4 text-ocean-300" />
              <span>Phóng to</span>
            </button>

            {content.image_caption && (
              <div className="mt-2.5 text-xs sm:text-sm font-semibold text-slate-700 italic flex items-center justify-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-ocean-600 shrink-0" />
                <span>{content.image_caption}</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="text-xs text-ocean-700 bg-ocean-50 px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 font-medium mb-2">
        <CheckSquare className="w-3.5 h-3.5 text-ocean-600" />
        Câu hỏi nhiều lựa chọn (Có thể chọn nhiều hơn 1 đáp án)
      </div>

      <div className="space-y-2.5">
        {options.map((opt, idx) => {
          const isSelected = selectedAnswers.includes(idx);
          const isCorrectAnswer = correctIndices.includes(idx);
          const isThisCorrect = showCorrect && isCorrectAnswer;
          const isWrongChosen = showCorrect && isSelected && !isCorrectAnswer;
          const optImage = optionImages[idx];

          let btnStyle = 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700';

          if (showCorrect) {
            if (isThisCorrect) {
              btnStyle = 'border-emerald-500 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-300';
            } else if (isWrongChosen) {
              btnStyle = 'border-red-500 bg-red-50 text-red-950 ring-2 ring-red-200';
            }
          } else if (isSelected) {
            btnStyle = 'border-ocean-500 bg-ocean-50/70 text-ocean-950 ring-2 ring-ocean-300';
          }

          return (
            <button
              key={idx}
              type="button"
              disabled={disabled}
              onClick={() => toggleOption(idx)}
              className={`w-full text-left p-3.5 rounded-xl border transition flex items-start gap-3 text-sm ${btnStyle} ${
                disabled ? 'cursor-default' : 'cursor-pointer active:scale-[0.99]'
              }`}
            >
              <div className="mt-0.5 text-ocean-600 shrink-0">
                {isSelected ? (
                  <CheckSquare className="w-5 h-5 fill-ocean-100 text-ocean-600" />
                ) : (
                  <Square className="w-5 h-5 text-slate-300" />
                )}
              </div>
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-slate-600">{optionLetters[idx]}.</span>
                  {opt && <LatexRenderer content={opt} />}
                </div>

                {optImage && (
                  <div className="relative inline-block mt-1 group/optImg">
                    <img
                      src={optImage}
                      alt={`Hình ảnh phương án ${optionLetters[idx]}`}
                      className="max-h-36 sm:max-h-48 w-auto max-w-full object-contain rounded-xl border border-slate-200 bg-white p-1.5 shadow-2xs"
                    />
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        setZoomModal({
                          isOpen: true,
                          url: optImage,
                          caption: `Hình ảnh phương án ${optionLetters[idx]}${opt ? `: ${opt}` : ''}`,
                        });
                      }}
                      className="absolute top-2 right-2 p-1.5 bg-slate-900/80 hover:bg-slate-950 text-white rounded-lg opacity-85 hover:opacity-100 transition shadow-md cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                      title="Phóng to ảnh phương án"
                    >
                      <ZoomIn className="w-3.5 h-3.5 text-ocean-300" />
                      <span className="hidden sm:inline">Phóng to</span>
                    </span>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <ImageZoomModal
        isOpen={zoomModal.isOpen}
        imageUrl={zoomModal.url}
        caption={zoomModal.caption}
        onClose={() => setZoomModal({ isOpen: false, url: '', caption: '' })}
      />
    </div>
  );
};
