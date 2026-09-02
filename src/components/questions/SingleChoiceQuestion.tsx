import React, { useState } from 'react';
import { Question } from '../../types/database';
import { LatexRenderer } from '../common/LatexRenderer';
import { ZoomIn, Image as ImageIcon } from 'lucide-react';
import { ImageZoomModal } from '../common/ImageZoomModal';

interface SingleChoiceQuestionProps {
  question: Question;
  selectedAnswer: number | null | undefined;
  onAnswerChange: (answer: number) => void;
  disabled?: boolean;
  showCorrect?: boolean;
}

export const SingleChoiceQuestion: React.FC<SingleChoiceQuestionProps> = ({
  question,
  selectedAnswer,
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
  const correctIdx = question.correct_answer_json?.correct_index;

  const optionLetters = ['A', 'B', 'C', 'D', 'E', 'F'];

  return (
    <div className="space-y-3">
      {content.question && (
        <div className="text-sm sm:text-base font-semibold text-slate-800 mb-3">
          <LatexRenderer content={content.question} />
        </div>
      )}

      {/* KHỐI HÌNH ẢNH / TƯ LIỆU QUAN SÁT CHÍNH (BẢN ĐỒ, BIỂU ĐỒ, BẢNG SỐ LIỆU) */}
      {content.image_url && (
        <div className="mb-5">
          <div className="relative group bg-slate-50 border-2 border-slate-200 hover:border-ocean-400 rounded-2xl p-2.5 sm:p-4 text-center transition shadow-xs max-w-2xl mx-auto">
            <img
              src={content.image_url}
              alt={content.image_caption || 'Tư liệu quan sát câu hỏi Địa lí'}
              onClick={() =>
                setZoomModal({
                  isOpen: true,
                  url: content.image_url!,
                  caption: content.image_caption || 'Tư liệu câu hỏi',
                })
              }
              className="max-h-80 sm:max-h-[460px] w-auto max-w-full object-contain rounded-xl mx-auto cursor-zoom-in transition-transform duration-200 group-hover:scale-[1.01]"
            />

            {/* Nút bấm phóng to góc ảnh */}
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

            {/* Chú thích bản đồ / biểu đồ */}
            {content.image_caption && (
              <div className="mt-2.5 text-xs sm:text-sm font-semibold text-slate-700 italic flex items-center justify-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-ocean-600 shrink-0" />
                <span>{content.image_caption}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DANH SÁCH PHƯƠNG ÁN A, B, C, D (HỖ TRỢ CẢ VĂN BẢN VÀ HÌNH ẢNH) */}
      <div className="space-y-2.5">
        {options.map((opt, idx) => {
          const isSelected = selectedAnswer === idx;
          const isThisCorrect = showCorrect && idx === correctIdx;
          const isWrongChosen = showCorrect && isSelected && idx !== correctIdx;
          const optImage = optionImages[idx];

          let btnStyle = 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700';
          let badgeStyle = 'bg-slate-100 text-slate-600 border-slate-300';

          if (showCorrect) {
            if (isThisCorrect) {
              btnStyle = 'border-emerald-500 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-300';
              badgeStyle = 'bg-emerald-600 text-white border-emerald-600';
            } else if (isWrongChosen) {
              btnStyle = 'border-red-500 bg-red-50 text-red-950 ring-2 ring-red-200';
              badgeStyle = 'bg-red-600 text-white border-red-600';
            }
          } else if (isSelected) {
            btnStyle = 'border-ocean-500 bg-ocean-50/70 text-ocean-950 ring-2 ring-ocean-300';
            badgeStyle = 'bg-ocean-600 text-white border-ocean-600';
          }

          return (
            <button
              key={idx}
              type="button"
              disabled={disabled}
              onClick={() => onAnswerChange(idx)}
              className={`w-full text-left p-3.5 rounded-xl border transition flex items-start gap-3 text-sm ${btnStyle} ${
                disabled ? 'cursor-default' : 'cursor-pointer active:scale-[0.99]'
              }`}
            >
              <span
                className={`w-6 h-6 rounded-lg font-bold text-xs flex items-center justify-center border shrink-0 mt-0.5 ${badgeStyle}`}
              >
                {optionLetters[idx] || idx + 1}
              </span>
              <div className="flex-1 min-w-0 pt-0.5 space-y-2">
                {opt && <LatexRenderer content={opt} />}

                {/* Hình ảnh của từng phương án lựa chọn A, B, C, D */}
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

      {/* Kính lúp phóng to tương tác chuyên nghiệp */}
      <ImageZoomModal
        isOpen={zoomModal.isOpen}
        imageUrl={zoomModal.url}
        caption={zoomModal.caption}
        onClose={() => setZoomModal({ isOpen: false, url: '', caption: '' })}
      />
    </div>
  );
};
