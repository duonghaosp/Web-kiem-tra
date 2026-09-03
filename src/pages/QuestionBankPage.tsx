import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  BookOpen,
  Plus,
  Trash2,
  Edit,
  Upload,
  Download,
  Filter,
  Search,
  Sparkles,
  HelpCircle,
  FileSpreadsheet,
  FileText,
  Eye,
  CheckCircle2,
  ListChecks,
  CalendarCheck,
  Clock,
  ArrowRight,
  X,
  Layers,
  FolderPlus,
  School,
  CheckSquare,
  Square,
  Zap,
  ArrowUp,
  ArrowDown,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronsDownUp,
  ArrowUpCircle,
} from 'lucide-react';
import { Question, QuestionType, Assignment, TargetType } from '../types/database';
import { QuestionEditor } from '../components/questions/QuestionEditor';
import { parseExcelExam, parseWordExam, downloadSampleExcelTemplate, ParsedQuestionItem } from '../lib/examParsers';
import { ImportPreviewModal } from '../components/questions/ImportPreviewModal';
import { LatexRenderer } from '../components/common/LatexRenderer';
import { LessonItem, getStoredLessons, saveStoredLessons } from '../data/curriculum';
import { getStoredQuestions, saveStoredQuestions } from '../data/questionBank';
import { triggerCelebration } from '../lib/gamification';
import { playSoftClick } from '../utils/soundEffects';
import { saveAssignmentsToCloud } from '../lib/assignmentCloudSync';

// Dữ liệu câu hỏi mẫu chuẩn chương trình Địa lí THCS GDPT 2018
const INITIAL_QUESTIONS: Question[] = [
  {
    id: 'q1',
    grade: 6,
    lesson_id: 'g6_b1',
    category: 'Bài 1: Hệ thống kinh, vĩ tuyến và tọa độ địa lí',
    type: 'single_choice',
    title: 'Câu thơ đố vui Địa lí: "Bình Định có núi Vọng Phu / Có đầm Thị Nại, có cù lao Xanh". Đầm Thị Nại thuộc tỉnh nào?',
    content_json: {
      question: 'Câu thơ đố vui Địa lí:\n"Bình Định có núi Vọng Phu\nCó đầm Thị Nại, có cù lao Xanh"\n\nĐầm Thị Nại thuộc tỉnh nào của nước ta?',
      options: ['Bình Định', 'Phú Yên', 'Khánh Hòa', 'Quảng Ngãi'],
    },
    correct_answer_json: { correct_index: 0 },
    explanation: 'Đầm Thị Nại là đầm nước mặn lớn nhất tỉnh Bình Định, giàu tiềm năng thủy sản và du lịch sinh thái.',
    points: 1.0,
    tags: ['Đố vui thơ lục bát', 'Khối 6', 'Địa danh'],
  },
  {
    id: 'q2',
    grade: 6,
    lesson_id: 'g6_b1',
    category: 'Bài 1: Hệ thống kinh, vĩ tuyến và tọa độ địa lí',
    type: 'single_choice',
    title: 'Tọa độ địa lí của một điểm trên bản đồ được xác định bởi yếu tố nào?',
    content_json: {
      question: 'Tọa độ địa lí của một điểm (ví dụ: $21^\\circ 01\' \\text{ B}, 105^\\circ 51\' \\text{ Đ}$) là:',
      options: [
        'Kinh độ và vĩ độ của điểm đó',
        'Khoảng cách từ điểm đó đến xích đạo',
        'Độ cao tuyệt đối của điểm đó',
        'Khoảng cách từ điểm đó đến kinh tuyến gốc',
      ],
    },
    correct_answer_json: { correct_index: 0 },
    explanation: 'Tọa độ địa lí của một điểm là kinh độ và vĩ độ của điểm đó trên bản đồ hoặc quả Địa Cầu.',
    points: 1.0,
    tags: ['Kinh vĩ tuyến', 'Khối 6'],
  },
  {
    id: 'q_g6_b2_1',
    grade: 6,
    lesson_id: 'g6_b2',
    category: 'Bài 2: Bản đồ. Một số lưới kinh, vĩ tuyến. Tỉ lệ bản đồ',
    type: 'single_choice',
    title: 'Tỉ lệ bản đồ 1 : 100.000 có nghĩa là gì?',
    content_json: {
      question: 'Tỉ lệ bản đồ $1 : 100.000$ có ý nghĩa là $1\\text{ cm}$ đo được trên bản đồ tương ứng với bao nhiêu trên thực địa?',
      options: ['1 km', '10 km', '100 m', '100 km'],
    },
    correct_answer_json: { correct_index: 0 },
    explanation: '1 cm trên bản đồ ứng với 100.000 cm = 1.000 m = 1 km ngoài thực địa.',
    points: 1.0,
    tags: ['Tỉ lệ bản đồ', 'Khối 6'],
  },
  {
    id: 'q_g6_b5_1',
    grade: 6,
    lesson_id: 'g6_b5',
    category: 'Bài 5: Vị trí Trái Đất trong hệ Mặt Trời. Hình dạng Trái Đất',
    type: 'single_choice',
    title: 'Vị trí của Trái Đất trong hệ Mặt Trời',
    content_json: {
      question: 'Theo thứ tự xa dần Mặt Trời, Trái Đất nằm ở vị trí thứ mấy trong số các hành tinh?',
      options: ['Thứ ba', 'Thứ hai', 'Thứ tư', 'Thứ nhất'],
    },
    correct_answer_json: { correct_index: 0 },
    explanation: 'Trái Đất là hành tinh thứ 3 tính từ Mặt Trời (sau sao Thủy và sao Kim).',
    points: 1.0,
    tags: ['Hệ Mặt Trời', 'Khối 6'],
  },
  {
    id: 'q4',
    grade: 7,
    lesson_id: 'g7_b4',
    category: 'Bài 4: Vị trí địa lí, phạm vi và đặc điểm tự nhiên châu Á',
    type: 'true_false',
    title: 'Xét tính đúng / sai về đặc điểm khí hậu Châu Á',
    content_json: {
      question: 'Xét tính Đúng / Sai của các nhận định về thiên nhiên và khí hậu Châu Á sau:',
      statements: [
        { id: 'tf_1', text: 'Châu Á là châu lục có diện tích rộng lớn nhất thế giới.' },
        { id: 'tf_2', text: 'Khí hậu Châu Á phân hóa thành nhiều đới và nhiều kiểu khí hậu khác nhau.' },
        { id: 'tf_3', text: 'Tất cả các khu vực ở Châu Á đều chịu ảnh hưởng của khí hậu xích đạo ẩm.' },
      ],
    },
    correct_answer_json: {
      tf_answers: { tf_1: true, tf_2: true, tf_3: false },
    },
    explanation: 'Châu Á có đầy đủ các đới khí hậu từ cực, ôn đới đến nhiệt đới và xích đạo do lãnh thổ trải dài từ vùng cực Bắc đến xích đạo.',
    points: 1.5,
    tags: ['Châu Á', 'Khối 7'],
  },
  {
    id: 'q6',
    grade: 8,
    lesson_id: 'g8_b2',
    category: 'Bài 2: Đặc điểm địa hình Việt Nam',
    type: 'drag_drop',
    title: 'Nối các vùng đồng bằng lớn ở nước ta với đặc điểm tương ứng',
    content_json: {
      instruction: 'Em hãy kéo thả ghép nối từng vùng đồng bằng (Cột A) với đặc điểm địa hình (Cột B) cho chính xác:',
      pairs: [
        { id: 'p1', left: 'Đồng bằng sông Hồng', right: 'Có hệ thống đê lớn ngăn lũ dài trên 2.700 km' },
        { id: 'p2', left: 'Đồng bằng sông Cửu Long', right: 'Mạng lưới sông ngòi kênh rạch chằng chịt, diện tích trũng ngập nước lớn' },
        { id: 'p3', left: 'Đồng bằng duyên hải miền Trung', right: 'Đồng bằng nhỏ hẹp, bị chia cắt bởi các nhánh núi đâm ra biển' },
      ],
    },
    correct_answer_json: {
      drag_pairs: {
        p1: 'Có hệ thống đê lớn ngăn lũ dài trên 2.700 km',
        p2: 'Mạng lưới sông ngòi kênh rạch chằng chịt, diện tích trũng ngập nước lớn',
        p3: 'Đồng bằng nhỏ hẹp, bị chia cắt bởi các nhánh núi đâm ra biển',
      },
    },
    explanation: 'Các vùng đồng bằng Việt Nam có đặc điểm hình thành và phù sa rất khác nhau.',
    points: 2.0,
    tags: ['Đồng bằng', 'Khối 8'],
  },
  {
    id: 'q3',
    grade: 8,
    lesson_id: 'g8_b4',
    category: 'Bài 4: Khoáng sản Việt Nam',
    type: 'multiple_choice',
    title: 'Các khoáng sản năng lượng quan trọng của nước ta gồm những loại nào?',
    content_json: {
      question: 'Những khoáng sản năng lượng có trữ lượng lớn và vai trò quan trọng ở nước ta là gì? (Chọn các phương án đúng)',
      options: ['Than đá', 'Dầu mỏ', 'Khí tự nhiên', 'Quặng sắt'],
    },
    correct_answer_json: { correct_indices: [0, 1, 2] },
    explanation: 'Than đá, dầu mỏ và khí tự nhiên là nhóm khoáng sản năng lượng; Quặng sắt là khoáng sản kim loại đen.',
    points: 1.5,
    tags: ['Khoáng sản', 'Khối 8'],
  },
  {
    id: 'q5',
    grade: 9,
    lesson_id: 'g9_b6',
    category: 'Bài 6: Vùng Trung du và miền núi Bắc Bộ',
    type: 'fill_blank',
    title: 'Điền tên đỉnh núi cao nhất Việt Nam',
    content_json: {
      template: 'Đỉnh núi cao nhất Việt Nam và toàn Đông Dương là đỉnh [blank_1] với độ cao [blank_2] mét, thuộc dãy núi Hoàng Liên Sơn.',
      blanks: [
        { id: 'blank_1', placeholder: 'Tên đỉnh núi' },
        { id: 'blank_2', placeholder: 'Độ cao (m)' },
      ],
    },
    correct_answer_json: {
      blank_answers: {
        blank_1: ['Fansipan', 'Phan Xi Păng', 'Phan-xi-păng'],
        blank_2: ['3143', '3.143'],
      },
    },
    explanation: 'Đỉnh Fansipan cao 3.143m là nóc nhà của Đông Dương.',
    points: 1.0,
    tags: ['Địa hình', 'Khối 9'],
  },
  {
    id: 'q7',
    grade: 9,
    lesson_id: 'g9_b12',
    category: 'Bài 12: Phát triển tổng hợp kinh tế và bảo vệ môi trường biển đảo',
    type: 'essay',
    title: 'Ý nghĩa vị trí địa lí và biển đảo đối với phát triển kinh tế Việt Nam',
    content_json: {
      prompt: 'Em hãy phân tích ý nghĩa của vị trí địa lí và đường bờ biển dài 3.260 km đối với việc phát triển các ngành kinh tế biển của nước ta.',
      sample_answer: '1. Đánh bắt và nuôi trồng hải sản;\n2. Khai thác khoáng sản biển (dầu khí, cát, muối);\n3. Giao thông vận tải biển quốc tế;\n4. Du lịch biển đảo trù phú.',
    },
    correct_answer_json: {
      essay_sample: 'Học sinh nêu đủ 4 ngành kinh tế biển: Thủy hải sản, Khoáng sản, Giao thông biển, Du lịch biển.',
    },
    explanation: 'Việt Nam có tiềm năng to lớn phát triển toàn diện kinh tế biển.',
    points: 2.5,
    tags: ['Kinh tế biển', 'Khối 9', 'Tự luận'],
  },
];

