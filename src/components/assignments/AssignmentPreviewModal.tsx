import React, { useState } from 'react';
import { Assignment, Question } from '../../types/database';
import { LatexRenderer } from '../common/LatexRenderer';
import { normalizeQuestionList } from '../../lib/questionUtils';
import {
  X,
  Eye,
  EyeOff,
  Printer,
  ExternalLink,
  Clock,
  Award,
  CheckCircle2,
  Check,
  BookOpen,
  FileText,
  FileEdit,
} from 'lucide-react';

interface AssignmentPreviewModalProps {
  assignment: Assignment;
  questions: Question[];
  onClose: () => void;
  onTakeExamAsStudent: (assignmentId: string) => void;
  onEditQuestions?: (assignment: Assignment) => void;
}

// Hàm làm sạch chuỗi đáp án điền từ
const cleanText = (val: any): string => {
  if (!val) return '';
  return String(val)
    .replace(/<[^>]+>/g, '')
    .replace(/^\s*\(\s*\d+\s*\)\s*/, '')
    .replace(/^\s*\[\s*\d+\s*\]\s*/, '')
    .replace(/^\s*\d+[\s:.\-–—)]+/, '')
    .trim();
};

export const AssignmentPreviewModal: React.FC<AssignmentPreviewModalProps> = ({
  assignment,
  questions,
  onClose,
  onTakeExamAsStudent,
  onEditQuestions,
}) => {
  // Trạng thái bật/tắt hiển thị đáp án đúng & lời giải
  const [showAnswers, setShowAnswers] = useState<boolean>(true);

  // In đề thi ra giấy hoặc lưu thành file PDF
  const handlePrint = () => {
    window.print();
  };

  const normalizedQuestions = normalizeQuestionList(questions);

  // Tính tổng điểm
  const totalScore = normalizedQuestions.reduce((sum, q) => sum + (q.points || 1.0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-4 sm:p-6 lg:p-7 shadow-2xl border border-slate-100 space-y-5 my-auto max-h-[94vh] flex flex-col">
        {/* HEADER MODAL */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center shrink-0 font-bold shadow-2xs">
              <BookOpen className="w-5 h-5 text-teal-700" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-1.5 mb-1">
                <span className="text-[11px] font-black bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded-full">
                  {assignment.category || 'Kiểm tra'}
                </span>
                <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                  {assignment.target_ids?.join(', ') || 'Chung'}
                </span>
                <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  {assignment.duration_minutes || 15} phút
                </span>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                  {questions.length} câu hỏi • Tổng {totalScore.toFixed(1)}đ
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 leading-snug">
                {assignment.title}
              </h2>
            </div>
          </div>

          {/* Thanh công cụ hành động phía trên */}
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            {/* Nút Bật/Tắt đáp án */}
            <button
              type="button"
              onClick={() => setShowAnswers(!showAnswers)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition active:scale-95 cursor-pointer ${
                showAnswers
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                  : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
              }`}
              title={showAnswers ? 'Ẩn đáp án để xem như học sinh' : 'Hiện đáp án và giải thích'}
            >
              {showAnswers ? (
                <>
                  <Eye className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Đang hiện đáp án</span>
                </>
              ) : (
                <>
                  <EyeOff className="w-3.5 h-3.5 text-slate-500" />
                  <span>Đang ẩn đáp án</span>
                </>
              )}
            </button>

            {/* Nút Làm thử như học sinh */}
            <button
              type="button"
              onClick={() => onTakeExamAsStudent(assignment.id)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-ocean-600 hover:bg-ocean-700 text-white text-xs font-bold shadow-2xs transition active:scale-95 cursor-pointer"
              title="Mở màn hình làm bài thi để làm thử như học sinh"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Làm thử</span>
            </button>

            {/* Nút Sửa đề / Thêm câu hỏi (Gợi ý 3) */}
            {onEditQuestions && (
              <button
                type="button"
                onClick={() => onEditQuestions(assignment)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 text-xs font-bold shadow-2xs transition active:scale-95 cursor-pointer"
                title="Mở giao diện thêm hoặc bớt câu hỏi trong đề thi này"
              >
                <FileEdit className="w-3.5 h-3.5 text-indigo-600" />
                <span className="hidden sm:inline">Sửa đề / Thêm câu</span>
              </button>
            )}

            {/* Nút In đề */}
            <button
              type="button"
              onClick={handlePrint}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition border border-slate-200 cursor-pointer"
              title="In đề thi ra giấy hoặc lưu PDF"
            >
              <Printer className="w-4 h-4" />
            </button>

            {/* Nút Đóng */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              title="Đóng cửa sổ xem lại đề"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* NỘI DUNG DANH SÁCH CÂU HỎI */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 sm:pr-2">
          {normalizedQuestions.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs border-2 border-dashed border-slate-200 rounded-3xl space-y-2">
              <FileText className="w-10 h-10 mx-auto text-slate-300" />
              <p className="font-bold text-slate-700 text-sm">Chưa có dữ liệu câu hỏi cho đề thi này</p>
              <p className="text-slate-400">Cô có thể bấm vào "Làm thử" để trải nghiệm trực tiếp đề bài.</p>
            </div>
          ) : (
            normalizedQuestions.map((q, qIndex) => {
              const content = q.content_json || {};
              const points = q.points || 1.0;
              const type = q.type;

              // Nhãn loại câu hỏi
              const typeLabels: Record<string, string> = {
                single_choice: 'Trắc nghiệm 1 đáp án',
                multiple_choice: 'Trắc nghiệm nhiều đáp án',
                true_false: 'Đúng / Sai',
                fill_blank: 'Điền vào chỗ trống',
                drag_drop: 'Ghép nối',
                essay: 'Tự luận',
              };

              return (
                <div
                  key={q.id || qIndex}
                  className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-white hover:border-teal-300 transition space-y-3.5 shadow-2xs"
                >
                  {/* Tiêu đề câu hỏi & loại & điểm số */}
                  <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-xl bg-teal-600 text-white font-black text-xs shadow-2xs">
                        Câu {qIndex + 1}
                      </span>
                      <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                        {typeLabels[type] || 'Câu hỏi'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-amber-600" />
                        {points} điểm
                      </span>
                    </div>
                  </div>

                  {/* Nội dung câu hỏi (Latex & text) */}
                  <div className="text-slate-900 text-sm sm:text-base font-semibold leading-relaxed">
                    <LatexRenderer
                      content={
                        content.question ||
                        content.template ||
                        content.prompt ||
                        q.title ||
                        'Nội dung câu hỏi'
                      }
                    />
                  </div>

                  {/* 1. TRẮC NGHIỆM 1 HOẶC NHIỀU ĐÁP ÁN */}
                  {(type === 'single_choice' || type === 'multiple_choice') && Array.isArray(content.options) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {content.options.map((opt: string, optIdx: number) => {
                        const optLetter = String.fromCharCode(65 + optIdx);
                        const isCorrect =
                          type === 'single_choice'
                            ? q.correct_answer_json?.correct_index === optIdx
                            : Array.isArray(q.correct_answer_json?.correct_indices) &&
                              q.correct_answer_json.correct_indices.includes(optIdx);

                        let optClass = 'border-slate-200 bg-slate-50/50 text-slate-800';
                        if (showAnswers && isCorrect) {
                          optClass = 'border-emerald-500 bg-emerald-50/80 text-emerald-950 font-bold ring-1 ring-emerald-300';
                        }

                        return (
                          <div
                            key={optIdx}
                            className={`p-3 rounded-xl border text-xs sm:text-sm flex items-start gap-2.5 transition ${optClass}`}
                          >
                            <span
                              className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center shrink-0 ${
                                showAnswers && isCorrect
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-white border border-slate-300 text-slate-700'
                              }`}
                            >
                              {optLetter}
                            </span>
                            <div className="flex-1 pt-0.5 min-w-0">
                              <LatexRenderer content={opt} />
                            </div>
                            {showAnswers && isCorrect && (
                              <span className="shrink-0 text-emerald-600 font-bold text-xs flex items-center gap-0.5">
                                <CheckCircle2 className="w-4 h-4" /> Đúng
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* 2. ĐÚNG / SAI */}
                  {type === 'true_false' && Array.isArray(content.statements) && (
                    <div className="space-y-2 pt-1">
                      {content.statements.map((st: any, sIdx: number) => {
                        const tfAns = q.correct_answer_json?.tf_answers || {};
                        const isTrue = tfAns[st.id] === true || st.is_true === true;

                        return (
                          <div
                            key={st.id || sIdx}
                            className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between gap-3 text-xs sm:text-sm"
                          >
                            <div className="flex items-start gap-2 flex-1">
                              <span className="font-bold text-slate-500">{String.fromCharCode(97 + sIdx)})</span>
                              <LatexRenderer content={st.text} />
                            </div>
                            {showAnswers && (
                              <span
                                className={`px-2.5 py-1 rounded-lg text-xs font-black shrink-0 ${
                                  isTrue
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                    : 'bg-rose-100 text-rose-800 border border-rose-300'
                                }`}
                              >
                                {isTrue ? 'ĐÚNG' : 'SAI'}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* 3. ĐIỀN VÀO CHỖ TRỐNG */}
                  {type === 'fill_blank' && (
                    <div className="space-y-2 pt-1">
                      {showAnswers && (
                        <div className="p-3.5 bg-emerald-50/80 rounded-xl border border-emerald-200 text-xs sm:text-sm space-y-2">
                          <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Đáp án chuẩn từng chỗ trống:</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {Object.entries(q.correct_answer_json?.blank_answers || {}).map(([key, words], bIdx) => {
                              const arr = Array.isArray(words) ? words : [words];
                              const numIdx = bIdx + 1;
                              return (
                                <div
                                  key={key}
                                  className="p-2 bg-white rounded-lg border border-emerald-200 flex items-center gap-2"
                                >
                                  <span className="w-5 h-5 rounded-md bg-teal-600 text-white font-black text-[11px] flex items-center justify-center shrink-0">
                                    {numIdx}
                                  </span>
                                  <span className="font-bold text-slate-900">
                                    {arr.map((w) => cleanText(w)).join(' / ')}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 4. GHÉP NỐI CẶP (DRAG DROP) */}
                  {type === 'drag_drop' && Array.isArray(content.pairs) && (
                    <div className="space-y-2 pt-1">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {content.pairs.map((p: any, pIdx: number) => (
                          <div
                            key={pIdx}
                            className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between gap-2 text-xs sm:text-sm"
                          >
                            <span className="font-bold text-slate-800">{p.left}</span>
                            <span className="text-teal-600 font-black">⇄</span>
                            <span className="font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                              {p.right}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 5. TỰ LUẬN */}
                  {type === 'essay' && (
                    <div className="space-y-2 pt-1">
                      {showAnswers && (content.sample_answer || q.correct_answer_json?.essay_sample) && (
                        <div className="p-3.5 bg-amber-50/80 rounded-xl border border-amber-200 text-xs sm:text-sm space-y-1">
                          <span className="font-bold text-amber-900 flex items-center gap-1.5">
                            <Check className="w-4 h-4 text-amber-600" />
                            Gợi ý chấm & đáp án mẫu:
                          </span>
                          <p className="text-slate-800 leading-relaxed font-medium whitespace-pre-line">
                            {content.sample_answer || q.correct_answer_json?.essay_sample}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* LỜI GIẢI CHI TIẾT */}
                  {showAnswers && q.explanation && (
                    <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200 text-xs sm:text-sm text-blue-950 flex items-start gap-2">
                      <div className="font-bold shrink-0 text-blue-800">💡 Lời giải chi tiết:</div>
                      <div className="flex-1 font-medium leading-relaxed">
                        <LatexRenderer content={q.explanation} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* FOOTER MODAL */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 font-medium">
            Hạn chót nộp bài: <strong className="text-slate-700">{assignment.deadline ? new Date(assignment.deadline).toLocaleString('vi-VN') : 'Không giới hạn'}</strong> • {assignment.allow_late ? '✓ Cho phép nộp trễ' : '✕ Khóa nộp sau hạn'}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" /> In đề / Lưu PDF
            </button>

            <button
              type="button"
              onClick={() => onTakeExamAsStudent(assignment.id)}
              className="px-4 py-2 bg-gradient-to-r from-teal-600 to-ocean-600 hover:from-teal-700 hover:to-ocean-700 text-white text-xs font-bold rounded-xl transition shadow-2xs cursor-pointer flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Làm thử đề này
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
