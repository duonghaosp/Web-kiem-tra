import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Award,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Sparkles,
  BookOpen,
  FileText,
} from 'lucide-react';
import { Question } from '../types/database';
import { LatexRenderer } from '../components/common/LatexRenderer';
import { FillBlankQuestion } from '../components/questions/FillBlankQuestion';

export const StudentResultDetailPage: React.FC = () => {
  const { id } = useParams();
  const { profile } = useAuth();

  const [resultData, setResultData] = useState<any | null>(null);

  useEffect(() => {
    // 1. Đọc kết quả từ localStorage theo assignmentId hoặc submissionId
    const stored = localStorage.getItem(`geo_result_${id || 'asg_1'}`);
    if (stored) {
      try {
        setResultData(JSON.parse(stored));
        return;
      } catch (e) {
        console.warn(e);
      }
    }

    // 2. Tìm trong danh sách student submissions
    try {
      const allSubs = JSON.parse(localStorage.getItem('geo_student_submissions') || '[]');
      const matched = allSubs.find((s: any) => s.assignment_id === id || s.id === id);
      if (matched) {
        setResultData(matched);
        return;
      }
    } catch (e) {
      console.warn(e);
    }

    // 3. Fallback: Nếu không tìm thấy, lấy đề từ geo_assignments
    try {
      const allAsgs = JSON.parse(localStorage.getItem('geo_assignments') || '[]');
      const asg = allAsgs.find((a: any) => a.id === id);
      if (asg) {
        setResultData({
          assignment_id: asg.id,
          assignment_title: asg.title,
          student_name: profile?.full_name || 'Học sinh',
          student_code: profile?.student_code || 'HS061',
          class_name: profile?.class_name || 'Lớp 6A1',
          score_tn: 7.0,
          max_score_tn: 7.0,
          score_tl: 0,
          max_score_tl: 3.0,
          score: 7.0,
          max_score: 10.0,
          status: 'waiting_teacher_grading',
          questions: asg.questions || [],
          answers_json: {},
          detailed_scores_json: {},
          submitted_at: 'Vừa xong',
          time_spent_seconds: (asg.duration_minutes || 15) * 60 - 120,
        });
      }
    } catch (e) {
      console.warn(e);
    }
  }, [id, profile]);

  const displayQuestions: Question[] = useMemo(() => {
    if (resultData?.questions && Array.isArray(resultData.questions) && resultData.questions.length > 0) {
      return resultData.questions;
    }
    // Nếu không có mảng questions trong kết quả, tìm trong geo_assignments
    try {
      const allAsgs = JSON.parse(localStorage.getItem('geo_assignments') || '[]');
      const asg = allAsgs.find((a: any) => a.id === id || a.id === resultData?.assignment_id);
      if (asg && asg.questions && asg.questions.length > 0) {
        return asg.questions;
      }
    } catch (e) {
      console.warn(e);
    }
    return [];
  }, [resultData, id]);

  const studentAnswers = resultData?.answers_json || {};
  const detailedScores = resultData?.detailed_scores_json || {};
  const isWaiting = resultData?.status === 'waiting_teacher_grading';
  const score = resultData?.score ?? 0;
  const isExcellent = score >= 8.0;

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          to="/student-dashboard"
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-ocean-700 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Quay Lại Góc Học Tập
        </Link>
        {isWaiting && (resultData?.max_score_tl ?? 0) > 0 ? (
          <span className="text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 flex items-center gap-1">
            ⏳ Điểm Trắc Nghiệm Tạm Tính • Chờ Cô Hảo Chấm Tự Luận
          </span>
        ) : (
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            ✓ Kết Quả Bài Kiểm Tra Đã Hoàn Tất
          </span>
        )}
      </div>

      {/* Thẻ Điểm Số Tổng Kết */}
      <div
        className={`rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6 ${
          isWaiting && (resultData?.max_score_tl ?? 0) > 0
            ? 'bg-gradient-to-r from-ocean-600 via-blue-600 to-indigo-700'
            : 'bg-gradient-to-r from-emerald-600 to-teal-600'
        }`}
      >
        <div className="space-y-2 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-emerald-100 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            {isWaiting && (resultData?.max_score_tl ?? 0) > 0
              ? 'Đã Hoàn Thành Bài Thi - Chờ Chấm Tự Luận'
              : isExcellent
              ? 'Xuất Sắc! Điểm Số Rất Cao'
              : 'Hoàn Thành Bài Kiểm Tra'}
          </div>
          <h2 className="text-xl sm:text-2xl font-black">
            {resultData?.assignment_title || 'Bài Kiểm Tra Môn Địa Lí'}
          </h2>
          <div className="text-xs text-white/80 flex flex-wrap items-center justify-center sm:justify-start gap-3">
            <span>
              Học sinh:{' '}
              <strong className="text-white">
                {resultData?.student_name || profile?.full_name || 'Học sinh'}
              </strong>{' '}
              ({resultData?.student_code || profile?.student_code || 'HS'}) - {resultData?.class_name || profile?.class_name || 'Lớp học'}
            </span>
            {resultData?.time_spent_seconds !== undefined && (
              <span>
                • Thời gian làm: {Math.floor(resultData.time_spent_seconds / 60)} phút{' '}
                {resultData.time_spent_seconds % 60} giây
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 bg-white/15 backdrop-blur-md px-6 py-4 rounded-3xl border border-white/20 text-center shrink-0">
          <div>
            <div className="text-3xl sm:text-4xl font-black text-yellow-300">
              {isWaiting && (resultData?.max_score_tl ?? 0) > 0
                ? (resultData?.score_tn ?? score)
                : score}
            </div>
            <div className="text-[11px] font-bold text-white/90">
              {isWaiting && (resultData?.max_score_tl ?? 0) > 0
                ? `Điểm Trắc Nghiệm / ${resultData?.max_score_tn ?? 10}đ`
                : `Thang điểm ${resultData?.max_score ?? 10}đ`}
            </div>
          </div>
        </div>
      </div>

      {/* Nhận Xét & Lời Dặn Dò Của Cô Hảo */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
          <FileText className="w-5 h-5 text-ocean-600" />
          <span>Lời Nhận Xét & Đánh Giá Của Cô Hảo:</span>
        </div>

        {resultData?.teacher_feedback_text ? (
          <div className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium bg-ocean-50/40 p-4 rounded-2xl border border-ocean-100 italic">
            "{resultData.teacher_feedback_text}"
          </div>
        ) : isWaiting ? (
          <div className="text-xs text-amber-800 bg-amber-50 p-4 rounded-2xl border border-amber-200 font-medium">
            ⏳ <strong>Thông báo:</strong> Phần trắc nghiệm của em đã được hệ thống tự động chấm ({resultData?.score_tn ?? score}/7.0 điểm). Bài làm tự luận (3.0 điểm) đã được chuyển sang mục chờ Cô Hảo chấm điểm và ghi nhận xét chi tiết.
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic">
            (Chưa có nhận xét văn bản của giáo viên)
          </p>
        )}
      </div>

      {/* Xem Lại Chi Tiết Đáp Án & Lời Giải Thích CỦA ĐÚNG BÀI KIỂM TRA NÀY */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-ocean-600" />
            <span>Đáp Án Chi Tiết & Lời Giải Thích ({displayQuestions.length} câu)</span>
          </h3>
        </div>

        {displayQuestions.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            Đã ghi nhận bài làm của em.
          </div>
        ) : (
          <div className="space-y-4">
            {displayQuestions.map((q: Question, idx: number) => {
              const detail = detailedScores[q.id];
              const studentAns = studentAnswers[q.id];
              const isEssay = q.type === 'essay';
              const isCorrect = detail?.isCorrect;
              const pointsEarned = isEssay ? (resultData?.score_tl || 0) : (detail?.score ?? 0);
              const maxPoints = detail?.maxScore ?? (Number(q.points) || 1.0);

              return (
                <div
                  key={q.id || idx}
                  className={`p-4 sm:p-5 rounded-2xl border space-y-3 ${
                    isEssay
                      ? 'border-amber-200 bg-amber-50/20'
                      : isCorrect
                      ? 'border-emerald-200 bg-emerald-50/20'
                      : 'border-rose-200 bg-rose-50/20'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800">
                        Câu {idx + 1}:
                      </span>
                      <span className="font-semibold text-slate-500 text-[11px]">
                        {q.type === 'single_choice' && 'Trắc nghiệm 1 đáp án'}
                        {q.type === 'multiple_choice' && 'Trắc nghiệm nhiều đáp án'}
                        {q.type === 'true_false' && 'Đúng / Sai theo mệnh đề'}
                        {q.type === 'fill_blank' && 'Điền vào chỗ trống'}
                        {q.type === 'drag_drop' && 'Ghép nối Cột A - B'}
                        {q.type === 'essay' && 'Tự luận'}
                      </span>
                    </div>

                    <span
                      className={`font-bold flex items-center gap-1 ${
                        isEssay
                          ? 'text-amber-800'
                          : isCorrect
                          ? 'text-emerald-700'
                          : 'text-rose-700'
                      }`}
                    >
                      {isEssay ? (
                        <span>
                          ⏳ {isWaiting ? 'Chờ Cô Hảo chấm' : `Đã chấm: ${pointsEarned}/${maxPoints}đ`}
                        </span>
                      ) : isCorrect ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Đúng (+{pointsEarned}/{maxPoints}đ)</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 text-rose-600" />
                          <span>Chưa đúng ({pointsEarned}/{maxPoints}đ)</span>
                        </>
                      )}
                    </span>
                  </div>

                  {/* Nội dung câu hỏi */}
                  <div className="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed">
                    <LatexRenderer
                      content={
                        q.content_json?.question ||
                        q.content_json?.prompt ||
                        q.content_json?.template ||
                        q.title ||
                        ''
                      }
                    />
                  </div>

                  {/* Chi tiết lựa chọn trắc nghiệm */}
                  {(q.type === 'single_choice' || q.type === 'multiple_choice') &&
                    q.content_json?.options && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {q.content_json.options.map((opt: string, optIdx: number) => {
                          const isChosen =
                            q.type === 'single_choice'
                              ? studentAns === optIdx
                              : Array.isArray(studentAns) && studentAns.includes(optIdx);

                          const isCorrectOpt =
                            q.type === 'single_choice'
                              ? q.correct_answer_json?.correct_index === optIdx
                              : q.correct_answer_json?.correct_indices?.includes(optIdx);

                          let bg = 'bg-slate-50 border-slate-200 text-slate-700';
                          if (isCorrectOpt) {
                            bg = 'bg-emerald-100/70 border-emerald-300 text-emerald-950 font-bold';
                          } else if (isChosen && !isCorrectOpt) {
                            bg = 'bg-rose-100 border-rose-300 text-rose-950 font-bold';
                          }

                          return (
                            <div
                              key={optIdx}
                              className={`p-2.5 rounded-xl border flex items-center gap-2 ${bg}`}
                            >
                              <span className="w-5 h-5 rounded-full bg-white text-slate-700 border flex items-center justify-center font-bold text-[10px] shrink-0">
                                {String.fromCharCode(65 + optIdx)}
                              </span>
                              <div className="flex-1 min-w-0">
                                <LatexRenderer content={opt} />
                              </div>
                              {isChosen && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-ocean-600 text-white font-bold ml-auto shrink-0">
                                  Em chọn
                                </span>
                              )}
                              {isCorrectOpt && (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 ml-auto shrink-0" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                  {/* Đúng / Sai */}
                  {q.type === 'true_false' && q.content_json?.statements && (
                    <div className="space-y-1.5 text-xs">
                      {q.content_json.statements.map((st: any) => {
                        const userChoice = studentAns?.[st.id];
                        const correctVal = q.correct_answer_json?.tf_answers?.[st.id];
                        const isStatementCorrect = userChoice === correctVal;

                        return (
                          <div
                            key={st.id}
                            className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 ${
                              isStatementCorrect
                                ? 'bg-emerald-50/50 border-emerald-200'
                                : 'bg-rose-50/50 border-rose-200'
                            }`}
                          >
                            <div className="flex-1 min-w-0 text-slate-700">
                              <LatexRenderer content={st.text} />
                            </div>
                            <div className="flex items-center gap-2 text-[11px] font-bold shrink-0">
                              <span className="text-slate-500">
                                Em chọn: {userChoice === true ? 'ĐÚNG' : userChoice === false ? 'SAI' : 'Chưa chọn'}
                              </span>
                              <span className={correctVal ? 'text-emerald-700' : 'text-rose-700'}>
                                (Đáp án: {correctVal ? 'ĐÚNG' : 'SAI'})
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Điền vào chỗ trống */}
                  {q.type === 'fill_blank' && (
                    <div className="mt-2">
                      <FillBlankQuestion
                        question={q}
                        selectedAnswers={studentAns}
                        onAnswerChange={() => {}}
                        disabled={true}
                        showCorrect={true}
                      />
                    </div>
                  )}

                  {/* Ghép nối Cột A - B */}
                  {q.type === 'drag_drop' && q.content_json?.pairs && (
                    <div className="space-y-2 text-xs">
                      {q.content_json.pairs.map((p: any, pIdx: number) => {
                        const userChoice = studentAns?.[p.id];
                        const correctVal = q.correct_answer_json?.drag_pairs?.[p.id] || p.right;
                        const isPairCorrect = userChoice === correctVal;

                        return (
                          <div
                            key={p.id || pIdx}
                            className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                              isPairCorrect
                                ? 'bg-emerald-50/60 border-emerald-200'
                                : 'bg-rose-50/60 border-rose-200'
                            }`}
                          >
                            <div className="font-bold text-slate-900 flex items-center gap-2">
                              <span className="w-5 h-5 rounded-md bg-ocean-100 text-ocean-800 text-[11px] flex items-center justify-center font-bold shrink-0">
                                {pIdx + 1}
                              </span>
                              <LatexRenderer content={p.left} />
                            </div>

                            <div className="flex flex-col sm:items-end gap-1 text-[11px]">
                              <div className="flex items-center gap-1.5">
                                <span className="text-slate-500">Em nối với:</span>
                                <strong className={isPairCorrect ? 'text-emerald-800' : 'text-rose-800'}>
                                  {userChoice || 'Chưa chọn'}
                                </strong>
                                {isPairCorrect ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 inline shrink-0" />
                                ) : (
                                  <XCircle className="w-3.5 h-3.5 text-rose-600 inline shrink-0" />
                                )}
                              </div>
                              {!isPairCorrect && (
                                <div className="text-emerald-700 font-semibold bg-emerald-100/70 px-2 py-0.5 rounded">
                                  ✓ Đáp án chuẩn: {correctVal}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Tự luận */}
                  {q.type === 'essay' && (
                    <div className="space-y-2 text-xs">
                      <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-slate-800 whitespace-pre-line">
                        <strong className="text-slate-900 block mb-1">Bài làm của em:</strong>
                        {studentAns || <em className="text-slate-400">Chưa nhập câu trả lời</em>}
                      </div>
                      {(q.correct_answer_json?.essay_sample || q.content_json?.sample_answer) && (
                        <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200 text-amber-950">
                          <strong className="block mb-0.5 text-amber-900">
                            💡 Gợi ý đáp án chuẩn từ Cô Hảo:
                          </strong>
                          {q.correct_answer_json?.essay_sample || q.content_json?.sample_answer}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Lời giải thích */}
                  {q.explanation && (
                    <div className="text-[11px] text-slate-500 font-medium pt-1 border-t border-slate-100 flex items-start gap-1">
                      <span className="text-ocean-700 font-bold shrink-0">💡 Lời giải thích:</span>
                      <span>{q.explanation}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