export const QuestionBankPage: React.FC = () => {
  const navigate = useNavigate();

  // 1. Quản lý Khối: BỎ mục "Tất cả các khối", mặc định chọn Khối 6
  const [selectedGrade, setSelectedGrade] = useState<number>(6);

  // 2. Quản lý Danh sách Bài học của từng Khối
  const [lessons, setLessons] = useState<LessonItem[]>(() => getStoredLessons());
  const [selectedLessonId, setSelectedLessonId] = useState<string>('g6_b1');

  // Modal thêm bài học mới
  const [isAddLessonOpen, setIsAddLessonOpen] = useState(false);
  const [newLessonTitle, setNewLessonTitle] = useState('');

  // 3. Quản lý Danh sách Câu hỏi (Đồng bộ bền vững giữa IndexedDB và LocalStorage)
  const [questions, setQuestions] = useState<Question[]>(() => {
    return getStoredQuestions();
  });

  const saveQuestions = (newQuestions: Question[]) => {
    setQuestions(newQuestions);
    saveStoredQuestions(newQuestions);
  };

  // Tự động đồng bộ câu hỏi khi có thay đổi từ các tab hoặc trang khác
  useEffect(() => {
    const handleSync = () => {
      setQuestions(getStoredQuestions());
    };
    window.addEventListener('geo_question_bank_updated', handleSync);
    return () => {
      window.removeEventListener('geo_question_bank_updated', handleSync);
    };
  }, []);

  // Bộ lọc dạng câu hỏi và tìm kiếm
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // 5 tính năng nâng cấp: Phân trang, Thu gọn/Mở rộng, Cuộn lên đầu trang, Đổi thứ tự
  const [pageSize, setPageSize] = useState<number>(0); // 0 = Xem tất cả, 10, 20
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isAllCollapsed, setIsAllCollapsed] = useState<boolean>(false);
  const [collapsedQuestionIds, setCollapsedQuestionIds] = useState<string[]>([]);
  const [showScrollTop, setShowScrollTop] = useState<boolean>(false);
  const questionListRef = useRef<HTMLDivElement>(null);

  // 4. Quản lý tích chọn câu hỏi để TẠO ĐỀ KIỂM TRA
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [isCreateExamModalOpen, setIsCreateExamModalOpen] = useState(false);

  // Form tạo đề thi nhanh từ câu hỏi đã chọn
  const [examFormTitle, setExamFormTitle] = useState('');
  const [examDuration, setExamDuration] = useState<number>(15);
  const [targetClasses, setTargetClasses] = useState<string[]>(['Lớp 6A1']);
  const [examDeadline, setExamDeadline] = useState('2026-09-10T23:59');
  const [examAllowLate, setExamAllowLate] = useState(true);

  // Danh sách lớp theo khối đang chọn
  const availableClasses = [
    `Lớp ${selectedGrade}A1`,
    `Lớp ${selectedGrade}A2`,
    `Lớp ${selectedGrade}A3`,
    `Lớp ${selectedGrade}A4`,
  ];

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

  // Editor Modal
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  // Đồng bộ bài học theo khối
  const currentGradeLessons = lessons.filter((l) => l.grade === selectedGrade);
  const currentLesson =
    currentGradeLessons.find((l) => l.id === selectedLessonId) || currentGradeLessons[0];

  // Tự động chuyển bài học khi đổi Khối
  useEffect(() => {
    const firstLesson = currentGradeLessons[0];
    if (firstLesson) {
      setSelectedLessonId(firstLesson.id);
    }
    // Cập nhật lớp mặc định cho form tạo đề thi
    setTargetClasses([`Lớp ${selectedGrade}A1`]);
  }, [selectedGrade]);

  // Cập nhật tên đề thi mặc định khi chọn bài
  useEffect(() => {
    if (currentLesson) {
      setExamFormTitle(`Kiểm Tra 15 Phút - ${currentLesson.title}`);
    }
  }, [currentLesson]);

  // Thêm bài học mới cho khối hiện tại
  const handleAddLesson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLessonTitle.trim()) return;

    const nextLessonNum = currentGradeLessons.length + 1;
    const newLesson: LessonItem = {
      id: `g${selectedGrade}_b${Date.now()}`,
      grade: selectedGrade,
      lesson_number: nextLessonNum,
      title: newLessonTitle.startsWith('Bài') ? newLessonTitle.trim() : `Bài ${nextLessonNum}: ${newLessonTitle.trim()}`,
      chapter: `Khối ${selectedGrade}`,
    };

    const updated = [...lessons, newLesson];
    setLessons(updated);
    saveStoredLessons(updated);
    setSelectedLessonId(newLesson.id);
    setNewLessonTitle('');
    setIsAddLessonOpen(false);
  };

  // Xóa bài học
  const handleDeleteLesson = (lessonId: string) => {
    const lessonToDelete = lessons.find((l) => l.id === lessonId);
    if (confirm(`Cô có chắc chắn muốn xóa bài học "${lessonToDelete?.title}" không?`)) {
      const updatedLessons = lessons.filter((l) => l.id !== lessonId);
      setLessons(updatedLessons);
      saveStoredLessons(updatedLessons);

      if (selectedLessonId === lessonId && updatedLessons.length > 0) {
        setSelectedLessonId(updatedLessons[0].id);
      }
    }
  };

  // State chỉnh sửa bài học (Cây bút ✏️)
  const [isEditLessonOpen, setIsEditLessonOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<LessonItem | null>(null);
  const [editLessonTitle, setEditLessonTitle] = useState('');
  const [editLessonNumber, setEditLessonNumber] = useState<number>(1);

  // Mở modal sửa bài học
  const handleOpenEditLesson = (les: LessonItem) => {
    setEditingLesson(les);
    setEditLessonNumber(les.lesson_number);
    setEditLessonTitle(les.title);
    setIsEditLessonOpen(true);
  };

  // Lưu chỉnh sửa tên bài học
  const handleSaveEditLesson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLesson || !editLessonTitle.trim()) return;

    const formattedTitle = editLessonTitle.trim();
    const updatedLesson: LessonItem = {
      ...editingLesson,
      lesson_number: Number(editLessonNumber) || editingLesson.lesson_number,
      title: formattedTitle,
    };

    const updatedLessons = lessons.map((l) =>
      l.id === editingLesson.id ? updatedLesson : l
    );
    setLessons(updatedLessons);
    saveStoredLessons(updatedLessons);

    // Cập nhật category trong câu hỏi nếu câu hỏi thuộc bài học này
    const updatedQuestions = questions.map((q) => {
      if (q.lesson_id === editingLesson.id || q.category === editingLesson.title) {
        return {
          ...q,
          lesson_id: editingLesson.id,
          category: formattedTitle,
        };
      }
      return q;
    });
    saveQuestions(updatedQuestions);

    setIsEditLessonOpen(false);
    setEditingLesson(null);
  };

  // Lưu câu hỏi (Thêm mới hoặc Chỉnh sửa)
  const handleSaveQuestion = async (q: Question) => {
    try {
      if (editingQuestion) {
        if (isSupabaseConfigured) {
          try {
            await supabase.from('questions').update(q).eq('id', q.id);
          } catch (e) {
            console.warn('Lỗi cập nhật Supabase:', e);
          }
        }
        const updated = questions.map((item) => (item.id === q.id ? q : item));
        saveQuestions(updated);
      } else {
        if (isSupabaseConfigured) {
          try {
            await supabase.from('questions').insert(q);
          } catch (e) {
            console.warn('Lỗi thêm Supabase:', e);
          }
        }
        // Câu hỏi đưa lên trước được giữ ở vị trí trước, câu mới thêm vào nối tiếp ở sau (Câu 1, Câu 2, Câu 3...)
        const updated = [...questions, q];
        saveQuestions(updated);
      }
      setIsEditorOpen(false);
      setEditingQuestion(null);
      alert('🎉 Đã lưu câu hỏi thành công vào bài học!');
    } catch (err: any) {
      console.error('Lỗi khi lưu câu hỏi:', err);
      setIsEditorOpen(false);
      setEditingQuestion(null);
      alert('Đã xảy ra lỗi khi lưu câu hỏi: ' + (err?.message || 'Vui lòng thử lại!'));
    }
  };

  // Xóa câu hỏi
  const handleDeleteQuestion = async (id: string) => {
    if (confirm('Cô có chắc chắn muốn xóa câu hỏi này khỏi bài học không?')) {
      if (isSupabaseConfigured) {
        await supabase.from('questions').delete().eq('id', id);
      }
      const updated = questions.filter((q) => q.id !== id);
      saveQuestions(updated);
      setSelectedQuestionIds(selectedQuestionIds.filter((item) => item !== id));
    }
  };

  // Import từ File Excel (.xlsx) trực tiếp vào bài đang chọn
  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const result = await parseExcelExam(file, selectedGrade);
    if (result.questions.length > 0) {
      // Đếm số lượng câu hỏi hiện có trong bài học để tự động đánh số nối tiếp
      const existingInLessonCount = questions.filter(
        (q) => q.grade === selectedGrade && (q.lesson_id === currentLesson?.id || q.category === currentLesson?.title)
      ).length;

      setPreviewModalState({
        isOpen: true,
        fileName: file.name,
        fileType: 'excel',
        parsedQuestions: result.questions,
        currentExistingCount: existingInLessonCount,
        targetLessonTitle: currentLesson?.title || `Khối ${selectedGrade}`,
      });
    } else {
      alert('Không tìm thấy câu hỏi hợp lệ trong file Excel. Cô hãy xem file mẫu nhé!');
    }
    e.target.value = '';
  };

  // Import từ File Word (.docx) trực tiếp vào bài đang chọn
  const handleImportWord = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const result = await parseWordExam(file, selectedGrade);
    if (result.questions.length > 0) {
      // Đếm số lượng câu hỏi hiện có trong bài học để tự động đánh số nối tiếp
      const existingInLessonCount = questions.filter(
        (q) => q.grade === selectedGrade && (q.lesson_id === currentLesson?.id || q.category === currentLesson?.title)
      ).length;

      setPreviewModalState({
        isOpen: true,
        fileName: file.name,
        fileType: 'word',
        parsedQuestions: result.questions,
        currentExistingCount: existingInLessonCount,
        targetLessonTitle: currentLesson?.title || `Khối ${selectedGrade}`,
      });
    } else {
      alert(
        result.errors.join('\n') ||
          'Không nhận diện được câu hỏi. Cô hãy đảm bảo file Word có cấu trúc "Câu 1: ... A. ... B. ... C. ... D. ...".'
      );
    }
    e.target.value = '';
  };

  // Xác nhận nạp câu hỏi từ Preview Modal vào Bài Học
  const handleConfirmImportFromPreview = async (selectedQuestions: Question[]) => {
    const enriched = selectedQuestions.map((q) => ({
      ...q,
      grade: selectedGrade,
      lesson_id: currentLesson?.id,
      category: currentLesson?.title || `Khối ${selectedGrade}`,
    }));

    if (isSupabaseConfigured) {
      for (const q of enriched) {
        await supabase.from('questions').insert(q);
      }
    }

    const updated = [...questions, ...enriched];
    saveQuestions(updated);
    triggerCelebration();
    alert(`🎉 Đã nạp thành công ${enriched.length} câu hỏi vào "${currentLesson?.title}"!`);
  };

  // LỌC CÂU HỎI: CHỈ LẤY CÂU HỎI CỦA BÀI HỌC VÀ KHỐI ĐANG CHỌN
  const currentLessonQuestions = questions.filter((q) => {
    if (q.grade !== selectedGrade) return false;
    // Khớp đúng mã bài học hoặc tên bài học
    const matchLesson =
      q.lesson_id === currentLesson?.id ||
      q.category === currentLesson?.title ||
      (!q.lesson_id && currentLesson?.lesson_number === 1);
    return matchLesson;
  });

  const filteredQuestions = currentLessonQuestions.filter((q) => {
    // Lọc theo dạng câu hỏi
    if (typeFilter !== 'all' && q.type !== typeFilter) return false;
    // Lọc theo từ khóa tìm kiếm
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchTitle = q.title.toLowerCase().includes(term);
      const matchTag = q.tags?.some((t) => t.toLowerCase().includes(term));
      if (!matchTitle && !matchTag) return false;
    }
    return true;
  });

  // 1. Tính tổng điểm của tất cả câu hỏi trong bài học
  const totalLessonPoints = useMemo(() => {
    return Number(
      filteredQuestions
        .reduce((sum, q) => sum + (Number(q.points) || 1.0), 0)
        .toFixed(1)
    );
  }, [filteredQuestions]);

  // 2. Xử lý phân trang
  const totalPages = pageSize > 0 ? Math.ceil(filteredQuestions.length / pageSize) : 1;
  const displayedQuestions = useMemo(() => {
    if (pageSize === 0) return filteredQuestions;
    const start = (currentPage - 1) * pageSize;
    return filteredQuestions.slice(start, start + pageSize);
  }, [filteredQuestions, currentPage, pageSize]);

  // Reset trang về 1 khi đổi bài học hoặc đổi bộ lọc
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedLessonId, typeFilter, searchTerm, pageSize]);

  // 3. Xử lý Thu Gọn / Mở Rộng Tất Cả
  const toggleCollapseQuestion = (qId: string) => {
    setCollapsedQuestionIds((prev) =>
      prev.includes(qId) ? prev.filter((id) => id !== qId) : [...prev, qId]
    );
  };

  const handleToggleAllCollapse = () => {
    if (isAllCollapsed) {
      setCollapsedQuestionIds([]);
      setIsAllCollapsed(false);
    } else {
      setCollapsedQuestionIds(filteredQuestions.map((q) => q.id));
      setIsAllCollapsed(true);
    }
  };

  // 4. Xử lý Đổi Thứ Tự Câu Hỏi (Lên / Xuống)
  const handleMoveQuestion = (questionId: string, direction: 'up' | 'down') => {
    const currentIndex = questions.findIndex((q) => q.id === questionId);
    if (currentIndex === -1) return;

    // Tìm câu hỏi liền kề trong cùng bài học để hoán đổi
    const lessonQIndices = questions
      .map((q, idx) => ({ q, idx }))
      .filter(({ q }) => q.lesson_id === currentLesson?.id || q.category === currentLesson?.title);

    const relativePos = lessonQIndices.findIndex(({ q }) => q.id === questionId);
    if (relativePos === -1) return;

    const targetPos = direction === 'up' ? relativePos - 1 : relativePos + 1;
    if (targetPos < 0 || targetPos >= lessonQIndices.length) return;

    const targetGlobalIndex = lessonQIndices[targetPos].idx;

    const updated = [...questions];
    const temp = updated[currentIndex];
    updated[currentIndex] = updated[targetGlobalIndex];
    updated[targetGlobalIndex] = temp;

    setQuestions(updated);
    saveQuestions(updated);
  };

  // 5. Cuộn nhanh lên đầu danh sách câu hỏi
  const handleQuestionListScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const top = e.currentTarget.scrollTop;
    setShowScrollTop(top > 100);
  };

  const scrollToTop = () => {
    if (questionListRef.current) {
      questionListRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Xử lý tích chọn câu hỏi
  const toggleSelectQuestion = (qId: string) => {
    if (selectedQuestionIds.includes(qId)) {
      setSelectedQuestionIds(selectedQuestionIds.filter((id) => id !== qId));
    } else {
      setSelectedQuestionIds([...selectedQuestionIds, qId]);
    }
  };

  const handleSelectAllInLesson = () => {
    const allIdsInLesson = filteredQuestions.map((q) => q.id);
    const areAllSelected = allIdsInLesson.every((id) => selectedQuestionIds.includes(id));

    if (areAllSelected) {
      setSelectedQuestionIds(selectedQuestionIds.filter((id) => !allIdsInLesson.includes(id)));
    } else {
      const combined = Array.from(new Set([...selectedQuestionIds, ...allIdsInLesson]));
      setSelectedQuestionIds(combined);
    }
  };

  // Tính tổng điểm các câu hỏi được chọn
  const selectedQuestions = questions.filter((q) => selectedQuestionIds.includes(q.id));
  const totalSelectedPoints = selectedQuestions
    .reduce((sum, q) => sum + (q.points || 1.0), 0)
    .toFixed(1);

  // XÁC NHẬN TẠO ĐỀ KIỂM TRA TỪ CÁC CÂU HỎI ĐÃ CHỌN
  const handleConfirmCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedQuestionIds.length === 0) {
      alert('Cô hãy tích chọn ít nhất 1 câu hỏi để tạo đề kiểm tra nhé!');
      return;
    }
    if (targetClasses.length === 0) {
      alert('Cô hãy chọn ít nhất 1 lớp để giao bài kiểm tra này!');
      return;
    }

    const calcTotalPoints = Number(totalSelectedPoints) || selectedQuestions.reduce((sum, q) => sum + (q.points || 1.0), 0);

    const newAssignment: Assignment = {
      id: 'asg_' + Date.now(),
      exam_id: 'ex_' + Date.now(),
      title: examFormTitle.trim() || `Kiểm Tra Địa Lí Khối ${selectedGrade}`,
      target_type: 'class',
      target_ids: targetClasses,
      start_time: new Date().toISOString(),
      deadline: examDeadline,
      allow_late: examAllowLate,
      grade: selectedGrade,
      category: examDuration <= 15 ? 'Kiểm tra 15 phút' : 'Kiểm tra',
      duration_minutes: examDuration,
      questions: selectedQuestions,
      questions_count: selectedQuestions.length,
      total_points: calcTotalPoints,
      submissions_count: 0,
      total_students: targetClasses.length * 35,
    };

    // 1. Lưu vào LocalStorage
    let updatedAsgs = [newAssignment];
    try {
      const currentAsgs = JSON.parse(localStorage.getItem('geo_assignments') || '[]');
      updatedAsgs = [newAssignment, ...currentAsgs];
      localStorage.setItem('geo_assignments', JSON.stringify(updatedAsgs));
    } catch (err) {
      console.warn('Lỗi lưu đề kiểm tra:', err);
    }

    // 2. Tự động đồng bộ lên Supabase Cloud để học sinh nhận ngay
    await saveAssignmentsToCloud(updatedAsgs);

    // Hiệu ứng ăn mừng
    triggerCelebration();
    setIsCreateExamModalOpen(false);
    setSelectedQuestionIds([]);

    alert(`🎉 Tạo đề kiểm tra thành công từ ${selectedQuestions.length} câu hỏi đã chọn cho các lớp: ${targetClasses.join(', ')}!\nTổng điểm: ${calcTotalPoints}đ • Thời gian: ${examDuration} phút.`);
    navigate('/assignments');
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
        return 'Điền từ còn thiếu';
      case 'drag_drop':
        return 'Kéo thả cặp đôi';
      case 'essay':
        return 'Tự luận / Văn bản';
      default:
        return t;
    }
  };

  const getTypeBadgeColor = (t: QuestionType) => {
    switch (t) {
      case 'single_choice':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'multiple_choice':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'true_false':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'fill_blank':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'drag_drop':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'essay':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16">
      {/* 1. Header Trang Ngân Hàng Đề Thi */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-ocean-600" />
            <span>Kho Đề Môn Địa Lí</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Phân loại câu hỏi theo Khối & Số Bài học • Tích chọn câu hỏi theo bài để tạo đề kiểm tra
          </p>
        </div>
      </div>

      {/* 2. CHỌN KHỐI (BỎ HOÀN TOÀN MỤC TẤT CẢ KHỐI, CHỈ HIỂN THỊ KHỐI 6, 7, 8, 9) */}
      <div className="flex items-center justify-between bg-white p-2 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-slate-500 px-3 hidden sm:inline">
            Chọn Khối:
          </span>
          {[6, 7, 8, 9].map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setSelectedGrade(g)}
              className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition active:scale-95 ${
                selectedGrade === g
                  ? 'bg-ocean-600 text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              Khối {g}
            </button>
          ))}
        </div>

        <div className="text-xs text-slate-500 font-semibold px-3">
          Khối {selectedGrade} có <strong>{currentGradeLessons.length}</strong> bài học • <strong>{questions.filter((q) => q.grade === selectedGrade).length}</strong> câu hỏi
        </div>
      </div>

      {/* 3. BỐ CỤC 2 CỘT MỞ RỘNG TOÀN DIỆN: CỘT TRÁI HIỆN BÀI HỌC CÓ NÚT SỬA TÊN ✏️ - CỘT PHẢI HIỆN CÂU HỎI */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* CỘT TRÁI (4/12 CỘT = RỘNG THOẢI MÁI): DANH SÁCH BÀI HỌC CỦA KHỐI ĐÃ CHỌN */}
        <div className="xl:col-span-4 bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-black text-slate-900 text-base flex items-center gap-1.5">
                  <BookOpen className="w-5 h-5 text-ocean-600" />
                  <span>Danh Sách Bài Khối {selectedGrade}</span>
                </h3>
                <p className="text-xs text-slate-400 font-medium">
                  {currentGradeLessons.length} Bài học chuẩn GDPT 2018
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddLessonOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-ocean-50 text-ocean-700 hover:bg-ocean-100 transition text-xs font-bold flex items-center gap-1 active:scale-95 shadow-xs"
                title="Thêm bài học mới vào khối này"
              >
                <Plus className="w-3.5 h-3.5" /> Thêm Bài
              </button>
            </div>

            <div className="space-y-2.5 max-h-[680px] overflow-y-auto pr-1">
              {currentGradeLessons.map((les) => {
                const isSelected = les.id === currentLesson?.id;
                // Đếm số lượng câu hỏi thuộc bài này
                const qCount = questions.filter(
                  (q) =>
                    q.grade === selectedGrade &&
                    (q.lesson_id === les.id || q.category === les.title)
                ).length;

                return (
                  <div
                    key={les.id}
                    onClick={() => setSelectedLessonId(les.id)}
                    className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-start justify-between gap-3 ${
                      isSelected
                        ? 'bg-ocean-50 border-ocean-400 text-ocean-950 shadow-xs'
                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div
                        className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-xs font-black mt-0.5 ${
                          isSelected
                            ? 'bg-ocean-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {les.title.startsWith('Chủ đề 1')
                          ? 'CĐ1'
                          : les.title.startsWith('Chủ đề 2')
                          ? 'CĐ2'
                          : les.title.startsWith('Chủ đề 3')
                          ? 'CĐ3'
                          : les.lesson_number === 0
                          ? 'MĐ'
                          : `B${les.lesson_number}`}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold leading-snug text-slate-900 break-words">
                          {les.title}
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                              qCount > 0
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-400'
                            }`}
                          >
                            {qCount} câu hỏi
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Nút Cây Bút ✏️ để sửa tên bài và Thùng rác để xóa */}
                    <div className="flex items-center gap-1 shrink-0 ml-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditLesson(les);
                        }}
                        title="Sửa tên bài học này"
                        className="p-1.5 text-slate-400 hover:text-ocean-600 hover:bg-ocean-100 rounded-lg transition"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteLesson(les.id);
                        }}
                        title="Xóa bài học này"
                        className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* CỘT PHẢI (8/12 CỘT = KHÔNG GIAN RỘNG RÃI): DANH SÁCH CÁC CÂU HỎI TRONG BÀI ĐANG CHỌN */}
        <div className="xl:col-span-8 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
          {/* KHỐI TIÊU ĐỀ BÀI HỌC VÀ THANH CÔNG CỤ TÁC VỤ */}
          <div className="pb-3.5 border-b border-slate-100 space-y-3">
            {/* Tầng 1: Tên bài học và 2 nút tác vụ chính (Import Word & Thêm câu) */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                    {currentLesson?.title || `Bài học Khối ${selectedGrade}`}
                  </h2>
                  <span className="text-xs bg-ocean-100 text-ocean-800 font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap shadow-2xs">
                    {filteredQuestions.length} Câu Hỏi • Tổng {totalLessonPoints} Điểm
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Khối {selectedGrade} • Chuyên môn Địa lí THCS
                </p>
              </div>

              {/* 2 nút tác vụ chính ở hàng trên: Import Word & Thêm câu */}
              <div className="flex items-center gap-2 shrink-0">
                <label className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold cursor-pointer transition active:scale-95 shadow-xs">
                  <FileText className="w-3.5 h-3.5" /> Import Word
                  <input
                    type="file"
                    accept=".docx"
                    onChange={handleImportWord}
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  onClick={() => {
                    setEditingQuestion(null);
                    setIsEditorOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-ocean-600 hover:bg-ocean-700 text-white text-xs font-bold shadow-xs transition active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" /> Thêm câu
                </button>
              </div>
            </div>

            {/* Tầng 2: Thanh công cụ thao tác nhanh (Chọn cả bài + Thu gọn/Mở rộng + Phân trang + Lọc dạng câu + Ô tìm kiếm) */}
            <div className="flex flex-col sm:flex-row items-center gap-2 pt-1 flex-wrap">
              {/* Nút Chọn cả bài */}
              <button
                type="button"
                onClick={handleSelectAllInLesson}
                disabled={filteredQuestions.length === 0}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition active:scale-95 disabled:opacity-50 shrink-0"
              >
                <CheckSquare className="w-3.5 h-3.5 text-ocean-600" />
                {filteredQuestions.every((q) => selectedQuestionIds.includes(q.id)) &&
                filteredQuestions.length > 0
                  ? 'Bỏ Chọn Hết'
                  : 'Chọn Cả Bài'}
              </button>

              {/* Nút Thu Gọn / Mở Rộng Tất Cả */}
              <button
                type="button"
                onClick={handleToggleAllCollapse}
                disabled={filteredQuestions.length === 0}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition active:scale-95 disabled:opacity-50 shrink-0"
                title={isAllCollapsed ? 'Mở rộng toàn bộ câu hỏi' : 'Thu gọn toàn bộ câu hỏi'}
              >
                {isAllCollapsed ? (
                  <>
                    <ChevronsUpDown className="w-3.5 h-3.5 text-ocean-600" />
                    <span>Mở Rộng</span>
                  </>
                ) : (
                  <>
                    <ChevronsDownUp className="w-3.5 h-3.5 text-ocean-600" />
                    <span>Thu Gọn</span>
                  </>
                )}
              </button>

              {/* Bộ chọn phân trang (Xem tất cả / 10 / 20 câu) */}
              <div className="w-full sm:w-28 shrink-0">
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="w-full px-2.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-ocean-500"
                  title="Chọn số lượng câu hỏi hiển thị mỗi trang"
                >
                  <option value={0}>Tất cả</option>
                  <option value={10}>10 câu/trang</option>
                  <option value={20}>20 câu/trang</option>
                </select>
              </div>

              {/* Lọc 6 Dạng câu hỏi */}
              <div className="w-full sm:w-44 shrink-0">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-ocean-500"
                >
                  <option value="all">Tất cả dạng câu</option>
                  <option value="single_choice">1. Trắc nghiệm 1 ĐA</option>
                  <option value="multiple_choice">2. Trắc nghiệm nhiều ĐA</option>
                  <option value="true_false">3. Đúng / Sai</option>
                  <option value="fill_blank">4. Điền từ</option>
                  <option value="drag_drop">5. Ghép cặp</option>
                  <option value="essay">6. Tự luận</option>
                </select>
              </div>

              {/* Ô tìm kiếm câu hỏi */}
              <div className="relative flex-1 min-w-[160px] w-full">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={`Tìm câu hỏi...`}
                  className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-ocean-500"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Hàng nút bấm con nhộng lọc nhanh dạng câu hỏi (Capsule Filter Badges chuẩn ảnh mẫu) */}
            <div className="flex items-center gap-1.5 overflow-x-auto pt-2 pb-1 scrollbar-none w-full border-t border-slate-100">
              {[
                { id: 'all', label: 'Tất cả' },
                { id: 'single_choice', label: '1. Trắc nghiệm 1 ĐA' },
                { id: 'multiple_choice', label: '2. Nhiều ĐA' },
                { id: 'true_false', label: '3. Đúng / Sai' },
                { id: 'fill_blank', label: '4. Điền từ' },
                { id: 'drag_drop', label: '5. Ghép cặp' },
                { id: 'essay', label: '6. Tự luận' },
              ].map((pill) => (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => {
                    playSoftClick();
                    setTypeFilter(pill.id);
                  }}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold transition whitespace-nowrap cursor-pointer active:scale-95 ${
                    typeFilter === pill.id
                      ? 'bg-[#2D4441] text-white shadow-sm'
                      : 'bg-[#EDF3F2] text-slate-700 hover:bg-[#E0ECE9] border border-[#D5E2DF]'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>

          {/* DANH SÁCH CÂU HỎI TRONG BÀI ĐANG CHỌN (CÓ THANH CUỘN LĂN DỌC, ĐỔI THỨ TỰ, THU GỌN VÀ NÚT LÊN ĐẦU TRANG) */}
          <div className="relative">
            <div
              ref={questionListRef}
              onScroll={handleQuestionListScroll}
              className="space-y-3.5 max-h-[620px] xl:max-h-[680px] overflow-y-auto pr-2 custom-scrollbar"
            >
            {displayedQuestions.length === 0 ? (
              <div className="py-14 text-center border-2 border-dashed border-slate-200 rounded-3xl">
                <BookOpen className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="font-bold text-slate-700 text-sm">
                  Bài học này chưa có câu hỏi nào
                </p>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  Cô hãy bấm nút <strong className="text-ocean-700">"Thêm câu"</strong> hoặc <strong className="text-blue-700">"Import Word"</strong> ở trên để nạp câu hỏi cho bài học này nhé!
                </p>
              </div>
            ) : (
              displayedQuestions.map((q, idx) => {
                const isSelected = selectedQuestionIds.includes(q.id);
                const isCollapsed = collapsedQuestionIds.includes(q.id);
                const questionNumber = pageSize > 0 ? (currentPage - 1) * pageSize + idx + 1 : idx + 1;

                return (
                  <div
                    key={q.id}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 ${
                      isSelected
                        ? 'bg-[#FAF6EE] border-[#C9942C] shadow-md ring-1 ring-[#C9942C]/40'
                        : 'bg-white border-slate-200 hover:border-[#C9942C] hover:shadow-md hover:-translate-y-0.5'
                    }`}
                  >
                    {/* Header câu hỏi: Checkbox, STT, Dạng câu, Điểm, Đổi thứ tự, Thu gọn, Nút Sửa/Xóa */}
                    <div className="flex items-center justify-between gap-2.5 mb-2.5 flex-wrap sm:flex-nowrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Hộp kiểm checkbox tạo đề */}
                        <button
                          type="button"
                          onClick={() => toggleSelectQuestion(q.id)}
                          className="flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-5 h-5 text-ocean-600 fill-ocean-100" />
                          ) : (
                            <Square className="w-5 h-5 text-slate-400 hover:text-slate-600" />
                          )}
                          <span className="text-xs text-slate-700 font-black">
                            Câu {questionNumber}
                          </span>
                        </button>

                        {/* Badge Dạng câu hỏi */}
                        <span
                          className={`text-[10px] sm:text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${getTypeBadgeColor(
                            q.type
                          )}`}
                        >
                          {getTypeName(q.type)}
                        </span>

                        {/* Điểm số */}
                        <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                          {q.points} Điểm
                        </span>
                      </div>

                      {/* Nhóm tác vụ: Đổi thứ tự (Lên/Xuống) + Thu gọn/Mở rộng + Sửa + Xóa */}
                      <div className="flex items-center gap-1 ml-auto">
                        {/* Nút di chuyển Lên / Xuống */}
                        <div className="flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-lg border border-slate-200/80">
                          <button
                            type="button"
                            onClick={() => handleMoveQuestion(q.id, 'up')}
                            disabled={idx === 0 && currentPage === 1}
                            className="p-1 text-slate-500 hover:text-ocean-600 hover:bg-white rounded transition disabled:opacity-25 disabled:pointer-events-none cursor-pointer"
                            title="Di chuyển câu hỏi này lên trên (Đổi thứ tự)"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveQuestion(q.id, 'down')}
                            disabled={idx === displayedQuestions.length - 1 && (pageSize === 0 || currentPage === totalPages)}
                            className="p-1 text-slate-500 hover:text-ocean-600 hover:bg-white rounded transition disabled:opacity-25 disabled:pointer-events-none cursor-pointer"
                            title="Di chuyển câu hỏi này xuống dưới (Đổi thứ tự)"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Nút Thu gọn / Mở rộng từng câu */}
                        <button
                          type="button"
                          onClick={() => toggleCollapseQuestion(q.id)}
                          className="p-1.5 text-slate-500 hover:text-ocean-600 hover:bg-ocean-50 rounded-lg transition"
                          title={isCollapsed ? 'Mở rộng câu hỏi' : 'Thu gọn câu hỏi'}
                        >
                          {isCollapsed ? (
                            <ChevronDown className="w-4 h-4 text-ocean-600" />
                          ) : (
                            <ChevronUp className="w-4 h-4" />
                          )}
                        </button>

                        {/* Nút Chỉnh sửa */}
                        <button
                          type="button"
                          onClick={() => {
                            setEditingQuestion(q);
                            setIsEditorOpen(true);
                          }}
                          className="p-1.5 text-slate-500 hover:text-ocean-600 hover:bg-ocean-50 rounded-lg transition"
                          title="Chỉnh sửa câu hỏi này"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        {/* Nút Xóa */}
                        <button
                          type="button"
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Xóa câu hỏi này"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Khi câu hỏi bị thu gọn: Chỉ hiện 1 dòng tiêu đề ngắn gọn */}
                    {isCollapsed ? (
                      <div
                        onClick={() => toggleCollapseQuestion(q.id)}
                        className="text-xs text-slate-500 font-medium truncate cursor-pointer hover:text-ocean-700 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 flex items-center justify-between gap-2"
                      >
                        <span className="truncate">
                          {q.content_json?.question || q.content_json?.prompt || q.title || 'Nội dung câu hỏi...'}
                        </span>
                        <span className="text-[10px] font-bold text-ocean-600 shrink-0">
                          (Đang thu gọn • Bấm để xem chi tiết)
                        </span>
                      </div>
                    ) : (
                      <>
                        {/* Nội dung câu hỏi đầy đủ (Hiển thị LaTeX, định dạng rich text & thơ lục bát) */}
                        <div className="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed mb-3 whitespace-pre-line">
                          <LatexRenderer content={q.content_json?.question || q.content_json?.prompt || q.title || ''} />
                        </div>

                        {/* Hiển thị hình ảnh minh họa / tư liệu quan sát (nếu có) */}
                        {q.content_json?.image_url && (
                          <div className="mb-3 max-w-md bg-slate-50 border border-slate-200 rounded-xl p-2 text-center">
                            <img
                              src={q.content_json.image_url}
                              alt={q.content_json.image_caption || 'Tư liệu câu hỏi'}
                              className="max-h-52 w-auto max-w-full object-contain rounded-lg mx-auto shadow-2xs"
                            />
                            {q.content_json.image_caption && (
                              <div className="text-[11px] font-semibold text-slate-600 italic mt-1">
                                {q.content_json.image_caption}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Hiển thị chi tiết từng dạng câu */}
                        {(q.type === 'single_choice' || q.type === 'multiple_choice') && q.content_json?.options && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                            {q.content_json.options.map((opt: string, optIdx: number) => {
                              const isCorrect =
                                q.type === 'single_choice'
                                  ? q.correct_answer_json?.correct_index === optIdx
                                  : q.correct_answer_json?.correct_indices?.includes(optIdx);
                              return (
                                <div
                                  key={optIdx}
                                  className={`p-2.5 rounded-xl text-xs border flex items-center gap-2 ${
                                    isCorrect
                                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold'
                                      : 'bg-slate-50 border-slate-200 text-slate-700'
                                  }`}
                                >
                                  <span className="w-5 h-5 rounded-full bg-white text-slate-700 border flex items-center justify-center font-bold text-[10px] shrink-0">
                                    {String.fromCharCode(65 + optIdx)}
                                  </span>
                                  <div className="flex-1 min-w-0 space-y-1">
                                    {opt && <LatexRenderer content={opt} />}
                                    {q.content_json?.option_images?.[optIdx] && (
                                      <img
                                        src={q.content_json.option_images[optIdx]!}
                                        alt={`Ảnh ${String.fromCharCode(65 + optIdx)}`}
                                        className="h-14 w-auto object-contain rounded border border-slate-200 bg-white p-0.5"
                                      />
                                    )}
                                  </div>
                                  {isCorrect && (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 ml-auto shrink-0" />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {q.type === 'true_false' && q.content_json?.statements && (
                          <div className="space-y-1.5 mb-3">
                            {q.content_json.statements.map((st: any) => {
                              const isTrue = q.correct_answer_json?.tf_answers?.[st.id];
                              return (
                                <div
                                  key={st.id}
                                  className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between gap-2"
                                >
                                  <div className="flex-1 min-w-0 text-slate-700">
                                    <LatexRenderer content={st.text} />
                                  </div>
                                  <span
                                    className={`font-bold px-2 py-0.5 rounded-md text-[10px] shrink-0 ${
                                      isTrue
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : 'bg-rose-100 text-rose-800'
                                    }`}
                                  >
                                    {isTrue ? 'Đúng' : 'Sai'}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {q.type === 'fill_blank' && (
                          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs mb-3 space-y-2">
                            <div className="text-slate-800 font-medium">
                              <LatexRenderer content={q.content_json?.template || q.content_json?.question || ''} />
                            </div>
                            <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-200/60">
                              <span className="font-bold text-ocean-700">Từ cần điền:</span>
                              {q.correct_answer_json?.blanks &&
                                Object.entries(q.correct_answer_json.blanks).map(
                                  ([k, v]) => (
                                    <span
                                      key={k}
                                      className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-bold"
                                    >
                                      [{k}]: {String(v)}
                                    </span>
                                  )
                                )}
                            </div>
                          </div>
                        )}

                        {q.type === 'drag_drop' && q.content_json?.pairs && (
                          <div className="space-y-1.5 mb-3">
                            {q.content_json.pairs.map((p: any) => (
                              <div
                                key={p.id}
                                className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between gap-2"
                              >
                                <div className="font-bold text-slate-800 flex-1">
                                  <LatexRenderer content={p.left} />
                                </div>
                                <span className="text-slate-400 font-bold">⇄</span>
                                <div className="text-ocean-800 font-semibold flex-1 text-right">
                                  <LatexRenderer content={p.right} />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {q.type === 'essay' && (
                          <div className="p-3 rounded-xl bg-purple-50/60 border border-purple-200 text-xs mb-3 space-y-1">
                            <div className="font-bold text-purple-900 flex items-center gap-1">
                              <FileText className="w-3.5 h-3.5" /> Gợi ý đáp án tự luận / thang điểm:
                            </div>
                            <div className="text-slate-700">
                              <LatexRenderer
                                content={
                                  q.correct_answer_json?.essay_sample ||
                                  q.content_json?.sample_answer ||
                                  'Chưa có đáp án mẫu.'
                                }
                              />
                            </div>
                          </div>
                        )}

                        {/* Lời giải thích & Tags */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[11px]">
                          {q.explanation && (
                            <div className="text-slate-500">
                              <strong className="text-ocean-700">Lời giải thích:</strong> {q.explanation}
                            </div>
                          )}
                          <div className="flex items-center gap-1.5 ml-auto">
                            {q.tags?.map((tag, tIdx) => (
                              <span
                                key={tIdx}
                                className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-semibold text-[10px]"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                );
              })
            )}
            </div>

            {/* Nút Cuộn Nhanh Lên Đầu Danh Sách (Back to Top) */}
            {showScrollTop && (
              <button
                type="button"
                onClick={scrollToTop}
                className="absolute bottom-4 right-4 z-30 flex items-center gap-1.5 px-3 py-2 bg-ocean-600 hover:bg-ocean-700 text-white rounded-full shadow-xl border border-white/30 text-xs font-bold transition active:scale-95 animate-in fade-in cursor-pointer"
                title="Cuộn nhanh lên đầu danh sách câu hỏi"
              >
                <ArrowUp className="w-3.5 h-3.5" />
                <span className="text-[11px]">Lên đầu</span>
              </button>
            )}
          </div>

          {/* Thanh Điều Hướng Phân Trang (Hiển thị khi chọn xem 10 / 20 câu và có nhiều trang) */}
          {pageSize > 0 && totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
              <span className="text-slate-500 font-medium">
                Hiển thị <strong>{(currentPage - 1) * pageSize + 1}</strong> - <strong>{Math.min(currentPage * pageSize, filteredQuestions.length)}</strong> trong tổng số <strong>{filteredQuestions.length}</strong> câu
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold transition disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                >
                  ← Trang trước
                </button>
                <span className="px-3 py-1.5 bg-ocean-50 text-ocean-700 font-bold rounded-xl border border-ocean-200">
                  Trang {currentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold transition disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                >
                  Trang sau →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. THANH NỔI BẬT DƯỚI CÙNG KHI CÔ TÍCH CHỌN CÂU HỎI ĐỂ TẠO ĐỀ THI */}
      {selectedQuestionIds.length > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-slate-950/90 backdrop-blur-md text-white px-6 py-3.5 rounded-2xl shadow-2xl border border-white/20 flex flex-wrap items-center gap-4 animate-in slide-in-from-bottom duration-300 max-w-2xl w-[92%] justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-ocean-500 text-white flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-black">
                Đã chọn {selectedQuestionIds.length} câu hỏi • Tổng: {totalSelectedPoints} Điểm
              </div>
              <p className="text-[11px] text-slate-300">
                Sẵn sàng tạo đề kiểm tra cho học sinh Khối {selectedGrade}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedQuestionIds([])}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-slate-300 transition"
            >
              Hủy Chọn
            </button>

            <button
              type="button"
              onClick={() => setIsCreateExamModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-ocean-500 to-teal-500 hover:from-ocean-600 hover:to-teal-600 text-white text-xs font-black shadow-lg transition active:scale-95 flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              Tạo Đề Kiểm Tra & Giao Bài
            </button>
          </div>
        </div>
      )}

      {/* Modal Thêm Bài Học Mới */}
      {isAddLessonOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="font-bold text-slate-900 text-base">
              Thêm Bài Học Mới (Khối {selectedGrade})
            </h3>
            <form onSubmit={handleAddLesson} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tên bài học hoặc chuyên đề:
                </label>
                <input
                  type="text"
                  required
                  placeholder={`Ví dụ: Bài ${currentGradeLessons.length + 1}: Ôn tập kiểm tra giữa kì`}
                  value={newLessonTitle}
                  onChange={(e) => setNewLessonTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-ocean-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddLessonOpen(false)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-ocean-600 hover:bg-ocean-700 text-white text-xs font-bold"
                >
                  Tạo Bài Học
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Soạn Thảo Câu Hỏi */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <QuestionEditor
            initialQuestion={editingQuestion}
            defaultGrade={selectedGrade}
            defaultLessonId={currentLesson?.id}
            defaultLessonTitle={currentLesson?.title}
            onSave={handleSaveQuestion}
            onCancel={() => {
              setIsEditorOpen(false);
              setEditingQuestion(null);
            }}
          />
        </div>
      )}

      {/* Modal TẠO ĐỀ KIỂM TRA & GIAO BÀI TỪ CÁC CÂU HỎI ĐÃ CHỌN */}
      {isCreateExamModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-ocean-100 text-ocean-700 flex items-center justify-center font-bold">
                  <Zap className="w-4 h-4 fill-current" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Tạo Đề Kiểm Tra & Giao Bài
                  </h3>
                  <p className="text-xs text-slate-500">
                    Đã tích chọn <strong>{selectedQuestions.length}</strong> câu hỏi (Tổng: <strong>{totalSelectedPoints}</strong> điểm)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateExamModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmCreateExam} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tên đề kiểm tra:
                </label>
                <input
                  type="text"
                  required
                  value={examFormTitle}
                  onChange={(e) => setExamFormTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-ocean-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Thời gian làm bài:
                  </label>
                  <select
                    value={examDuration}
                    onChange={(e) => setExamDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-ocean-500"
                  >
                    <option value={15}>15 Phút (Kiểm tra nhanh)</option>
                    <option value={20}>20 Phút</option>
                    <option value={45}>45 Phút (Kiểm tra 1 tiết)</option>
                    <option value={60}>60 Phút</option>
                    <option value={90}>90 Phút (Thi học kì)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Hạn nộp bài:
                  </label>
                  <input
                    type="datetime-local"
                    value={examDeadline}
                    onChange={(e) => setExamDeadline(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-ocean-500"
                  />
                </div>
              </div>

              {/* Chọn lớp nhận bài kiểm tra */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Giao cho các lớp Khối {selectedGrade}:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {availableClasses.map((cls) => {
                    const isChecked = targetClasses.includes(cls);
                    return (
                      <label
                        key={cls}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-bold cursor-pointer transition ${
                          isChecked
                            ? 'bg-ocean-50 border-ocean-400 text-ocean-950'
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setTargetClasses(targetClasses.filter((c) => c !== cls));
                            } else {
                              setTargetClasses([...targetClasses, cls]);
                            }
                          }}
                          className="rounded text-ocean-600"
                        />
                        <span>{cls}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Tùy chọn nộp muộn */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-xs font-bold text-slate-700">
                  Cho phép học sinh nộp muộn sau hạn:
                </span>
                <input
                  type="checkbox"
                  checked={examAllowLate}
                  onChange={(e) => setExamAllowLate(e.target.checked)}
                  className="w-4 h-4 text-ocean-600 rounded"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateExamModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-ocean-600 to-teal-600 hover:from-ocean-700 hover:to-teal-700 text-white text-xs font-black shadow-md transition active:scale-95 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Xác Nhận & Giao Bài Ngay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CHỈNH SỬA TÊN BÀI HỌC (CÂY BÚT ✏️) */}
      {isEditLessonOpen && editingLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <Edit className="w-5 h-5 text-ocean-600" />
                <span>Chỉnh Sửa Tên Bài Học (Khối {selectedGrade})</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsEditLessonOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditLesson} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Số thứ tự bài:
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={editLessonNumber}
                  onChange={(e) => setEditLessonNumber(parseInt(e.target.value) || 1)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-ocean-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tên đầy đủ của bài học:
                </label>
                <textarea
                  rows={3}
                  value={editLessonTitle}
                  onChange={(e) => setEditLessonTitle(e.target.value)}
                  placeholder="Ví dụ: Bài 1: Hệ thống kinh, vĩ tuyến và tọa độ địa lí"
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-ocean-500 focus:outline-none"
                  required
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditLessonOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-black text-white bg-ocean-600 hover:bg-ocean-700 rounded-xl shadow-xs transition active:scale-95"
                >
                  Lưu Thay Đổi
                </button>
              </div>
            </form>
          </div>
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
