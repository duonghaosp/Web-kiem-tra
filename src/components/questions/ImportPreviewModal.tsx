import React, { useState } from 'react';
import {
  FileText,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  X,
  Plus,
  Trash2,
  Check,
  Edit2,
  Save,
  HelpCircle,
  ArrowRight,
  Info,
} from 'lucide-react';
import { Question } from '../../types/database';
import { ParsedQuestionItem } from '../../lib/examParsers';

interface ImportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  fileType: 'word' | 'excel';
  parsedQuestions: ParsedQuestionItem[];
  currentExistingCount: number; // Số lượng câu hỏi hiện có trong bài học để đánh số tiếp
  targetLessonTitle?: string;
  onConfirmImport: (selectedQuestions: Question[]) => void;
}

export const ImportPreviewModal: React.FC<ImportPreviewModalProps> = ({
  isOpen,
  onClose,
  fileName,
  fileType,
  parsedQuestions: initialQuestions,
  currentExistingCount,
  targetLessonTitle,
  onConfirmImport,
}) => {
  if (!isOpen) return null;

  const [questions, setQuestions] = useState<ParsedQuestionItem[]>(() =>
    initialQuestions.map((q) => ({
      ...q,
      title: q.title.replace(/^(?:Câu|Bài)?\s*\d+[\s:.\-–—)]*/i, '').trim(),
    }))
  );

  const [selectedIndices, setSelectedIndices] = useState<number[]>(() =>
    initialQuestions.map((_, i) => i)
  );

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editQuestionText, setEditQuestionText] = useState('');
  const [editOptions, setEditOptions] = useState<string[]>([]);
  const [editCorrectIdx, setEditCorrectIdx] = useState<number>(0);
  const [editExplanation, setEditExplanation] = useState<string>('');

  // Đếm tổng số cảnh báo
  const totalWarnings = questions.reduce((sum, q) => sum + (q.warnings?.length || 0), 0);

  const toggleSelect = (idx: number) => {
    if (selectedIndices.includes(idx)) {
      setSelectedIndices(selectedIndices.filter((i) => i !== idx));
    } else {
      setSelectedIndices([...selectedIndices, idx].sort((a, b) => a - b));
    }
  };

  const handleSelectAll = () => {
    if (selectedIndices.length === questions.length) {
      setSelectedIndices([]);
    } else {
      setSelectedIndices(questions.map((_, i) => i));
    }
  };

  // Mở chế độ chỉnh sửa nhanh 1 câu hỏi trong Preview
  const handleStartEdit = (idx: number) => {
    const q = questions[idx];
    setEditingIndex(idx);
    setEditQuestionText(q.content_json?.question || q.title || '');
    setEditOptions(q.content_json?.options ? [...q.content_json.options] : ['', '', '', '']);
    setEditCorrectIdx(q.correct_answer_json?.correct_index ?? 0);
    setEditExplanation(q.explanation || '');
  };

  // Lưu chỉnh sửa nhanh
  const handleSaveEdit = (idx: number) => {
    const updated = [...questions];
    const cleanOpts = editOptions.map((o) => o.trim()).filter(Boolean);

    // Tính toán lại cảnh báo sau khi sửa
    const newWarnings: string[] = [];
    if (cleanOpts.length < 4) {
      newWarnings.push(`⚠️ Chỉ có ${cleanOpts.length} lựa chọn đáp án.`);
    }

    updated[idx] = {
      ...updated[idx],
      title: editQuestionText.trim(),
      content_json: {
        ...updated[idx].content_json,
        question: editQuestionText.trim(),
        options: cleanOpts,
      },
      correct_answer_json: {
        ...updated[idx].correct_answer_json,
        correct_index: Math.min(editCorrectIdx, Math.max(0, cleanOpts.length - 1)),
      },
      explanation: editExplanation.trim() || null,
      warnings: newWarnings,
    };

    setQuestions(updated);
    setEditingIndex(null);
  };

  // Thay đổi nhanh đáp án đúng (tích 1 chạm vào nút A, B, C, D)
  const handleChangeCorrectOption = (qIdx: number, optIdx: number) => {
    const updated = [...questions];
    updated[qIdx] = {
      ...updated[qIdx],
      correct_answer_json: {
        ...updated[qIdx].correct_answer_json,
        correct_index: optIdx,
      },
      // Xóa cảnh báo chưa có đáp án nếu có
      warnings: (updated[qIdx].warnings || []).filter((w) => !w.includes('Chưa tìm thấy dòng đáp án')),
    };
    setQuestions(updated);
  };

  // Xóa bớt 1 câu khỏi danh sách import
  const handleDeleteQuestion = (idx: number) => {
    const updated = questions.filter((_, i) => i !== idx);
    setQuestions(updated);
    setSelectedIndices(
      selectedIndices
        .filter((i) => i !== idx)
        .map((i) => (i > idx ? i - 1 : i))
    );
  };

  // Xác nhận nạp các câu đã chọn
  const handleConfirm = () => {
    if (selectedIndices.length === 0) {
      alert('Cô hãy tích chọn ít nhất 1 câu hỏi để nạp vào bài học nhé!');
      return;
    }

    const finalQuestionsToImport: Question[] = selectedIndices.map((idx, seq) => {
      const q = questions[idx];
      const renumberedSeq = currentExistingCount + seq + 1;
      const qContentText = q.content_json?.question || q.title;

      return {
        ...q,
        title: `Câu ${renumberedSeq}: ${qContentText.substring(0, 100)}`,
        content_json: {
          ...q.content_json,
          question: qContentText,
        },
      };
    });

    onConfirmImport(finalQuestionsToImport);
    onClose();
  };

  const optionLetters = ['A', 'B', 'C', 'D'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header Modal */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-start justify-between gap-4 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white shadow-md ${
                fileType === 'word'
                  ? 'bg-gradient-to-tr from-blue-600 to-indigo-600'
                  : 'bg-gradient-to-tr from-emerald-600 to-teal-600'
              }`}
            >
              {fileType === 'word' ? <FileText className="w-6 h-6" /> : <FileSpreadsheet className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  Xem Trước Câu Hỏi Import Từ File {fileType === 'word' ? 'Word (.docx)' : 'Excel (.xlsx)'}
                </h3>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-ocean-100 text-ocean-800">
                  {fileName}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {targetLessonTitle ? (
                  <>
                    Đang chuẩn bị nạp vào: <strong className="text-slate-800">{targetLessonTitle}</strong>
                  </>
                ) : (
                  'Kiểm tra lại nội dung câu hỏi và các phương án trước khi đưa vào đề thi'
                )}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thanh Thống Kê & Cảnh Báo */}
        <div className="px-5 sm:px-6 py-3 bg-white border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 flex-wrap font-medium">
            <span className="text-slate-700">
              Tổng số nhận diện: <strong className="font-bold text-ocean-700">{questions.length}</strong> câu
            </span>
            <span>•</span>
            <span className="text-emerald-700 font-bold">
              Đang chọn: {selectedIndices.length}/{questions.length} câu
            </span>
            {currentExistingCount > 0 && (
              <>
                <span>•</span>
                <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md font-semibold">
                  Tự động đánh số nối tiếp từ: <strong className="text-ocean-700">Câu {currentExistingCount + 1}</strong>
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {totalWarnings > 0 ? (
              <span className="flex items-center gap-1 text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg font-bold">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                {totalWarnings} cảnh báo cần kiểm tra
              </span>
            ) : (
              <span className="flex items-center gap-1 text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                Đầy đủ & Chuẩn 100%
              </span>
            )}

            <button
              type="button"
              onClick={handleSelectAll}
              className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition cursor-pointer"
            >
              {selectedIndices.length === questions.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
            </button>
          </div>
        </div>

        {/* Danh Sách Câu Hỏi Preview */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/50">
          {questions.map((q, idx) => {
            const isSelected = selectedIndices.includes(idx);
            const isEditing = editingIndex === idx;
            const renumberedNumber = currentExistingCount + (selectedIndices.indexOf(idx) !== -1 ? selectedIndices.indexOf(idx) + 1 : idx + 1);
            const correctIdx = q.correct_answer_json?.correct_index ?? 0;
            const options = q.content_json?.options || [];

            return (
              <div
                key={q.id || idx}
                className={`rounded-2xl border transition shadow-xs ${
                  isSelected
                    ? 'bg-white border-slate-200 hover:border-ocean-300'
                    : 'bg-slate-100/70 border-slate-200 opacity-60'
                }`}
              >
                {/* Header Câu Hỏi */}
                <div className="p-4 border-b border-slate-100 flex items-start justify-between gap-3 bg-slate-50/40 rounded-t-2xl">
                  <div className="flex items-start gap-3 flex-1">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(idx)}
                      className="mt-1 w-4 h-4 rounded text-ocean-600 focus:ring-ocean-500 cursor-pointer"
                    />

                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-xs bg-ocean-100 text-ocean-900 px-2.5 py-0.5 rounded-md">
                          Câu {renumberedNumber}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-500">
                          (Dạng: {q.type === 'single_choice' ? 'Trắc nghiệm 1 đáp án' : 'Tự luận'})
                        </span>
                        {q.warnings && q.warnings.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {q.warnings.map((w, wIdx) => (
                              <span
                                key={wIdx}
                                className="text-[10px] font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-md border border-amber-300 flex items-center gap-1"
                              >
                                <AlertTriangle className="w-3 h-3 text-amber-600" />
                                {w}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Nội dung câu hỏi (Hiển thị hoặc Form sửa) */}
                      {isEditing ? (
                        <div className="pt-2">
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">
                            Nội dung câu hỏi:
                          </label>
                          <textarea
                            rows={2}
                            value={editQuestionText}
                            onChange={(e) => setEditQuestionText(e.target.value)}
                            className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-ocean-500"
                          />
                        </div>
                      ) : (
                        <h4 className="font-bold text-slate-900 text-sm leading-snug pt-0.5">
                          {q.content_json?.question || q.title}
                        </h4>
                      )}
                    </div>
                  </div>

                  {/* Nút Sửa / Xóa */}
                  <div className="flex items-center gap-1 shrink-0">
                    {isEditing ? (
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(idx)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5" /> Lưu Sửa
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleStartEdit(idx)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-ocean-700 hover:bg-slate-100 transition cursor-pointer"
                        title="Chỉnh sửa câu này"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDeleteQuestion(idx)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                      title="Xóa câu này khỏi danh sách import"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Các Phương Án A, B, C, D */}
                <div className="p-4 space-y-2">
                  {isEditing ? (
                    <div className="space-y-2 pt-1">
                      <label className="block text-[11px] font-bold text-slate-600">
                        Chỉnh sửa các phương án (Tích chọn tròn để đặt đáp án đúng):
                      </label>
                      {editOptions.map((opt, oIdx) => (
                        <div key={oIdx} className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setEditCorrectIdx(oIdx)}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition cursor-pointer ${
                              editCorrectIdx === oIdx
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {optionLetters[oIdx]}
                          </button>
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => {
                              const next = [...editOptions];
                              next[oIdx] = e.target.value;
                              setEditOptions(next);
                            }}
                            placeholder={`Nội dung phương án ${optionLetters[oIdx]}...`}
                            className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-ocean-500"
                          />
                        </div>
                      ))}

                      <div className="pt-2">
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          Lời giải / Giải thích:
                        </label>
                        <input
                          type="text"
                          value={editExplanation}
                          onChange={(e) => setEditExplanation(e.target.value)}
                          placeholder="Nhập lời giải hoặc giải thích chi tiết..."
                          className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-ocean-500"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {options.map((opt: string, oIdx: number) => {
                        const isCorrect = correctIdx === oIdx;
                        return (
                          <div
                            key={oIdx}
                            onClick={() => handleChangeCorrectOption(idx, oIdx)}
                            className={`p-2.5 rounded-xl border transition flex items-start gap-2.5 cursor-pointer ${
                              isCorrect
                                ? 'bg-emerald-50/90 border-emerald-400 text-emerald-950 font-bold shadow-xs'
                                : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                            }`}
                            title="Bấm vào để đổi đáp án đúng"
                          >
                            <span
                              className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-black shrink-0 ${
                                isCorrect
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {optionLetters[oIdx]}
                            </span>
                            <span className="text-xs flex-1 leading-relaxed">{opt}</span>
                            {isCorrect && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Lời giải thích */}
                  {!isEditing && q.explanation && (
                    <div className="pt-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200 font-medium italic flex items-start gap-1.5">
                      <Info className="w-4 h-4 text-ocean-600 shrink-0 mt-0.5" />
                      <span>
                        <strong>Lời giải:</strong> {q.explanation}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-ocean-500 shrink-0" />
            <span>Cô có thể bấm trực tiếp vào phương án A, B, C, D để đổi đáp án đúng nhanh chóng.</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm transition cursor-pointer"
            >
              Hủy Bỏ
            </button>

            <button
              type="button"
              onClick={handleConfirm}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs sm:text-sm shadow-md transition cursor-pointer active:scale-95"
            >
              <Check className="w-4 h-4" />
              Nạp {selectedIndices.length} Câu Đã Chọn Vào Bài
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
