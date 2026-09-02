import React, { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  FileSpreadsheet,
  FileText,
  Plus,
  Trash2,
  Clock,
  Award,
  BookOpen,
  ArrowLeft,
  CheckCircle2,
  Layers,
  Sparkles,
  Download,
  GripVertical,
} from 'lucide-react';
import { Exam, ExamCategory, Question } from '../types/database';
import { QuestionEditor } from '../components/questions/QuestionEditor';
import { parseExcelExam, parseWordExam, downloadSampleExcelTemplate, generateQuestionId, ParsedQuestionItem } from '../lib/examParsers';
import { ImportPreviewModal } from '../components/questions/ImportPreviewModal';
import { LatexRenderer } from '../components/common/LatexRenderer';

export const ExamCreateEditPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [title, setTitle] = useState<string>('Bài Kiểm Tra 15 Phút: Vị Trí Địa Lí & Địa Hình Việt Nam');
  const [description, setDescription] = useState<string>(
    'Kiểm tra đánh giá kiến thức về vị trí địa lí, phạm vi lãnh thổ và các dạng địa hình đặc trưng của nước ta.'
  );
  const [category, setCategory] = useState<ExamCategory>('thuong_xuyen');
  const [grade, setGrade] = useState<number>(6);
  const [durationMinutes, setDurationMinutes] = useState<number>(15);
  const [totalPoints, setTotalPoints] = useState<number>(10.0);

  // Danh sách câu hỏi trong đề thi
  const [questions, setQuestions] = useState<Question[]>([
    {
      id: generateQuestionId(),
      grade: 6,
      type: 'single_choice',
      title: 'Vị trí địa lí của Việt Nam nằm ở khu vực nào?',
      content_json: {
        question: 'Việt Nam nằm ở rìa phía đông của bán đảo Trung Ấn, tiếp giáp với biển nào?',
        options: ['Biển Đông', 'Biển Nhật Bản', 'Biển Đỏ', 'Biển Ban-tích'],
      },
      correct_answer_json: { correct_index: 0 },
      explanation: 'Việt Nam tiếp giáp với Biển Đông ở phía đông và phía nam.',
      points: 2.0,
      tags: ['Vị trí', 'Khối 6'],
    },
    {
      id: generateQuestionId(),
      grade: 6,
      type: 'single_choice',
      title: 'Đố vui thơ lục bát về địa danh',
      content_json: {
        question: 'Câu thơ đố vui Địa lí:\n"Bình Định có núi Vọng Phu\nCó đầm Thị Nại, có cù lao Xanh"\n\nĐầm Thị Nại thuộc tỉnh nào của nước ta?',
        options: ['Bình Định', 'Phú Yên', 'Quảng Nam', 'Khánh Hòa'],
      },
      correct_answer_json: { correct_index: 0 },
      explanation: 'Đầm Thị Nại thuộc tỉnh Bình Định.',
      points: 2.0,
      tags: ['Thơ lục bát', 'Khối 6'],
    },
    {
      id: generateQuestionId(),
      grade: 6,
      type: 'true_false',
      title: 'Xét tính đúng/sai về địa hình nước ta',
      content_json: {
        question: 'Xét tính Đúng / Sai của các nhận định sau:',
        statements: [
          { id: 'tf_1', text: 'Đồi núi chiếm 3/4 diện tích lãnh thổ nước ta.' },
          { id: 'tf_2', text: 'Đồng bằng chiếm phần lớn diện tích lãnh thổ nước ta.' },
        ],
      },
      correct_answer_json: { tf_answers: { tf_1: true, tf_2: false } },
      explanation: 'Đồi núi chiếm 3/4 diện tích, đồng bằng chỉ chiếm 1/4 diện tích lãnh thổ.',
      points: 2.0,
      tags: ['Địa hình', 'Khối 6'],
    },
    {
      id: generateQuestionId(),
      grade: 6,
      type: 'fill_blank',
      title: 'Điền tên đỉnh núi cao nhất',
      content_json: {
        template: 'Đỉnh núi cao nhất Việt Nam là đỉnh [blank_1] thuộc dãy núi Hoàng Liên Sơn.',
        blanks: [{ id: 'blank_1', placeholder: 'Tên đỉnh núi' }],
      },
      correct_answer_json: { blank_answers: { blank_1: ['Phan-xi-păng', 'Fansipan'] } },
      explanation: 'Fansipan cao 3.143m.',
      points: 2.0,
      tags: ['Đỉnh núi', 'Khối 6'],
    },
    {
      id: generateQuestionId(),
      grade: 6,
      type: 'essay',
      title: 'Ý nghĩa tự nhiên của vị trí địa lí',
      content_json: {
        prompt: 'Em hãy nêu 2 thuận lợi cơ bản do vị trí địa lí mang lại cho thiên nhiên nước ta.',
        sample_answer: '1. Khí hậu nhiệt đới ẩm dồi dào ánh sáng và nước mưa;\n2. Sinh vật phong phú, đa dạng.',
      },
      correct_answer_json: { essay_sample: 'Học sinh nêu đúng 2 thuận lợi về khí hậu và sinh vật.' },
      explanation: 'Vị trí địa lí quy định tính chất nhiệt đới ẩm gió mùa của tự nhiên Việt Nam.',
      points: 2.0,
      tags: ['Tự luận', 'Khối 6'],
    },
  ]);

  const [isQuestionEditorOpen, setIsQuestionEditorOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  // Modal Xem Trước (Preview) Đề Thi Import từ Word / Excel
  const [previewModalState, setPreviewModalState] = useState<{
    isOpen: boolean;
    fileName: string;
    fileType: 'word' | 'excel';
    parsedQuestions: ParsedQuestionItem[];
    currentExistingCount: number;
    targetLessonTitle: string;
  }>({
    isOpen: false,
    fileName: '',
    fileType: 'word',
    parsedQuestions: [],
    currentExistingCount: 0,
    targetLessonTitle: '',
  });

  // Import từ File Excel (.xlsx)
  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const result = await parseExcelExam(file, grade);
    if (result.questions.length > 0) {
      setPreviewModalState({
        isOpen: true,
        fileName: file.name,
        fileType: 'excel',
        parsedQuestions: result.questions,
        currentExistingCount: questions.length,
        targetLessonTitle: title || `Đề thi Khối ${grade}`,
      });
    } else {
      alert(result.errors.join('\n') || 'Không tìm thấy câu hỏi trong file Excel.');
    }
    e.target.value = '';
  };

  // Import từ File Word (.docx)
  const handleImportWord = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const result = await parseWordExam(file, grade);
    if (result.questions.length > 0) {
      setPreviewModalState({
        isOpen: true,
        fileName: file.name,
        fileType: 'word',
        parsedQuestions: result.questions,
        currentExistingCount: questions.length,
        targetLessonTitle: title || `Đề thi Khối ${grade}`,
      });
    } else {
      alert(result.errors.join('\n') || 'Không tìm thấy câu hỏi trong file Word.');
    }
    e.target.value = '';
  };

  // Xác nhận nạp câu hỏi từ Preview Modal vào đề thi
  const handleConfirmImportFromPreview = (selectedQuestions: Question[]) => {
    setQuestions([...questions, ...selectedQuestions]);
    alert(`🎉 Đã nạp thành công ${selectedQuestions.length} câu hỏi vào đề thi!`);
  };

  // Thêm hoặc Cập nhật câu hỏi từ Editor
  const handleSaveQuestion = (q: Question) => {
    if (editingQuestion) {
      setQuestions(questions.map((item) => (item.id === q.id ? q : item)));
    } else {
      setQuestions([...questions, q]);
    }
    setIsQuestionEditorOpen(false);
    setEditingQuestion(null);
  };

  // Xóa câu hỏi
  const handleDeleteQuestion = (qId: string) => {
    setQuestions(questions.filter((q) => q.id !== qId));
  };

  // Lưu Đề Thi Hoàn Chỉnh
  const handleSaveExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Cô vui lòng nhập Tiêu đề đề thi!');
      return;
    }
    if (questions.length === 0) {
      alert('Đề thi cần có ít nhất 1 câu hỏi!');
      return;
    }

    const examData: Partial<Exam> = {
      id: id || 'ex_' + Date.now(),
      title,
      description,
      category,
      grade,
      duration_minutes: durationMinutes,
      total_points: totalPoints,
      questions_list: questions,
      is_published: true,
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured) {
      await supabase.from('exams').upsert(examData);
    }

    alert('Đã lưu Đề thi thành công! Cô có thể tiến hành Giao bài cho các lớp ngay.');
    navigate('/assignments');
  };

  const sumPoints = questions.reduce((sum, q) => sum + (Number(q.points) || 1.0), 0);

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-300 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          to="/questions"
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-ocean-700 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Quay Lại Kho Đề
        </Link>
        <div className="text-xs font-semibold text-ocean-700 bg-ocean-50 px-3 py-1 rounded-full border border-ocean-200">
          Chế độ Soạn & Tạo Đề Thi Tự Động
        </div>
      </div>

      <form onSubmit={handleSaveExam} className="space-y-6">
        {/* Khối 1: Thông tin Chung của Đề Thi */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="w-11 h-11 rounded-2xl bg-ocean-50 text-ocean-700 flex items-center justify-center font-bold">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">
                {id ? 'Chỉnh Sửa Đề Kiểm Tra' : 'Soạn Đề Kiểm Tra Địa Lí Mới'}
              </h2>
              <p className="text-xs text-slate-500">
                Thiết lập thời gian làm bài, phân loại đề thi và danh mục câu hỏi
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tiêu đề Đề Kiểm Tra:
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="VD: Kiểm tra 15 phút: Vị trí Địa lí & Bản đồ Việt Nam"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-bold text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-ocean-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mô tả / Hướng dẫn học sinh:
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="VD: Đề gồm 5 câu hỏi, các em đọc kĩ yêu cầu và làm bài trong thời gian quy định..."
                className="w-full px-4 py-2 rounded-xl border border-slate-300 text-xs font-normal text-slate-700 focus:outline-none focus:ring-2 focus:ring-ocean-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Phân loại Đề:
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ExamCategory)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-ocean-500 bg-white"
                >
                  <option value="thuong_xuyen">Đánh giá Thường xuyên (15p/Bài tập)</option>
                  <option value="giua_ki_1">Giữa Học Kì I</option>
                  <option value="hoc_ki_1">Cuối Học Kì I</option>
                  <option value="giua_ki_2">Giữa Học Kì II</option>
                  <option value="hoc_ki_2">Cuối Học Kì II</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Khối Lớp:
                </label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-ocean-500 bg-white"
                >
                  <option value={6}>Khối 6 (Lớp 6)</option>
                  <option value={7}>Khối 7 (Lớp 7)</option>
                  <option value={8}>Khối 8 (Lớp 8)</option>
                  <option value={9}>Khối 9 (Lớp 9)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Thời Gian Làm Bài (Phút):
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="5"
                    max="180"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs font-bold focus:ring-2 focus:ring-ocean-500"
                    required
                  />
                  <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Thang Điểm Tối Đa:
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={totalPoints}
                    onChange={(e) => setTotalPoints(Number(e.target.value))}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs font-bold focus:ring-2 focus:ring-ocean-500"
                    required
                  />
                  <Award className="w-4 h-4 text-amber-500 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Khối 2: Danh Sách Câu Hỏi Trong Đề */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <span>Danh Sách Câu Hỏi ({questions.length} câu)</span>
                <span className="text-xs bg-ocean-100 text-ocean-800 font-bold px-2.5 py-0.5 rounded-full">
                  Tổng điểm: {sumPoints.toFixed(1)} / {totalPoints} điểm
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Cô có thể soạn trực tiếp hoặc nhập đề tự động từ Word/Excel
              </p>
            </div>

            {/* Các Nút Thêm Câu Hỏi */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={downloadSampleExcelTemplate}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
                title="Tải file Excel mẫu"
              >
                <Download className="w-3.5 h-3.5" /> Mẫu Excel
              </button>

              <label className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold cursor-pointer transition">
                <FileSpreadsheet className="w-3.5 h-3.5" /> Import Excel
                <input type="file" accept=".xlsx, .xls" onChange={handleImportExcel} className="hidden" />
              </label>

              <label className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold cursor-pointer transition">
                <FileText className="w-3.5 h-3.5" /> Import Word
                <input type="file" accept=".docx" onChange={handleImportWord} className="hidden" />
              </label>

              <button
                type="button"
                onClick={() => {
                  setEditingQuestion(null);
                  setIsQuestionEditorOpen(true);
                }}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-ocean-600 hover:bg-ocean-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition"
              >
                <Plus className="w-3.5 h-3.5" /> Soạn Câu Mới
              </button>
            </div>
          </div>

          {/* Danh sách câu hỏi */}
          <div className="space-y-3">
            {questions.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-slate-300 rounded-2xl text-slate-400 text-xs">
                Chưa có câu hỏi nào trong đề thi. Bấm "Soạn Câu Mới" hoặc "Import Word/Excel" ở trên để thêm câu hỏi.
              </div>
            ) : (
              questions.map((q, idx) => (
                <div
                  key={q.id || idx}
                  className="p-4 rounded-2xl border border-slate-200 hover:border-ocean-300 transition bg-slate-50/50 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-slate-800 text-white font-bold text-xs flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="text-[11px] font-bold text-ocean-700 bg-ocean-50 px-2.5 py-0.5 rounded-full border border-ocean-200">
                        {q.type}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500">
                        {q.points} điểm
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingQuestion(q);
                          setIsQuestionEditorOpen(true);
                        }}
                        className="text-xs font-bold text-ocean-600 hover:text-ocean-700 p-1"
                      >
                        Sửa
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="text-xs font-bold text-red-600 hover:text-red-700 p-1"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>

                  <div className="text-xs sm:text-sm font-semibold text-slate-800 leading-relaxed pl-1">
                    <LatexRenderer
                      content={
                        q.content_json?.question ||
                        q.content_json?.prompt ||
                        q.content_json?.template ||
                        q.title
                      }
                      isPoetry={q.title.includes('thơ') || q.title.includes('Đố vui')}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Thanh Nút Lưu Đề */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            to="/questions"
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
          >
            Hủy Bỏ
          </Link>
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-ocean-600 hover:bg-ocean-700 active:scale-95 text-white text-xs sm:text-sm font-bold shadow-md transition"
          >
            <CheckCircle2 className="w-4 h-4" />
            Lưu & Xuất Bản Đề Thi Này
          </button>
        </div>
      </form>

      {/* Modal Soạn Câu Hỏi */}
      {isQuestionEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <QuestionEditor
            initialQuestion={editingQuestion}
            onSave={handleSaveQuestion}
            onCancel={() => {
              setIsQuestionEditorOpen(false);
              setEditingQuestion(null);
            }}
          />
        </div>
      )}

      {/* Modal Xem Trước (Preview) Đề Thi Import từ Word / Excel */}
      <ImportPreviewModal
        isOpen={previewModalState.isOpen}
        onClose={() => setPreviewModalState((prev) => ({ ...prev, isOpen: false }))}
        fileName={previewModalState.fileName}
        fileType={previewModalState.fileType}
        parsedQuestions={previewModalState.parsedQuestions}
        currentExistingCount={previewModalState.currentExistingCount}
        targetLessonTitle={previewModalState.targetLessonTitle}
        onConfirmImport={handleConfirmImportFromPreview}
      />
    </div>
  );
};
