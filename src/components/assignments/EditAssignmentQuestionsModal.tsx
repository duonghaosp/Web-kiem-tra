import React, { useState, useMemo } from 'react';
import { Assignment, Question, QuestionType } from '../../types/database';
import { getStoredQuestions } from '../../data/questionBank';
import { getStoredLessons } from '../../data/curriculum';
import { LatexRenderer } from '../common/LatexRenderer';
import { triggerCelebration } from '../../lib/gamification';
import {
  X,
  Plus,
  Trash2,
  BookOpen,
  Search,
  AlertCircle,
  Calculator,
  PlusCircle,
  Save,
} from 'lucide-react';

interface EditAssignmentQuestionsModalProps {
  isOpen: boolean;
  assignment: Assignment;
  onClose: () => void;
  onSave: (updatedAssignment: Assignment) => Promise<void> | void;
}

export const EditAssignmentQuestionsModal: React.FC<EditAssignmentQuestionsModalProps> = ({
  isOpen,
  assignment,
  onClose,
  onSave,
}) => {
  if (!isOpen) return null;

  // 1. Quản lý danh sách câu hỏi trong đề
  const [currentQuestions, setCurrentQuestions] = useState<Question[]>(() => {
    return assignment.questions && assignment.questions.length > 0
      ? [...assignment.questions]
      : [];
  });

  const [activeTab, setActiveTab] = useState<'current' | 'add'>('current');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [selectedLessonId, setSelectedLessonId] = useState<string>('all');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Lấy toàn bộ câu hỏi và bài học của khối
  const allBankQuestions = useMemo(() => getStoredQuestions(), []);
  const allLessons = useMemo(() => getStoredLessons(), []);

  const grade = assignment.grade || 7;
  const gradeLessons = useMemo(() => {
    return allLessons.filter((l) => l.grade === grade);
  }, [allLessons, grade]);

  // Danh sách câu hỏi trong kho thuộc khối này
  const gradeQuestions = useMemo(() => {
    return allBankQuestions.filter((q) => q.grade === grade);
  }, [allBankQuestions, grade]);

  // Lọc câu hỏi trong kho để thêm vào đề
  const availableToAddQuestions = useMemo(() => {
    return gradeQuestions.filter((q) => {
      // Bỏ qua câu đã có trong đề
      const alreadyInExam = currentQuestions.some((item) => item.id === q.id);
      if (alreadyInExam) return false;

      // Lọc theo bài học
      if (selectedLessonId !== 'all') {
        const matchLesson = q.lesson_id === selectedLessonId;
        const matchTitle = gradeLessons.find((l) => l.id === selectedLessonId);
        const matchCategory = matchTitle && q.category === matchTitle.title;
        if (!matchLesson && !matchCategory) return false;
      }

      // Lọc theo từ khóa tìm kiếm
      if (searchKeyword.trim()) {
        const kw = searchKeyword.toLowerCase();
        const titleMatch = (q.title || '').toLowerCase().includes(kw);
        const textMatch = (q.content_json?.question || '').toLowerCase().includes(kw);
        if (!titleMatch && !textMatch) return false;
      }

      return true;
    });
  }, [gradeQuestions, currentQuestions, selectedLessonId, searchKeyword, gradeLessons]);

  // Tính tổng điểm hiện tại
  const totalScore = useMemo(() => {
    return currentQuestions.reduce((sum, q) => sum + (q.points || 1.0), 0);
  }, [currentQuestions]);

  // Thêm 1 câu hỏi vào đề
  const handleAddQuestion = (q: Question) => {
    const newQ = { ...q, points: q.points || 1.0 };
    setCurrentQuestions((prev) => [...prev, newQ]);
  };

  // Thêm tất cả câu hỏi đang lọc vào đề
  const handleAddAllFiltered = () => {
    if (availableToAddQuestions.length === 0) return;
    const additions = availableToAddQuestions.map((q) => ({
      ...q,
      points: q.points || 1.0,
    }));
    setCurrentQuestions((prev) => [...prev, ...additions]);
  };

  // Xóa 1 câu hỏi khỏi đề
  const handleRemoveQuestion = (qId: string) => {
    setCurrentQuestions((prev) => prev.filter((q) => q.id !== qId));
  };

  // Cập nhật điểm cho từng câu
  const handleUpdatePoints = (qId: string, pts: number) => {
    const validPts = Math.max(0.1, Number(pts) || 1.0);
    setCurrentQuestions((prev) =>
      prev.map((q) => (q.id === qId ? { ...q, points: validPts } : q))
    );
  };

  // Chia đều tổng 10 điểm cho tất cả các câu
  const handleAutoDistribute10Points = () => {
    if (currentQuestions.length === 0) return;
    const count = currentQuestions.length;
    const pointPerQ = Number((10 / count).toFixed(2));
    setCurrentQuestions((prev) =>
      prev.map((q) => ({ ...q, points: pointPerQ }))
    );
  };

  // Lưu đề thi đã chỉnh sửa
  const handleSave = async () => {
    if (currentQuestions.length === 0) {
      alert('Cô Hảo ơi, đề thi cần có ít nhất 1 câu hỏi nhé!');
      return;
    }

    setIsSaving(true);
    try {
      const updatedAssignment: Assignment = {
        ...assignment,
        questions: currentQuestions,
        questions_count: currentQuestions.length,
        total_points: Number(totalScore.toFixed(2)),
      };

      await onSave(updatedAssignment);
      triggerCelebration();
      alert(
        `🎉 Cập nhật đề thi thành công!\n\n` +
        `• Tên đề: ${updatedAssignment.title}\n` +
        `• Số lượng: ${currentQuestions.length} câu hỏi\n` +
        `• Tổng điểm: ${totalScore.toFixed(1)}đ\n` +
        `Dữ liệu đã được đồng bộ ngay lập tức lên đám mây cho học sinh.`
      );
      onClose();
    } catch (err) {
      console.error(err);
      alert('Có lỗi khi lưu thay đổi đề thi. Cô vui lòng thử lại nhé!');
    } finally {
      setIsSaving(false);
    }
  };

  const getTypeName = (t: QuestionType) => {
    switch (t) {
      case 'single_choice':
        return 'Trắc nghiệm 1 đáp án';
      case 'multiple_choice':
        return 'Nhiều đáp án đúng';
      case 'true_false':
        return 'Đúng / Sai mệnh đề';
      case 'fill_blank':
        return 'Điền chỗ trống';
      case 'drag_drop':
        return 'Kéo thả / Nối từ';
      case 'essay':
        return 'Tự luận';
      default:
        return 'Trắc nghiệm';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl border border-slate-100 space-y-4 my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95">
        {/* 1. HEADER MODAL */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 shrink-0">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 font-bold shadow-2xs">
              <BookOpen className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-1.5 mb-1">
                <span className="text-[11px] font-black bg-indigo-50 text-indigo-800 border border-indigo-200 px-2 py-0.5 rounded-full">
                  Chỉnh Sửa Đề Thi
                </span>
                <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                  Khối {grade} • {assignment.target_ids?.join(', ') || 'Chung'}
                </span>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                  {currentQuestions.length} câu • Tổng {totalScore.toFixed(1)}đ
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 line-clamp-1">
                {assignment.title}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="self-end sm:self-auto p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            title="Đóng cửa sổ"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. THANH CHUYỂN TAB */}
        <div className="flex items-center justify-between gap-2 shrink-0 border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('current')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'current'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <span>Câu hỏi trong đề</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                activeTab === 'current' ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {currentQuestions.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('add')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'add'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>+ Thêm câu từ kho đề</span>
            </button>
          </div>

          {activeTab === 'current' && currentQuestions.length > 0 && (
            <button
              type="button"
              onClick={handleAutoDistribute10Points}
              className="flex items-center gap-1 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold transition cursor-pointer"
              title="Tự động chia đều điểm số của tất cả câu hỏi sao cho tổng bằng 10.0đ"
            >
              <Calculator className="w-3.5 h-3.5 text-amber-600" />
              <span>Chia đều 10 điểm</span>
            </button>
          )}
        </div>

        {/* 3. NỘI DUNG CHÍNH (CUỘN ĐƯỢC) */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 min-h-[300px] max-h-[55vh]">
          {/* TAB 1: CÂU HỎI TRONG ĐỀ HIỆN TẠI */}
          {activeTab === 'current' && (
            <div>
              {currentQuestions.length === 0 ? (
                <div className="text-center py-12 px-4 bg-slate-50 border border-dashed border-slate-200 rounded-3xl space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">
                      Đề thi hiện chưa có câu hỏi nào!
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Cô hãy chuyển sang tab <strong>"+ Thêm câu từ kho đề"</strong> để chọn câu hỏi đưa vào đề nhé!
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('add')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-xs transition active:scale-95 cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Mở kho đề để thêm câu hỏi</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {currentQuestions.map((q, idx) => (
                    <div
                      key={q.id || idx}
                      className="p-3.5 bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 transition shadow-2xs space-y-2"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white text-[11px] font-black flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                            {getTypeName(q.type)}
                          </span>
                          {q.category && (
                            <span className="text-[10px] font-medium text-slate-500 line-clamp-1 max-w-[220px]">
                              {q.category}
                            </span>
                          )}
                        </div>

                        {/* Điểm số & Nút Xóa */}
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-xl border border-slate-200">
                            <span className="text-[10px] font-bold text-slate-500">Điểm:</span>
                            <input
                              type="number"
                              step="0.25"
                              min="0.1"
                              max="10"
                              value={q.points || 1.0}
                              onChange={(e) => handleUpdatePoints(q.id, Number(e.target.value))}
                              className="w-14 px-1.5 py-0.5 bg-white border border-slate-300 rounded text-center text-xs font-black text-indigo-700 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                            />
                            <span className="text-[10px] font-bold text-slate-500">đ</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveQuestion(q.id)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                            title="Xóa câu này khỏi đề thi"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Nội dung câu hỏi */}
                      <div className="text-xs font-semibold text-slate-800 leading-relaxed pl-8">
                        <LatexRenderer
                          content={q.content_json?.question || q.title || 'Câu hỏi'}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: THÊM CÂU TỪ KHO ĐỀ */}
          {activeTab === 'add' && (
            <div className="space-y-3">
              {/* Bộ lọc bài học & tìm kiếm */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Lọc theo bài học Khối {grade}:
                  </label>
                  <select
                    value={selectedLessonId}
                    onChange={(e) => setSelectedLessonId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="all">Tất cả các bài học ({gradeLessons.length} bài)</option>
                    {gradeLessons.map((l) => (
                      <option key={l.id} value={l.id}>
                        Bài {l.lesson_number}: {l.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Tìm kiếm từ khóa câu hỏi:
                  </label>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="Nhập từ khóa tìm kiếm..."
                      value={searchKeyword}
                      onChange={(e) => setSearchKeyword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Thông tin số lượng câu sẵn sàng thêm */}
              <div className="flex items-center justify-between text-xs px-1">
                <span className="text-slate-600 font-medium">
                  Tìm thấy <strong className="text-emerald-700">{availableToAddQuestions.length}</strong> câu hỏi có thể thêm vào đề
                </span>
                {availableToAddQuestions.length > 0 && (
                  <button
                    type="button"
                    onClick={handleAddAllFiltered}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm tất cả {availableToAddQuestions.length} câu này</span>
                  </button>
                )}
              </div>

              {/* Danh sách câu hỏi có thể thêm */}
              {availableToAddQuestions.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500">
                  Không còn câu hỏi nào phù hợp với bộ lọc này (hoặc tất cả câu đã được đưa vào đề).
                </div>
              ) : (
                <div className="space-y-2">
                  {availableToAddQuestions.map((q) => (
                    <div
                      key={q.id}
                      className="p-3 bg-white rounded-2xl border border-slate-200 hover:border-emerald-300 transition flex items-start justify-between gap-3 shadow-2xs"
                    >
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {getTypeName(q.type)}
                          </span>
                          <span className="text-[10px] font-medium text-slate-500">
                            {q.category || `Khối ${q.grade}`}
                          </span>
                        </div>
                        <div className="text-xs font-medium text-slate-800 line-clamp-2">
                          <LatexRenderer
                            content={q.content_json?.question || q.title || 'Câu hỏi'}
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAddQuestion(q)}
                        className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition active:scale-95 flex items-center gap-1 shrink-0 cursor-pointer shadow-2xs"
                      >
                        <Plus className="w-3.5 h-3.5 text-emerald-600" />
                        <span>+ Thêm</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 4. FOOTER MODAL */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 shrink-0">
          <div className="text-xs text-slate-600 font-medium">
            Đề thi sau chỉnh sửa: <strong className="text-indigo-900 font-black">{currentQuestions.length} câu hỏi</strong> • Tổng điểm: <strong className="text-emerald-700 font-black">{totalScore.toFixed(1)}đ</strong>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            >
              Hủy bỏ
            </button>

            <button
              type="button"
              disabled={isSaving || currentQuestions.length === 0}
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-ocean-600 hover:from-indigo-700 hover:to-ocean-700 text-white text-xs font-black shadow-md transition active:scale-95 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <span>Đang lưu...</span>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Lưu Thay Đổi & Cập Nhật Đám Mây</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
