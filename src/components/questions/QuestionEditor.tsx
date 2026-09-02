import React, { useState } from 'react';
import { Question, QuestionType } from '../../types/database';
import { LatexRenderer } from '../common/LatexRenderer';
import { RichTextEditor } from '../common/RichTextEditor';
import { Plus, Trash2, CheckCircle2, Eye, HelpCircle, BookOpen, Sparkles, Image as ImageIcon, Upload, Link2, ZoomIn, X, Crop, AlertCircle } from 'lucide-react';
import { generateQuestionId } from '../../lib/examParsers';
import { getStoredLessons } from '../../data/curriculum';
import { formatGeoMathSymbols, COMMON_GEO_SYMBOLS } from '../../lib/geoSymbolFormatter';
import { ImageZoomModal } from '../common/ImageZoomModal';
import { ImageCropModal } from '../common/ImageCropModal';
import { compressImage } from '../../lib/imageCompressor';

interface QuestionEditorProps {
  initialQuestion?: Question | null;
  defaultGrade?: number;
  defaultLessonId?: string;
  defaultLessonTitle?: string;
  onSave: (question: Question) => void;
  onCancel: () => void;
}

export const QuestionEditor: React.FC<QuestionEditorProps> = ({
  initialQuestion,
  defaultGrade = 6,
  defaultLessonId,
  defaultLessonTitle,
  onSave,
  onCancel,
}) => {
  const [type, setType] = useState<QuestionType>(initialQuestion?.type || 'single_choice');
  const [grade, setGrade] = useState<number>(initialQuestion?.grade || defaultGrade || 6);

  const allLessons = getStoredLessons();
  const gradeLessons = allLessons.filter((l) => l.grade === grade);

  const [lessonId, setLessonId] = useState<string>(() => {
    if (initialQuestion?.lesson_id) return initialQuestion.lesson_id;
    if (defaultLessonId) return defaultLessonId;
    return gradeLessons[0]?.id || 'g6_b1';
  });

  const [category, setCategory] = useState<string>(() => {
    if (initialQuestion?.category) return initialQuestion.category;
    if (defaultLessonTitle) return defaultLessonTitle;
    return gradeLessons[0]?.title || 'Bài 1: Hệ thống kinh, vĩ tuyến và tọa độ địa lí';
  });

  const [title, setTitle] = useState<string>(initialQuestion?.title || '');
  const [points, setPoints] = useState<number>(initialQuestion?.points || 1.0);
  const [explanation, setExplanation] = useState<string>(initialQuestion?.explanation || '');
  const [tags, setTags] = useState<string>(initialQuestion?.tags?.join(', ') || 'Địa lí THCS');
  const [previewMode, setPreviewMode] = useState<boolean>(false);

  // Vị trí ô nhập liệu đang được trỏ tới để chèn ký hiệu nhanh
  const [activeField, setActiveField] = useState<{ name: string; index?: number }>({ name: 'question' });

  // Hình ảnh minh họa / Tư liệu quan sát (Bản đồ, Biểu đồ, Bảng số liệu)
  const [imageUrl, setImageUrl] = useState<string>(
    initialQuestion?.content_json?.image_url || ''
  );
  const [imageCaption, setImageCaption] = useState<string>(
    initialQuestion?.content_json?.image_caption || ''
  );
  const [imageUrlInput, setImageUrlInput] = useState<string>('');
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);

  // Ảnh đính kèm cho từng phương án lựa chọn A, B, C, D
  const [optionImages, setOptionImages] = useState<(string | null)[]>(
    initialQuestion?.content_json?.option_images || ['', '', '', '']
  );
  const [zoomModalData, setZoomModalData] = useState<{ isOpen: boolean; url: string; caption?: string }>({
    isOpen: false,
    url: '',
    caption: '',
  });

  // Modal Cắt / Xoay / Chỉnh sửa ảnh (Gợi ý 4)
  const [cropModalData, setCropModalData] = useState<{
    isOpen: boolean;
    imageUrl: string;
    title: string;
    target: 'main' | { optionIndex: number };
  }>({
    isOpen: false,
    imageUrl: '',
    title: '',
    target: 'main',
  });

  // Thông số nén và cảnh báo dung lượng (Gợi ý 3)
  const [imageStats, setImageStats] = useState<{
    originalSize: number;
    compressedSize: number;
    reductionPercent: number;
  } | null>(null);

  const [fileSizeWarning, setFileSizeWarning] = useState<string | null>(null);

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file hình ảnh hợp lệ (PNG, JPG, JPEG, WEBP, SVG)!');
      return;
    }

    // Cảnh báo nếu file quá lớn (> 20MB)
    if (file.size > 20 * 1024 * 1024) {
      alert('File ảnh quá lớn (> 20MB). Cô vui lòng chọn ảnh dung lượng dưới 20MB để đảm bảo máy tính xử lý mượt mà nhé!');
      return;
    }

    // Cảnh báo thân thiện nếu file > 8MB (Gợi ý 3)
    if (file.size > 8 * 1024 * 1024) {
      setFileSizeWarning(
        `⚠️ Bức ảnh này khá lớn (${(file.size / (1024 * 1024)).toFixed(1)} MB). Hệ thống đã tự động nén tối ưu xuống mức siêu nhẹ cho học sinh!`
      );
    } else {
      setFileSizeWarning(null);
    }

    try {
      setIsUploadingImage(true);
      // Tự động nén tối ưu: Max 1200px, chất lượng 0.8, dung lượng siêu nhẹ ~100KB mà vẫn sắc nét
      const compressedBase64 = await compressImage(file, 1200, 1200, 0.8);
      setImageUrl(compressedBase64);

      // Thống kê tỷ lệ nén (Gợi ý 3)
      const originalBytes = file.size;
      const compressedBytes = Math.round(compressedBase64.length * 0.75);
      const percent = Math.round(((originalBytes - compressedBytes) / originalBytes) * 100);
      setImageStats({
        originalSize: originalBytes,
        compressedSize: compressedBytes,
        reductionPercent: Math.max(0, percent),
      });
    } catch (err) {
      console.error('Lỗi xử lý ảnh:', err);
      alert('Đã xảy ra lỗi khi xử lý hình ảnh. Cô vui lòng thử lại nhé!');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleOptionImageFileChange = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file hình ảnh hợp lệ (PNG, JPG, JPEG, WEBP, SVG)!');
      return;
    }

    try {
      // Ảnh phương án nhỏ gọn: Max 600px, chất lượng 0.8
      const compressedBase64 = await compressImage(file, 600, 600, 0.8);
      const updated = [...optionImages];
      updated[index] = compressedBase64;
      setOptionImages(updated);
    } catch (err) {
      console.error('Lỗi xử lý ảnh phương án:', err);
      alert('Đã xảy ra lỗi khi xử lý ảnh phương án!');
    }
  };

  const handleRemoveOptionImage = (index: number) => {
    const updated = [...optionImages];
    updated[index] = null;
    setOptionImages(updated);
  };

  // State cho 6 dạng câu hỏi
  // 1 & 2. Single & Multiple
  const [questionText, setQuestionText] = useState<string>(
    initialQuestion?.content_json?.question ||
    initialQuestion?.content_json?.prompt ||
    initialQuestion?.title ||
    ''
  );
  const [options, setOptions] = useState<string[]>(
    initialQuestion?.content_json?.options || ['', '', '', '']
  );
  const [singleCorrect, setSingleCorrect] = useState<number>(
    initialQuestion?.correct_answer_json?.correct_index ?? 0
  );
  const [multiCorrect, setMultiCorrect] = useState<number[]>(
    initialQuestion?.correct_answer_json?.correct_indices || [0]
  );

  // 3. True / False
  const [tfStatements, setTfStatements] = useState<Array<{ id: string; text: string; isTrue: boolean }>>(() => {
    if (initialQuestion?.content_json?.statements) {
      return initialQuestion.content_json.statements.map((s: any) => ({
        id: s.id,
        text: s.text,
        isTrue: initialQuestion?.correct_answer_json?.tf_answers?.[s.id] ?? true,
      }));
    }
    return [
      { id: 'tf_1', text: '', isTrue: true },
      { id: 'tf_2', text: '', isTrue: true },
      { id: 'tf_3', text: '', isTrue: false },
      { id: 'tf_4', text: '', isTrue: false },
    ];
  });

  // 4. Fill in the Blank
  const [fillTemplate, setFillTemplate] = useState<string>(() => {
    if (initialQuestion) {
      return (
        initialQuestion.content_json?.template ||
        initialQuestion.content_json?.question ||
        initialQuestion.title ||
        ''
      );
    }
    return '';
  });

  const [fillAnswers, setFillAnswers] = useState<Array<{ id: string; answer: string }>>(() => {
    if (initialQuestion) {
      const blankAnswersObj =
        initialQuestion.correct_answer_json?.blank_answers ||
        initialQuestion.content_json?.blank_answers;

      if (blankAnswersObj && typeof blankAnswersObj === 'object') {
        const keys = Object.keys(blankAnswersObj);
        if (keys.length > 0) {
          return keys.map((key) => {
            const rawVal = blankAnswersObj[key];
            const ans = Array.isArray(rawVal)
              ? rawVal[0]
              : typeof rawVal === 'string'
              ? rawVal
              : '';
            return { id: key, answer: ans || '' };
          });
        }
      }

      const blanksList = initialQuestion.content_json?.blanks;
      if (Array.isArray(blanksList) && blanksList.length > 0) {
        return blanksList.map((b: any, idx: number) => ({
          id: b.id || `blank_${idx + 1}`,
          answer:
            b.answer ||
            b.correct_answer ||
            (Array.isArray(b.answers) ? b.answers[0] : '') ||
            '',
        }));
      }
    }

    return [
      { id: 'blank_1', answer: '' },
    ];
  });

  // 5. Drag & Drop Pairs
  const [dragPairs, setDragPairs] = useState<Array<{ id: string; left: string; right: string }>>(() => {
    if (initialQuestion) {
      if (Array.isArray(initialQuestion.content_json?.pairs) && initialQuestion.content_json.pairs.length > 0) {
        return initialQuestion.content_json.pairs;
      }
      const leftList = initialQuestion.content_json?.left_items || [];
      const rightList = initialQuestion.content_json?.right_items || [];
      const correctPairs = initialQuestion.correct_answer_json?.drag_pairs || {};
      if (leftList.length > 0) {
        return leftList.map((item: any, idx: number) => {
          const id = typeof item === 'object' ? item.id : `p_${idx + 1}`;
          const leftText = typeof item === 'object' ? item.text : item;
          const rightText = correctPairs[id] || (rightList[idx] ? (typeof rightList[idx] === 'object' ? rightList[idx].text : rightList[idx]) : '');
          return { id, left: leftText, right: rightText };
        });
      }
    }
    return [
      { id: 'p1', left: '', right: '' },
      { id: 'p2', left: '', right: '' },
      { id: 'p3', left: '', right: '' },
      { id: 'p4', left: '', right: '' },
    ];
  });

  // 6. Essay
  const [essaySample, setEssaySample] = useState<string>(
    initialQuestion?.correct_answer_json?.essay_sample ||
    initialQuestion?.content_json?.sample_answer ||
    ''
  );

  // Hàm chèn ký hiệu nhanh vào ô nhập liệu đang trỏ
  const insertSymbol = (sym: string) => {
    if (activeField.name === 'question') {
      setQuestionText((prev) => prev + sym);
    } else if (activeField.name === 'option' && activeField.index !== undefined) {
      const idx = activeField.index;
      const updated = [...options];
      updated[idx] = (updated[idx] || '') + sym;
      setOptions(updated);
    } else if (activeField.name === 'statement' && activeField.index !== undefined) {
      const idx = activeField.index;
      const updated = [...tfStatements];
      updated[idx].text = (updated[idx].text || '') + sym;
      setTfStatements(updated);
    } else if (activeField.name === 'drag_left' && activeField.index !== undefined) {
      const idx = activeField.index;
      const updated = [...dragPairs];
      updated[idx].left = (updated[idx].left || '') + sym;
      setDragPairs(updated);
    } else if (activeField.name === 'drag_right' && activeField.index !== undefined) {
      const idx = activeField.index;
      const updated = [...dragPairs];
      updated[idx].right = (updated[idx].right || '') + sym;
      setDragPairs(updated);
    } else if (activeField.name === 'template') {
      setFillTemplate((prev) => prev + sym);
    } else if (activeField.name === 'explanation') {
      setExplanation((prev) => prev + sym);
    } else {
      setQuestionText((prev) => prev + sym);
    }
  };

  const handleOptionChange = (index: number, val: string) => {
    const updated = [...options];
    updated[index] = val;
    setOptions(updated);
  };

  const addOption = () => {
    setOptions([...options, `Lựa chọn ${String.fromCharCode(65 + options.length)}`]);
    setOptionImages([...optionImages, null]);
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) return;
    setOptions(options.filter((_, i) => i !== index));
    setOptionImages(optionImages.filter((_, i) => i !== index));
    if (singleCorrect === index) setSingleCorrect(0);
    setMultiCorrect(multiCorrect.filter((i) => i !== index));
  };

  const toggleMultiCorrect = (index: number) => {
    if (multiCorrect.includes(index)) {
      setMultiCorrect(multiCorrect.filter((i) => i !== index));
    } else {
      setMultiCorrect([...multiCorrect, index]);
    }
  };

  // Build question object
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Tự động chuẩn hóa tất cả ký hiệu Địa lí (chuyển ^\circ, ^o thành ° chuẩn)
    const cleanQuestionText = formatGeoMathSymbols(questionText);
    const cleanOptions = options.map((opt) => formatGeoMathSymbols(opt));
    const cleanExplanation = formatGeoMathSymbols(explanation);
    const cleanTfStatements = tfStatements.map((s) => ({ ...s, text: formatGeoMathSymbols(s.text) }));
    const cleanFillTemplate = formatGeoMathSymbols(fillTemplate);
    const cleanFillAnswers = fillAnswers.map((b) => ({ ...b, answer: formatGeoMathSymbols(b.answer) }));
    const cleanDragPairs = dragPairs.map((p) => ({
      ...p,
      left: formatGeoMathSymbols(p.left),
      right: formatGeoMathSymbols(p.right),
    }));
    const cleanEssaySample = formatGeoMathSymbols(essaySample);

    let contentJson: any = {};
    let correctAnswerJson: any = {};

    switch (type) {
      case 'single_choice':
        contentJson = {
          question: cleanQuestionText,
          options: cleanOptions,
          image_url: imageUrl.trim() || undefined,
          image_caption: imageCaption.trim() || undefined,
          option_images: optionImages.some((img) => img && img.trim()) ? optionImages : undefined,
        };
        correctAnswerJson = { correct_index: singleCorrect };
        break;
      case 'multiple_choice':
        contentJson = {
          question: cleanQuestionText,
          options: cleanOptions,
          image_url: imageUrl.trim() || undefined,
          image_caption: imageCaption.trim() || undefined,
          option_images: optionImages.some((img) => img && img.trim()) ? optionImages : undefined,
        };
        correctAnswerJson = { correct_indices: multiCorrect.length > 0 ? multiCorrect : [0] };
        break;
      case 'true_false': {
        const tfObj: Record<string, boolean> = {};
        cleanTfStatements.forEach((s) => {
          tfObj[s.id] = s.isTrue;
        });
        contentJson = {
          question: cleanQuestionText || 'Xét tính đúng / sai của các nhận định Địa lí sau:',
          statements: cleanTfStatements.map((s) => ({ id: s.id, text: s.text })),
        };
        correctAnswerJson = { tf_answers: tfObj };
        break;
      }
      case 'fill_blank': {
        // Lưu nguyên vẹn toàn bộ nội dung văn bản câu hỏi do giáo viên soạn thảo
        const cleanText = cleanFillTemplate.replace(/\[blank_\w+\]/g, '').trim();
        const blankAnsObj: Record<string, string[]> = {};
        cleanFillAnswers.forEach((b) => {
          blankAnsObj[b.id] = [b.answer];
        });
        contentJson = {
          template: cleanText,
          blanks: cleanFillAnswers.map((b) => ({ id: b.id, placeholder: 'Chọn đáp án...' })),
        };
        correctAnswerJson = { blank_answers: blankAnsObj };
        break;
      }
      case 'drag_drop': {
        const dragPairObj: Record<string, string> = {};
        cleanDragPairs.forEach((p) => {
          dragPairObj[p.id] = p.right;
        });
        contentJson = {
          instruction: cleanQuestionText || 'Ghép nối Cột A với Cột B cho phù hợp:',
          pairs: cleanDragPairs,
        };
        correctAnswerJson = { drag_pairs: dragPairObj };
        break;
      }
      case 'essay':
        contentJson = { prompt: cleanQuestionText, sample_answer: cleanEssaySample };
        correctAnswerJson = { essay_sample: cleanEssaySample };
        break;
    }

    const newQuestion: Question = {
      id: initialQuestion?.id || generateQuestionId(),
      grade,
      type,
      category: category || `Bài học Khối ${grade}`,
      lesson_id: lessonId,
      title: (title || cleanQuestionText || cleanFillTemplate).substring(0, 120),
      content_json: contentJson,
      correct_answer_json: correctAnswerJson,
      explanation: cleanExplanation.trim() || null,
      points: Number(points) || 1.0,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      created_at: initialQuestion?.created_at || new Date().toISOString(),
    };

    onSave(newQuestion);
  };

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200 shadow-xl max-w-4xl w-full mx-auto max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-ocean-100 text-ocean-700 flex items-center justify-center font-bold">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-lg">
              {initialQuestion ? 'Chỉnh Sửa Câu Hỏi Địa Lí' : 'Soạn Câu Hỏi Mới Cho Đề Thi'}
            </h3>
            <p className="text-xs text-slate-500">
              Hỗ trợ 6 dạng câu hỏi, công thức KaTeX và giữ nguyên dòng thơ lục bát
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPreviewMode(!previewMode)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
              previewMode ? 'bg-ocean-600 text-white border-ocean-600' : 'bg-slate-100 text-slate-700 border-slate-200'
            }`}
          >
            <Eye className="w-4 h-4" />
            {previewMode ? 'Sửa Câu Hỏi' : 'Xem Trước KaTeX'}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Hàng 1: Loại câu hỏi, Khối lớp, Điểm số */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Dạng câu hỏi (6 Loại):
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as QuestionType)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-ocean-500 focus:outline-none"
            >
              <option value="single_choice">1. Trắc nghiệm 1 đáp án (Single Choice)</option>
              <option value="multiple_choice">2. Trắc nghiệm nhiều đáp án (Multiple Choice)</option>
              <option value="true_false">3. Đúng / Sai theo mệnh đề (True/False)</option>
              <option value="fill_blank">4. Điền vào chỗ trống (Fill in Blanks)</option>
              <option value="drag_drop">5. Kéo thả ghép nối Cột A - B (Drag & Drop)</option>
              <option value="essay">6. Tự luận / Văn bản (Essay)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Khối lớp THCS:
            </label>
            <select
              value={grade}
              onChange={(e) => {
                const g = Number(e.target.value);
                setGrade(g);
                const gLessons = allLessons.filter((l) => l.grade === g);
                if (gLessons.length > 0) {
                  setLessonId(gLessons[0].id);
                  setCategory(gLessons[0].title);
                }
              }}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-ocean-500 focus:outline-none"
            >
              <option value={6}>Khối 6 (Lớp 6)</option>
              <option value={7}>Khối 7 (Lớp 7)</option>
              <option value={8}>Khối 8 (Lớp 8)</option>
              <option value={9}>Khối 9 (Lớp 9)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Điểm số câu này:
            </label>
            <input
              type="number"
              step="0.25"
              min="0.25"
              max="10"
              value={points}
              onChange={(e) => setPoints(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-ocean-500 focus:outline-none"
              required
            />
          </div>
        </div>

        {/* Hàng chọn Bài học tương ứng */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Bài học trong chương trình (Khối {grade}):
          </label>
          <select
            value={lessonId}
            onChange={(e) => {
              const lid = e.target.value;
              setLessonId(lid);
              const found = allLessons.find((l) => l.id === lid);
              if (found) setCategory(found.title);
            }}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-ocean-500 focus:outline-none"
          >
            {gradeLessons.map((l) => (
              <option key={l.id} value={l.id}>
                {l.title}
              </option>
            ))}
          </select>
        </div>

        {/* Khung soạn thảo chính với WYSIWYG RichTextEditor */}
        {type !== 'fill_blank' && (
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <label className="block text-xs font-bold text-slate-700">
                Nội dung câu hỏi / Đố vui bằng thơ lục bát:
              </label>
              <span className="text-[11px] text-slate-400">
                Bôi đen từ rồi bấm in đậm, in nghiêng, gạch chân hoặc đổi màu chữ trực tiếp
              </span>
            </div>

            <RichTextEditor
              value={questionText}
              onChange={setQuestionText}
              placeholder="VD: Nhập câu hỏi tọa độ: 21°01′ B, 105°51′ Đ hoặc đố vui thơ lục bát..."
              minHeight="110px"
            />
          </div>
        )}

        {/* KHỐI THÊM HÌNH ẢNH / TƯ LIỆU QUAN SÁT (BẢN ĐỒ, BIỂU ĐỒ, BẢNG SỐ LIỆU) */}
        {(type === 'single_choice' || type === 'multiple_choice') && (
          <div className="p-4 bg-gradient-to-br from-slate-50 to-ocean-50/30 rounded-2xl border-2 border-dashed border-ocean-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-ocean-100 text-ocean-700 flex items-center justify-center font-bold">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800">
                    Tư Liệu Hình Ảnh Quan Sát (Bản đồ, Biểu đồ, Bảng số liệu):
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    Dành cho các câu hỏi yêu cầu học sinh đọc lược đồ, biểu đồ khí hậu, cơ cấu số liệu
                  </span>
                </div>
              </div>
              {imageUrl && (
                <button
                  type="button"
                  onClick={() => {
                    setImageUrl('');
                    setImageCaption('');
                    setImageUrlInput('');
                  }}
                  className="px-2.5 py-1 text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg flex items-center gap-1 cursor-pointer transition"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Xóa ảnh
                </button>
              )}
            </div>

            {/* Chưa có ảnh: hiển thị 2 cách thêm */}
            {!imageUrl ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Cách 1: Tải từ máy */}
                <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 hover:border-ocean-500 rounded-2xl bg-white hover:bg-ocean-50/50 cursor-pointer transition text-center group shadow-2xs">
                  <Upload className="w-6 h-6 text-ocean-600 mb-1.5 group-hover:scale-110 transition" />
                  <span className="text-xs font-bold text-slate-800">
                    {isUploadingImage ? 'Đang xử lý ảnh...' : 'Tải ảnh lên từ máy tính'}
                  </span>
                  <span className="text-[11px] text-slate-500 mt-0.5">
                    Hỗ trợ PNG, JPG, WEBP, SVG (tối đa 5MB)
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="hidden"
                    disabled={isUploadingImage}
                  />
                </label>

                {/* Cách 2: Dán đường dẫn URL */}
                <div className="flex flex-col justify-center p-3.5 border border-slate-200 rounded-2xl bg-white space-y-2 shadow-2xs">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <Link2 className="w-3.5 h-3.5 text-slate-500" />
                    Hoặc dán đường link URL ảnh trực tuyến:
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="url"
                      placeholder="https://.../bieu-do-nhiet-do-luong-mua.png"
                      value={imageUrlInput}
                      onChange={(e) => setImageUrlInput(e.target.value)}
                      className="flex-1 px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-ocean-500 bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (imageUrlInput.trim()) {
                          setImageUrl(imageUrlInput.trim());
                          setImageUrlInput('');
                          setImageStats(null);
                          setFileSizeWarning(null);
                        }
                      }}
                      className="px-3 py-1.5 bg-ocean-600 hover:bg-ocean-700 active:scale-95 text-white text-xs font-bold rounded-xl transition cursor-pointer shrink-0"
                    >
                      Dùng ảnh
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Đã có ảnh: Xem trước sắc nét kích thước lớn + Ô nhập chú thích */
              <div className="space-y-3 pt-1">
                <div className="relative group bg-slate-900/90 rounded-2xl p-3 flex flex-col items-center justify-center overflow-hidden border border-slate-300 shadow-inner">
                  <img
                    src={imageUrl}
                    alt={imageCaption || 'Tư liệu câu hỏi'}
                    className="max-h-72 sm:max-h-96 w-auto max-w-full object-contain rounded-xl shadow-lg cursor-pointer transition hover:opacity-95"
                    onClick={() =>
                      setZoomModalData({
                        isOpen: true,
                        url: imageUrl,
                        caption: imageCaption || 'Tư liệu câu hỏi',
                      })
                    }
                    title="Bấm để xem kính lúp phóng to"
                  />
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 flex-wrap justify-end">
                    {/* Nút Cắt / Xoay ảnh (Gợi ý 4) */}
                    <button
                      type="button"
                      onClick={() =>
                        setCropModalData({
                          isOpen: true,
                          imageUrl,
                          title: 'Cắt & Xoay Ảnh Tư Liệu Câu Hỏi',
                          target: 'main',
                        })
                      }
                      className="flex items-center gap-1 bg-ocean-600 hover:bg-ocean-700 active:scale-95 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-md transition cursor-pointer"
                      title="Cắt bỏ viền thừa, xoay góc hoặc chỉnh sửa vùng ảnh"
                    >
                      <Crop className="w-3.5 h-3.5" />
                      <span>Cắt & Xoay</span>
                    </button>

                    {/* Nút Kính lúp phóng to */}
                    <button
                      type="button"
                      onClick={() =>
                        setZoomModalData({
                          isOpen: true,
                          url: imageUrl,
                          caption: imageCaption || 'Tư liệu câu hỏi',
                        })
                      }
                      className="flex items-center gap-1 bg-slate-950/80 hover:bg-slate-900 backdrop-blur-xs text-white text-xs font-bold px-3 py-1.5 rounded-xl border border-white/20 shadow-md transition cursor-pointer"
                      title="Xem phóng to toàn màn hình"
                    >
                      <ZoomIn className="w-3.5 h-3.5 text-ocean-300" />
                      <span className="hidden sm:inline">Phóng to</span>
                    </button>

                    {/* Nút Xóa ảnh */}
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('Cô có chắc chắn muốn xóa bức ảnh này khỏi câu hỏi không?')) {
                          setImageUrl('');
                          setImageCaption('');
                          setImageStats(null);
                          setFileSizeWarning(null);
                        }
                      }}
                      className="flex items-center gap-1 bg-rose-600/90 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold px-2.5 py-1.5 rounded-xl shadow-md transition cursor-pointer"
                      title="Xóa bức ảnh này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Xóa ảnh</span>
                    </button>
                  </div>
                </div>

                {/* Thông báo tỷ lệ nén & cảnh báo dung lượng (Gợi ý 3) */}
                {imageStats && (
                  <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 animate-in fade-in">
                    <div className="flex items-center gap-1.5 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        ⚡ Đã nén tối ưu: {(imageStats.originalSize / (1024 * 1024)).toFixed(1)} MB ➔ {(imageStats.compressedSize / 1024).toFixed(0)} KB (Giảm {imageStats.reductionPercent}%)
                      </span>
                    </div>
                    <span className="text-[10px] font-black bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-md border border-emerald-300">
                      ✓ Đạt chuẩn HD siêu nhẹ
                    </span>
                  </div>
                )}

                {fileSizeWarning && (
                  <div className="flex items-center gap-2 p-2.5 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 animate-in fade-in">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>{fileSizeWarning}</span>
                  </div>
                )}

                {/* Nhập chú thích hiển thị dưới hình ảnh */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tên / Chú thích biểu đồ, bản đồ (hiển thị rõ cho học sinh đọc):
                  </label>
                  <input
                    type="text"
                    value={imageCaption}
                    onChange={(e) => setImageCaption(e.target.value)}
                    placeholder="VD: Hình 1. Lược đồ tự nhiên vùng Tây Bắc hoặc Biểu đồ cơ cấu GDP..."
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-ocean-500 bg-white"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* 1. Trắc nghiệm 1 đáp án */}
        {type === 'single_choice' && (
          <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs font-bold text-slate-700">
              <span>Các phương án lựa chọn (Tích tròn chọn đáp án đúng):</span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-normal text-slate-500 hidden sm:inline">
                  (Có thể đính kèm ảnh cho từng phương án A, B, C, D)
                </span>
                <button
                  type="button"
                  onClick={addOption}
                  className="flex items-center gap-1 text-ocean-600 hover:text-ocean-700 font-semibold cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Thêm phương án
                </button>
              </div>
            </div>

            {options.map((opt, idx) => {
              const optImg = optionImages[idx];
              const fileInputId = `opt_single_file_${idx}`;

              return (
                <div key={idx} className="p-2.5 rounded-xl border border-slate-200 bg-white space-y-2 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="single_correct_radio"
                      checked={singleCorrect === idx}
                      onChange={() => setSingleCorrect(idx)}
                      className="w-4 h-4 text-ocean-600 focus:ring-ocean-500 cursor-pointer shrink-0"
                    />
                    <span className="w-6 font-bold text-xs text-slate-700 text-center shrink-0">
                      {String.fromCharCode(65 + idx)}.
                    </span>
                    <input
                      type="text"
                      value={opt}
                      placeholder={`Nhập nội dung phương án ${String.fromCharCode(65 + idx)}...`}
                      onFocus={() => setActiveField({ name: 'option', index: idx })}
                      onChange={(e) => handleOptionChange(idx, e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-ocean-500 bg-slate-50/50"
                    />

                    {/* Nút Đính kèm ảnh cho phương án */}
                    <label
                      htmlFor={fileInputId}
                      className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1 cursor-pointer transition shrink-0 ${
                        optImg
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                          : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                      }`}
                      title="Đính kèm ảnh cho phương án này"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{optImg ? 'Đổi ảnh' : 'Thêm ảnh'}</span>
                    </label>
                    <input
                      id={fileInputId}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleOptionImageFileChange(idx, e)}
                      className="hidden"
                    />

                    {options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(idx)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl cursor-pointer transition shrink-0"
                        title="Xóa phương án này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Thumbnail xem trước ảnh của phương án A, B, C, D */}
                  {optImg && (
                    <div className="ml-8 pl-1 flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-200/80">
                      <img
                        src={optImg}
                        alt={`Ảnh đáp án ${String.fromCharCode(65 + idx)}`}
                        className="h-16 w-auto max-w-[140px] object-contain rounded-lg border border-slate-300 bg-white shadow-2xs cursor-pointer hover:opacity-90"
                        onClick={() =>
                          setZoomModalData({
                            isOpen: true,
                            url: optImg,
                            caption: `Xem trước ảnh phương án ${String.fromCharCode(65 + idx)}${opt ? `: ${opt}` : ''}`,
                          })
                        }
                      />
                      <div className="flex flex-col gap-1 min-w-0">
                        <span className="text-[11px] font-bold text-emerald-700">
                          ✓ Đã đính kèm ảnh cho phương án {String.fromCharCode(65 + idx)}
                        </span>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() =>
                              setCropModalData({
                                isOpen: true,
                                imageUrl: optImg,
                                title: `Cắt & chỉnh sửa ảnh phương án ${String.fromCharCode(65 + idx)}`,
                                target: { optionIndex: idx },
                              })
                            }
                            className="text-[11px] font-bold text-ocean-600 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <Crop className="w-3 h-3" /> Cắt & xoay
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setZoomModalData({
                                isOpen: true,
                                url: optImg,
                                caption: `Xem trước ảnh phương án ${String.fromCharCode(65 + idx)}${opt ? `: ${opt}` : ''}`,
                              })
                            }
                            className="text-[11px] font-semibold text-slate-600 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <ZoomIn className="w-3 h-3" /> Phóng to
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveOptionImage(idx)}
                            className="text-[11px] font-semibold text-rose-600 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <X className="w-3 h-3" /> Xóa ảnh
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 2. Trắc nghiệm nhiều đáp án */}
        {type === 'multiple_choice' && (
          <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs font-bold text-slate-700">
              <span>Các phương án lựa chọn (Tích vuông các đáp án đúng):</span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-normal text-slate-500 hidden sm:inline">
                  (Có thể đính kèm ảnh cho từng phương án A, B, C, D)
                </span>
                <button
                  type="button"
                  onClick={addOption}
                  className="flex items-center gap-1 text-ocean-600 hover:text-ocean-700 font-semibold cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Thêm phương án
                </button>
              </div>
            </div>

            {options.map((opt, idx) => {
              const optImg = optionImages[idx];
              const fileInputId = `opt_multi_file_${idx}`;

              return (
                <div key={idx} className="p-2.5 rounded-xl border border-slate-200 bg-white space-y-2 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={multiCorrect.includes(idx)}
                      onChange={() => toggleMultiCorrect(idx)}
                      className="w-4 h-4 text-ocean-600 rounded focus:ring-ocean-500 cursor-pointer shrink-0"
                    />
                    <span className="w-6 font-bold text-xs text-slate-700 text-center shrink-0">
                      {String.fromCharCode(65 + idx)}.
                    </span>
                    <input
                      type="text"
                      value={opt}
                      placeholder={`Nhập nội dung phương án ${String.fromCharCode(65 + idx)}...`}
                      onFocus={() => setActiveField({ name: 'option', index: idx })}
                      onChange={(e) => handleOptionChange(idx, e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-ocean-500 bg-slate-50/50"
                    />

                    {/* Nút Đính kèm ảnh cho phương án */}
                    <label
                      htmlFor={fileInputId}
                      className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1 cursor-pointer transition shrink-0 ${
                        optImg
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                          : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                      }`}
                      title="Đính kèm ảnh cho phương án này"
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{optImg ? 'Đổi ảnh' : 'Thêm ảnh'}</span>
                    </label>
                    <input
                      id={fileInputId}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleOptionImageFileChange(idx, e)}
                      className="hidden"
                    />

                    {options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(idx)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl cursor-pointer transition shrink-0"
                        title="Xóa phương án này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Thumbnail xem trước ảnh của phương án */}
                  {optImg && (
                    <div className="ml-8 pl-1 flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-200/80">
                      <img
                        src={optImg}
                        alt={`Ảnh đáp án ${String.fromCharCode(65 + idx)}`}
                        className="h-16 w-auto max-w-[140px] object-contain rounded-lg border border-slate-300 bg-white shadow-2xs cursor-pointer hover:opacity-90"
                        onClick={() =>
                          setZoomModalData({
                            isOpen: true,
                            url: optImg,
                            caption: `Xem trước ảnh phương án ${String.fromCharCode(65 + idx)}${opt ? `: ${opt}` : ''}`,
                          })
                        }
                      />
                      <div className="flex flex-col gap-1 min-w-0">
                        <span className="text-[11px] font-bold text-emerald-700">
                          ✓ Đã đính kèm ảnh cho phương án {String.fromCharCode(65 + idx)}
                        </span>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() =>
                              setCropModalData({
                                isOpen: true,
                                imageUrl: optImg,
                                title: `Cắt & chỉnh sửa ảnh phương án ${String.fromCharCode(65 + idx)}`,
                                target: { optionIndex: idx },
                              })
                            }
                            className="text-[11px] font-bold text-ocean-600 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <Crop className="w-3 h-3" /> Cắt & xoay
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setZoomModalData({
                                isOpen: true,
                                url: optImg,
                                caption: `Xem trước ảnh phương án ${String.fromCharCode(65 + idx)}${opt ? `: ${opt}` : ''}`,
                              })
                            }
                            className="text-[11px] font-semibold text-slate-600 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <ZoomIn className="w-3 h-3" /> Phóng to
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveOptionImage(idx)}
                            className="text-[11px] font-semibold text-rose-600 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <X className="w-3 h-3" /> Xóa ảnh
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 3. Đúng / Sai */}
        {type === 'true_false' && (
          <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span>Danh sách các mệnh đề kiểm tra:</span>
              <button
                type="button"
                onClick={() =>
                  setTfStatements([
                    ...tfStatements,
                    { id: 'tf_' + Date.now(), text: '', isTrue: true },
                  ])
                }
                className="flex items-center gap-1 text-ocean-600 hover:text-ocean-700 font-semibold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Thêm mệnh đề
              </button>
            </div>

            {tfStatements.map((st, idx) => (
              <div key={st.id} className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="font-bold text-xs text-slate-400 w-5">{idx + 1}.</span>
                <input
                  type="text"
                  value={st.text}
                  placeholder={`Nhập nội dung mệnh đề ${idx + 1}...`}
                  onChange={(e) => {
                    const updated = [...tfStatements];
                    updated[idx].text = e.target.value;
                    setTfStatements(updated);
                  }}
                  className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-ocean-500"
                  required
                />
                <select
                  value={st.isTrue ? 'true' : 'false'}
                  onChange={(e) => {
                    const updated = [...tfStatements];
                    updated[idx].isTrue = e.target.value === 'true';
                    setTfStatements(updated);
                  }}
                  className="px-2.5 py-1.5 rounded-lg border text-xs font-bold bg-slate-50 text-slate-800 cursor-pointer"
                >
                  <option value="true">ĐÚNG</option>
                  <option value="false">SAI</option>
                </select>
                {tfStatements.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setTfStatements(tfStatements.filter((_, i) => i !== idx))}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 4. Điền từ vào chỗ trống */}
        {type === 'fill_blank' && (
          <div className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <label className="block text-xs font-bold text-slate-700">
                  Đoạn văn có chỗ trống (Dùng mã <code className="text-ocean-600 font-mono">[blank_1]</code>, <code className="text-ocean-600 font-mono">[blank_2]</code> hoặc gõ dấu chấm <code className="text-ocean-600 font-mono">.......</code>):
                </label>
                <span className="text-[11px] text-slate-400">
                  In đậm, in nghiêng, gạch chân, đổi màu chữ hoặc tô màu nền trực tiếp
                </span>
              </div>

              <RichTextEditor
                value={fillTemplate}
                onChange={setFillTemplate}
                placeholder="Nhập nội dung đoạn văn có chứa chỗ trống, ví dụ: [blank_1] hoặc gõ dấu chấm .........."
                minHeight="120px"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
                <span>Đáp án chuẩn cho từng chỗ trống:</span>
                <button
                  type="button"
                  onClick={() =>
                    setFillAnswers([
                      ...fillAnswers,
                      { id: `blank_${fillAnswers.length + 1}`, answer: '' },
                    ])
                  }
                  className="flex items-center gap-1 text-ocean-600 hover:text-ocean-700 font-semibold cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Thêm chỗ trống
                </button>
              </div>

              {fillAnswers.map((b, idx) => (
                <div key={b.id} className="flex items-center gap-2 mb-2">
                  <span className="font-mono text-xs text-ocean-700 bg-ocean-100 px-2 py-1 rounded-lg font-bold">
                    [{b.id}]
                  </span>
                  <input
                    type="text"
                    value={b.answer}
                    onChange={(e) => {
                      const updated = [...fillAnswers];
                      updated[idx].answer = e.target.value;
                      setFillAnswers(updated);
                    }}
                    placeholder={`Nhập từ cần điền vào [${b.id}]...`}
                    className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold bg-white"
                    required
                  />
                  {fillAnswers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setFillAnswers(fillAnswers.filter((_, i) => i !== idx))}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. Kéo thả ghép nối Cột A - B */}
        {type === 'drag_drop' && (
          <div className="space-y-3.5 bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900 space-y-1.5 shadow-2xs">
              <div className="font-bold flex items-center gap-1.5 text-amber-950 text-xs sm:text-sm">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                <span>💡 Lưu ý quan trọng khi lập đáp án câu hỏi Nối Cột:</span>
              </div>
              <p className="leading-relaxed">
                Ở <strong>mỗi hàng</strong> bên dưới, Cô hãy nhập đúng <strong>CẶP ĐÁP ÁN KHỚP NHAU</strong> (Vế trái Cột A ⇄ Vế phải Cột B chuẩn xác).
              </p>
              <div className="text-[11px] text-amber-900 bg-amber-100/70 p-2 rounded-lg font-medium">
                <strong>Ví dụ mẫu:</strong><br/>
                • Hàng 1: <code>1. Kinh tuyến</code> ⇄ <code>c. Là những nửa đường tròn nối hai cực...</code><br/>
                • Hàng 2: <code>2. Vĩ tuyến</code> ⇄ <code>a. Những vòng tròn bao quanh quả địa cầu...</code><br/>
                • Hàng 3: <code>3. Kinh độ của một điểm</code> ⇄ <code>d. Khoảng cách tính bằng độ từ kinh tuyến gốc...</code><br/>
                • Hàng 4: <code>4. Vĩ độ của một điểm</code> ⇄ <code>b. Khoảng cách tính bằng độ từ xích đạo...</code>
              </div>
              <p className="text-[11px] text-amber-800 italic">
                * Khi học sinh làm bài, hệ thống sẽ <strong>tự động xáo trộn các ý Cột B</strong> để học sinh nối lại, và áp dụng quy tắc <strong>chỉ được chọn mỗi ý 1 lần duy nhất</strong>.
              </p>
            </div>

            <div className="flex items-center justify-between text-xs font-bold text-slate-700 pt-1">
              <span>Danh sách các cặp ghép nối chuẩn (Vế trái A ⇄ Vế phải B):</span>
              <button
                type="button"
                onClick={() =>
                  setDragPairs([
                    ...dragPairs,
                    { id: 'p_' + Date.now(), left: '', right: '' },
                  ])
                }
                className="flex items-center gap-1 text-ocean-600 hover:text-ocean-700 font-semibold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Thêm cặp ghép nối
              </button>
            </div>

            {dragPairs.map((p, idx) => (
              <div key={p.id} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                <span className="font-black text-xs text-ocean-800 bg-ocean-100 w-6 h-6 rounded-lg flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <input
                  type="text"
                  value={p.left}
                  placeholder="Vế Cột A (VD: 1. Kinh tuyến)"
                  onFocus={() => setActiveField({ name: 'drag_left', index: idx })}
                  onChange={(e) => {
                    const updated = [...dragPairs];
                    updated[idx].left = e.target.value;
                    setDragPairs(updated);
                  }}
                  className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-ocean-500"
                  required
                />
                <span className="text-ocean-600 font-bold hidden sm:block">⇄</span>
                <input
                  type="text"
                  value={p.right}
                  placeholder="Vế Cột B KHỚP ĐÚNG (VD: c. Là những nửa đường tròn nối hai cực...)"
                  onFocus={() => setActiveField({ name: 'drag_right', index: idx })}
                  onChange={(e) => {
                    const updated = [...dragPairs];
                    updated[idx].right = e.target.value;
                    setDragPairs(updated);
                  }}
                  className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-ocean-500"
                  required
                />
                {dragPairs.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setDragPairs(dragPairs.filter((_, i) => i !== idx))}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition shrink-0 self-end sm:self-center"
                    title="Xóa cặp này"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 6. Tự luận */}
        {type === 'essay' && (
          <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <label className="block text-xs font-bold text-slate-700">
                Gợi ý đáp án chuẩn & Hướng dẫn chấm điểm của Giáo viên:
              </label>
              <span className="text-[11px] text-slate-400">
                In đậm, in nghiêng, gạch chân, đổi màu chữ trực tiếp
              </span>
            </div>

            <RichTextEditor
              value={essaySample}
              onChange={setEssaySample}
              placeholder="VD: Các ý cần có: 1. Ý nghĩa tự nhiên (khí hậu ẩm, nhiều tài nguyên); 2. Ý nghĩa kinh tế (giao thương biển, vị trí cửa ngõ Đông Nam Á)..."
              minHeight="100px"
            />
          </div>
        )}

        {/* Lời giải thích chi tiết */}
        <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <label className="block text-xs font-bold text-slate-700">
              Lời giải thích chi tiết (Hiển thị cho học sinh sau khi nộp bài):
            </label>
            <span className="text-[11px] text-slate-400">
              In đậm, in nghiêng, gạch chân, đổi màu chữ hoặc tô màu nền trực tiếp
            </span>
          </div>

          <RichTextEditor
            value={explanation}
            onChange={setExplanation}
            placeholder="VD: Fansipan cao 3.143m là đỉnh núi cao nhất thuộc dãy Hoàng Liên Sơn..."
            minHeight="70px"
          />
        </div>

        {/* Chế độ xem trước KaTeX & Thơ */}
        {previewMode && (
          <div className="p-4 rounded-2xl bg-ocean-50/50 border border-ocean-200 text-xs space-y-2">
            <div className="font-bold text-ocean-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-ocean-600" />
              Xem trước hiển thị thực tế:
            </div>
            <LatexRenderer content={type === 'fill_blank' ? fillTemplate : questionText} isPoetry={true} />
          </div>
        )}

        {/* Nút lưu */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
          >
            Đóng / Hủy bỏ
          </button>
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 bg-ocean-600 hover:bg-ocean-700 active:scale-95 text-white text-xs font-bold rounded-xl transition shadow-sm"
          >
            <CheckCircle2 className="w-4 h-4" />
            Lưu Câu Hỏi Vào Đề Thi
          </button>
        </div>
      </form>

      {/* Modal Kính Lúp Phóng To Tư Liệu Bản Đồ / Biểu Đồ Tương Tác */}
      <ImageZoomModal
        isOpen={zoomModalData.isOpen}
        imageUrl={zoomModalData.url}
        caption={zoomModalData.caption}
        onClose={() => setZoomModalData({ isOpen: false, url: '', caption: '' })}
      />

      {/* Modal Cắt / Xoay / Chỉnh Sửa Vùng Bản Đồ & Biểu Đồ (Gợi ý 4) */}
      <ImageCropModal
        isOpen={cropModalData.isOpen}
        imageUrl={cropModalData.imageUrl}
        imageTitle={cropModalData.title}
        onApply={(croppedUrl, stats) => {
          if (cropModalData.target === 'main') {
            setImageUrl(croppedUrl);
            if (stats?.originalSize && stats?.newSize) {
              const originalBytes = Math.round(stats.originalSize * 0.75);
              const compressedBytes = Math.round(stats.newSize * 0.75);
              const percent = Math.round(((originalBytes - compressedBytes) / (originalBytes || 1)) * 100);
              setImageStats({
                originalSize: originalBytes,
                compressedSize: compressedBytes,
                reductionPercent: Math.max(0, percent),
              });
            }
          } else {
            const idx = cropModalData.target.optionIndex;
            const updated = [...optionImages];
            updated[idx] = croppedUrl;
            setOptionImages(updated);
          }
        }}
        onClose={() => setCropModalData({ isOpen: false, imageUrl: '', title: '', target: 'main' })}
      />
    </div>
  );
};
