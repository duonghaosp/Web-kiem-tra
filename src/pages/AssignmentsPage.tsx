import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  CalendarCheck,
  Plus,
  Trash2,
  Copy,
  CheckCircle2,
  Clock,
  Users,
  ArrowRight,
  Sparkles,
  BookOpen,
  Shuffle,
  ListFilter,
  CheckSquare,
  Square,
  AlertCircle,
  X,
  ChevronDown,
  ChevronUp,
  Zap,
  Award,
  Filter,
  Check,
  BookmarkPlus,
  FolderOpen,
  Layers,
  PieChart,
  RotateCcw,
  RotateCw,
  QrCode,
  Eye,
  PauseCircle,
  PlayCircle,
  Volume2,
  VolumeX,
  FileEdit,
  Cloud,
  Search,
} from 'lucide-react';
import { Assignment, TargetType, Question, QuestionType, Profile } from '../types/database';
import { getStoredLessons, LessonItem } from '../data/curriculum';
import { getStoredQuestions } from '../data/questionBank';
import { getStoredStudents } from '../data/studentsData';
import { fetchStudentsFromCloud } from '../lib/studentCloudSync';
import {
  ExamTemplate,
  DEFAULT_EXAM_TEMPLATES,
  getStoredExamTemplates,
  saveStoredExamTemplates,
} from '../data/examTemplates';
import { triggerCelebration } from '../lib/gamification';
import { LatexRenderer } from '../components/common/LatexRenderer';
import { AssignmentQrModal } from '../components/assignments/AssignmentQrModal';
import { AssignmentPreviewModal } from '../components/assignments/AssignmentPreviewModal';
import { DeleteAssignmentWarningModal } from '../components/assignments/DeleteAssignmentWarningModal';
import { AssignmentTrashModal } from '../components/assignments/AssignmentTrashModal';
import { EditAssignmentQuestionsModal } from '../components/assignments/EditAssignmentQuestionsModal';
import { SubmissionStatusModal } from '../components/assignments/SubmissionStatusModal';
import {
  saveAssignmentsToCloud,
  fetchAssignmentsFromCloud,
  fetchStudentSubmissionsFromCloud,
  saveTrashToCloud,
  fetchTrashFromCloud,
  deleteAssignmentFromCloud,
  restoreAssignmentFromCloud,
} from '../lib/assignmentCloudSync';
import { playSubmissionNotificationSound, isSoundEnabled, toggleSoundEnabled } from '../utils/soundEffects';

// Các hình thức đánh giá kiểm tra chuẩn theo Bộ Giáo dục & Đào tạo
interface AssessmentCategory {
  id: string;
  name: string;
  defaultDuration: number;
  badgeColor: string;
  description: string;
}

const ASSESSMENT_CATEGORIES: AssessmentCategory[] = [
  {
    id: 'danh_gia_thuong_xuyen',
    name: 'Đánh giá thường xuyên',
    defaultDuration: 10,
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    description: 'Hỏi đáp nhanh, trắc nghiệm đầu giờ (5 - 10 phút)',
  },
  {
    id: 'kiem_tra_15_phut',
    name: 'Kiểm tra 15 phút',
    defaultDuration: 15,
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
    description: 'Kiểm tra nhanh 1 - 2 bài học trọng tâm',
  },
  {
    id: 'kiem_tra_1_tiet',
    name: 'Kiểm tra 1 tiết (Định kì)',
    defaultDuration: 45,
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    description: 'Đánh giá định kì 45 phút theo ma trận chuẩn',
  },
  {
    id: 'kiem_tra_giua_ki_1',
    name: 'Kiểm tra giữa kì I',
    defaultDuration: 45,
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
    description: 'Đánh giá tổng hợp nửa đầu học kì I',
  },
  {
    id: 'kiem_tra_hoc_ki_1',
    name: 'Kiểm tra học kì I',
    defaultDuration: 60,
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
    description: 'Thi học kì I chính thức (60 - 90 phút)',
  },
  {
    id: 'kiem_tra_giua_ki_2',
    name: 'Kiểm tra giữa kì II',
    defaultDuration: 45,
    badgeColor: 'bg-teal-100 text-teal-800 border-teal-300',
    description: 'Đánh giá tổng hợp nửa đầu học kì II',
  },
  {
    id: 'kiem_tra_hoc_ki_2',
    name: 'Kiểm tra học kì II',
    defaultDuration: 60,
    badgeColor: 'bg-rose-100 text-rose-900 border-rose-300',
    description: 'Thi cuối năm học kì II (60 - 90 phút)',
  },
];

// Danh sách đề thi mặc định ban đầu (Rỗng hoàn toàn khi giáo viên chưa giao bài)
const INITIAL_ASSIGNMENTS: Assignment[] = [];

export const AssignmentsPage: React.FC = () => {
  const navigate = useNavigate();

  // Danh sách các đợt giao bài (lưu trữ cố định trong LocalStorage)
  const [assignments, setAssignments] = useState<Assignment[]>(() => {
    try {
      const saved = localStorage.getItem('geo_assignments');
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Lọc sạch toàn bộ các bài mẫu mặc định cũ
          const cleaned = parsed.filter((a: any) => !['asg_1', 'asg_2', 'asg_3', 'asg_4'].includes(a.id));
          if (cleaned.length !== parsed.length) {
            localStorage.setItem('geo_assignments', JSON.stringify(cleaned));
          }
          return cleaned;
        }
      }
    } catch (e) {
      console.warn('Lỗi đọc assignments:', e);
    }
    return [];
  });

  const saveAssignments = async (newAsgs: Assignment[]): Promise<void> => {
    setAssignments(newAsgs);
    await saveAssignmentsToCloud(newAsgs);
  };

  // Danh sách học sinh thực tế của các lớp để tính chính xác sĩ số nhận đề
  const [students, setStudents] = useState<Profile[]>(() => getStoredStudents());

  // Danh sách bài nộp của học sinh để hiển thị số lượng nộp bài theo thời gian thực
  const [studentSubmissions, setStudentSubmissions] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('geo_student_submissions');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  // Tự động đồng bộ đề thi, bài nộp, thùng rác và danh sách học sinh với Supabase Cloud khi vào trang hoặc chuyển lại tab
  useEffect(() => {
    async function syncAssignmentsWithCloud() {
      setIsSyncing(true);
      try {
        const [cloudAsgs, cloudSubs, cloudTrash, cloudStudents] = await Promise.all([
          fetchAssignmentsFromCloud(),
          fetchStudentSubmissionsFromCloud(),
          fetchTrashFromCloud(),
          fetchStudentsFromCloud(),
        ]);
        if (cloudAsgs && cloudAsgs.length > 0) {
          setAssignments(cloudAsgs);
        }
        if (cloudSubs && cloudSubs.length > 0) {
          setStudentSubmissions(cloudSubs);
        }
        if (cloudTrash && cloudTrash.length > 0) {
          setTrashAssignments(cloudTrash);
        }
        if (cloudStudents && cloudStudents.length > 0) {
          setStudents(cloudStudents);
        }
        const now = new Date();
        setLastSyncedTime(
          `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`
        );
      } catch (err) {
        console.warn('Lỗi tự động đồng bộ đám mây:', err);
      } finally {
        setIsSyncing(false);
      }
    }
    syncAssignmentsWithCloud();

    const handleAssignmentsUpdated = () => {
      try {
        const saved = localStorage.getItem('geo_assignments');
        if (saved) setAssignments(JSON.parse(saved));
      } catch (e) {}
    };

    const handleSubmissionsUpdated = () => {
      try {
        const saved = localStorage.getItem('geo_student_submissions');
        if (saved) setStudentSubmissions(JSON.parse(saved));
      } catch (e) {}
    };

    const handleTrashUpdated = () => {
      try {
        const saved = localStorage.getItem('geo_deleted_assignments');
        if (saved) setTrashAssignments(JSON.parse(saved));
      } catch (e) {}
    };

    const handleStudentsUpdated = () => {
      try {
        setStudents(getStoredStudents());
      } catch (e) {}
    };

    window.addEventListener('geo_assignments_updated', handleAssignmentsUpdated);
    window.addEventListener('geo_student_submissions_updated', handleSubmissionsUpdated);
    window.addEventListener('geo_trash_updated', handleTrashUpdated);
    window.addEventListener('geo_classes_students_updated', handleStudentsUpdated);
    window.addEventListener('storage', handleAssignmentsUpdated);
    window.addEventListener('storage', handleSubmissionsUpdated);
    window.addEventListener('storage', handleTrashUpdated);
    window.addEventListener('storage', handleStudentsUpdated);

    return () => {
      window.removeEventListener('geo_assignments_updated', handleAssignmentsUpdated);
      window.removeEventListener('geo_student_submissions_updated', handleSubmissionsUpdated);
      window.removeEventListener('geo_trash_updated', handleTrashUpdated);
      window.removeEventListener('geo_classes_students_updated', handleStudentsUpdated);
      window.removeEventListener('storage', handleAssignmentsUpdated);
      window.removeEventListener('storage', handleSubmissionsUpdated);
      window.removeEventListener('storage', handleTrashUpdated);
      window.removeEventListener('storage', handleStudentsUpdated);
    };
  }, []);

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<string>('Vừa xong');

  const handleManualRefresh = async () => {
    setIsSyncing(true);
    try {
      const [cloudAsgs, cloudSubs, cloudTrash, cloudStudents] = await Promise.all([
        fetchAssignmentsFromCloud(),
        fetchStudentSubmissionsFromCloud(),
        fetchTrashFromCloud(),
        fetchStudentsFromCloud(),
      ]);
      if (cloudAsgs && cloudAsgs.length > 0) {
        setAssignments(cloudAsgs);
      }
      if (cloudSubs && cloudSubs.length > 0) {
        setStudentSubmissions(cloudSubs);
      }
      if (cloudTrash && cloudTrash.length > 0) {
        setTrashAssignments(cloudTrash);
      }
      if (cloudStudents && cloudStudents.length > 0) {
        setStudents(cloudStudents);
      }
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
      setLastSyncedTime(timeStr);

      const count = cloudAsgs?.length || 0;
      const topList = cloudAsgs ? cloudAsgs.slice(0, 3).map((a, i) => `${i + 1}. ${a.title} (${a.questions_count || 0} câu)`).join('\n') : '';
      alert(`🔄 Đã đồng bộ mới nhất từ Đám Mây (${timeStr})!\n\nTổng cộng: ${count} đề kiểm tra trên hệ thống:\n${topList}\n\nToàn bộ đề thi đã được cập nhật hiển thị ngay lập tức.`);
    } catch (err) {
      console.warn('Lỗi làm mới:', err);
      alert('⚠️ Không thể tải dữ liệu từ Đám mây. Vui lòng kiểm tra lại kết nối mạng hoặc thử lại sau vài giây.');
    } finally {
      setIsSyncing(false);
    }
  };

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [qrModalAssignment, setQrModalAssignment] = useState<Assignment | null>(null);
  const [soundActive, setSoundActive] = useState<boolean>(() => isSoundEnabled());

  // Modal Xem lại đề thi đã giao
  const [previewAssignment, setPreviewAssignment] = useState<Assignment | null>(null);
  const [previewQuestions, setPreviewQuestions] = useState<Question[]>([]);

  // Modal Chỉnh sửa câu hỏi trong đề đã giao (Gợi ý 3)
  const [editingQuestionsAssignment, setEditingQuestionsAssignment] = useState<Assignment | null>(null);

  // Modal Quy trình Tạo Đề & Giao Bài
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Modal Thư viện Đề mẫu chuẩn
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [examTemplates, setExamTemplates] = useState<ExamTemplate[]>(() => getStoredExamTemplates());

  // Thùng rác bài kiểm tra đã xóa (Gợi ý 2)
  const [trashAssignments, setTrashAssignments] = useState<Assignment[]>(() => {
    try {
      const saved = localStorage.getItem('geo_deleted_assignments');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn(e);
    }
    return [];
  });

  const saveTrashAssignments = (newTrash: Assignment[]) => {
    setTrashAssignments(newTrash);
    saveTrashToCloud(newTrash);
  };

  const [isTrashModalOpen, setIsTrashModalOpen] = useState(false);

  // Modal cảnh báo an toàn khi xóa bài có học sinh đã nộp (Gợi ý 3)
  const [warningModalAssignment, setWarningModalAssignment] = useState<Assignment | null>(null);
  const [warningModalSubmissionsCount, setWarningModalSubmissionsCount] = useState<number>(0);

  // Modal Xem chi tiết danh sách học sinh đã nộp / chưa nộp bài (Gợi ý 1)
  const [statusModalAssignment, setStatusModalAssignment] = useState<Assignment | null>(null);

  // Bộ lọc danh sách bài kiểm tra (Gợi ý 3)
  const [filterGrade, setFilterGrade] = useState<number | 'all'>('all');
  const [filterClass, setFilterClass] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'paused' | 'has_submissions'>('all');
  const [searchAssignmentTerm, setSearchAssignmentTerm] = useState<string>('');

  // Danh sách các lớp xuất hiện trong các đề thi đã giao để đưa vào dropdown lọc
  const availableClassesForFilter = useMemo(() => {
    const set = new Set<string>();
    assignments.forEach((a) => {
      (a.target_ids || []).forEach((c) => set.add(c));
    });
    return Array.from(set).sort();
  }, [assignments]);

  // Danh sách bài kiểm tra sau khi áp dụng bộ lọc (Khối, Lớp, Trạng thái, Tìm kiếm)
  const filteredAssignments = useMemo(() => {
    return assignments.filter((asg) => {
      // 1. Lọc theo Khối
      if (filterGrade !== 'all' && asg.grade && Number(asg.grade) !== Number(filterGrade)) {
        return false;
      }
      // 2. Lọc theo Lớp
      if (filterClass !== 'all' && asg.target_ids && !asg.target_ids.includes(filterClass)) {
        return false;
      }
      // 3. Lọc theo Trạng thái
      if (filterStatus === 'active' && asg.is_paused) return false;
      if (filterStatus === 'paused' && !asg.is_paused) return false;
      if (filterStatus === 'has_submissions') {
        const subsCount =
          studentSubmissions.filter((s: any) => s.assignment_id === asg.id).length ||
          asg.submissions_count ||
          0;
        if (subsCount === 0) return false;
      }
      // 4. Tìm kiếm từ khóa
      if (searchAssignmentTerm.trim()) {
        const term = searchAssignmentTerm.toLowerCase();
        const title = (asg.title || '').toLowerCase();
        const cat = (asg.category || '').toLowerCase();
        const classes = (asg.target_ids || []).join(' ').toLowerCase();
        if (!title.includes(term) && !cat.includes(term) && !classes.includes(term)) {
          return false;
        }
      }
      return true;
    });
  }, [assignments, filterGrade, filterClass, filterStatus, searchAssignmentTerm, studentSubmissions]);

  // --- CÁC BƯỚC CỦA QUY TRÌNH TẠO ĐỀ & GIAO BÀI ---
  // 1. Chọn Khối
  const [createGrade, setCreateGrade] = useState<number>(6);

  // 2. Chọn Lớp nhận bài
  const [createSelectedClasses, setCreateSelectedClasses] = useState<string[]>(['Lớp 6A1']);

  // 3. Chọn Hình thức kiểm tra (Đánh giá thường xuyên, 15p, 1 tiết, giữa kì, cuối kì)
  const [selectedCategory, setSelectedCategory] = useState<string>('kiem_tra_15_phut');

  // Thông tin đề thi
  const [examTitle, setExamTitle] = useState<string>('Kiểm Tra 15 Phút: Môn Địa Lí Khối 6');
  const [durationMinutes, setDurationMinutes] = useState<number>(15);
  const [deadlineDate, setDeadlineDate] = useState<string>('2026-09-10T23:59');
  const [allowLate, setAllowLate] = useState<boolean>(true);
  const [shuffleQuestions, setShuffleQuestions] = useState<boolean>(true);

  // 4. CHẾ ĐỘ CHỌN CÂU HỎI: 'random' (Ngẫu nhiên theo bài) HOẶC 'manual' (Tự chọn từ kho đề)
  const [questionSelectMode, setQuestionSelectMode] = useState<'random' | 'manual'>('random');

  // Dữ liệu bài học và câu hỏi từ hệ thống
  const [allQuestionsVersion, setAllQuestionsVersion] = useState(0);

  useEffect(() => {
    const handleSyncQuestions = () => {
      setAllQuestionsVersion((v) => v + 1);
    };
    window.addEventListener('geo_question_bank_updated', handleSyncQuestions);
    return () => {
      window.removeEventListener('geo_question_bank_updated', handleSyncQuestions);
    };
  }, []);

  const allLessons = useMemo(() => getStoredLessons(), [isCreateModalOpen]);
  const allQuestions = useMemo(() => getStoredQuestions(), [isCreateModalOpen, allQuestionsVersion]);

  // Danh sách bài học của khối đang chọn
  const gradeLessons = useMemo(() => {
    return allLessons.filter((l) => l.grade === createGrade);
  }, [allLessons, createGrade]);

  // Danh sách câu hỏi của khối đang chọn
  const gradeQuestions = useMemo(() => {
    return allQuestions.filter((q) => q.grade === createGrade);
  }, [allQuestions, createGrade]);

  // --- TRẠNG THÁI CHO CHẾ ĐỘ 1: BỐC NGẪU NHIÊN THEO PHẠM VI BÀI HỌC ---
  const [startLessonNum, setStartLessonNum] = useState<number>(1);
  const [endLessonNum, setEndLessonNum] = useState<number>(5);
  const [randomCount, setRandomCount] = useState<number>(7);

  // Danh sách các câu hỏi đã được chọn để đưa vào đề thi
  const [selectedExamQuestions, setSelectedExamQuestions] = useState<Question[]>([]);

  // Accordion mở bài học trong chế độ tự chọn
  const [expandedLessonId, setExpandedLessonId] = useState<string | null>(null);

  // Khi đổi Khối: Cập nhật lớp, danh sách bài học và tiêu đề
  useEffect(() => {
    setCreateSelectedClasses([`Lớp ${createGrade}A1`]);

    // Mặc định chọn bài học đầu tiên có câu hỏi (hoặc bài số 1 thay vì bài 0)
    const firstLessonWithQ = gradeLessons.find(
      (l) => l.lesson_number > 0 && gradeQuestions.some((q) => q.lesson_id === l.id || q.category === l.title)
    );
    const startNum = firstLessonWithQ ? firstLessonWithQ.lesson_number : 1;
    setStartLessonNum(startNum);
    setEndLessonNum(Math.max(startNum, Math.min(startNum + 4, gradeLessons.length || 5)));

    const catObj = ASSESSMENT_CATEGORIES.find((c) => c.id === selectedCategory);
    const catName = catObj ? catObj.name : 'Kiểm Tra';
    setExamTitle(`${catName}: Môn Địa Lí Khối ${createGrade}`);
    setSelectedExamQuestions([]);
  }, [createGrade, gradeLessons, gradeQuestions]);

  // Khi đổi Hình thức kiểm tra: Cập nhật thời gian gợi ý và tiêu đề
  useEffect(() => {
    const catObj = ASSESSMENT_CATEGORIES.find((c) => c.id === selectedCategory);
    if (catObj) {
      setDurationMinutes(catObj.defaultDuration);
      setExamTitle(`${catObj.name}: Môn Địa Lí Khối ${createGrade}`);
    }
  }, [selectedCategory]);

  // Danh sách các lớp của khối
  const availableClassesForGrade = useMemo<string[]>(() => {
    try {
      const saved = localStorage.getItem('geo_classes_list');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const filtered = parsed.filter((c: any) => Number(c.grade) === Number(createGrade)).map((c: any) => c.name);
          if (filtered.length > 0) return filtered;
        }
      }
    } catch (e) {}
    return [
      `Lớp ${createGrade}A1`,
      `Lớp ${createGrade}A2`,
      `Lớp ${createGrade}A3`,
      `Lớp ${createGrade}A4`,
    ];
  }, [createGrade]);

  // Xử lý chọn/bỏ chọn lớp
  const toggleClassSelection = (cls: string) => {
    if (createSelectedClasses.includes(cls)) {
      if (createSelectedClasses.length > 1) {
        setCreateSelectedClasses(createSelectedClasses.filter((c) => c !== cls));
      } else {
        alert('Cô cần chọn ít nhất 1 lớp để giao bài nhé!');
      }
    } else {
      setCreateSelectedClasses([...createSelectedClasses, cls]);
    }
  };

  const handleSelectAllClasses = () => {
    if (createSelectedClasses.length === availableClassesForGrade.length) {
      setCreateSelectedClasses([availableClassesForGrade[0]]);
    } else {
      setCreateSelectedClasses([...availableClassesForGrade]);
    }
  };

  // --- THỰC HIỆN BỐC NGẪU NHIÊN CÂU HỎI THEO PHẠM VI BÀI HỌC (TỪ BÀI X ĐẾN BÀI Y) ---
  const rangePoolQuestions = useMemo(() => {
    const validLessons = gradeLessons.filter(
      (l) => l.lesson_number >= startLessonNum && l.lesson_number <= endLessonNum
    );
    const validLessonIds = validLessons.map((l) => l.id);
    const validLessonTitles = validLessons.map((l) => l.title);

    return gradeQuestions.filter((q) => {
      if (q.lesson_id && validLessonIds.includes(q.lesson_id)) return true;
      if (q.category && validLessonTitles.includes(q.category)) return true;
      if (!q.lesson_id && startLessonNum === 1) return true;
      return false;
    });
  }, [gradeLessons, gradeQuestions, startLessonNum, endLessonNum]);

  // Bốc ngẫu nhiên câu hỏi theo phạm vi bài học (giữ nguyên điểm số hoặc tùy chọn)
  const handleGenerateRandomQuestions = () => {
    if (rangePoolQuestions.length === 0) {
      alert(`Trong các bài từ Bài ${startLessonNum} đến Bài ${endLessonNum} hiện chưa có câu hỏi nào trong kho đề. Cô hãy mở rộng phạm vi bài hoặc chọn chế độ Tự chọn nhé!`);
      return;
    }

    const targetCount = Math.min(randomCount, rangePoolQuestions.length);
    const shuffled = [...rangePoolQuestions].sort(() => 0.5 - Math.random());
    const picked = shuffled.slice(0, targetCount);

    setSelectedExamQuestions(picked);

    const totalPts = picked.reduce((sum, q) => sum + (Number(q.points) || 1.0), 0);
    alert(`🎲 Đã bốc ngẫu nhiên thành công ${picked.length} câu hỏi!\n• Tổng quỹ điểm: ${totalPts.toFixed(2)} điểm (theo điểm cấu hình của từng câu hỏi).`);
  };

  // --- XỬ LÝ CHẾ ĐỘ TỰ CHỌN TỪNG CÂU TRONG KHO ĐỀ ---
  const toggleSelectManualQuestion = (q: Question) => {
    const exists = selectedExamQuestions.some((item) => item.id === q.id);
    if (exists) {
      setSelectedExamQuestions(selectedExamQuestions.filter((item) => item.id !== q.id));
    } else {
      setSelectedExamQuestions([...selectedExamQuestions, q]);
    }
  };

  const handleSelectAllInLessonManual = (les: LessonItem) => {
    const questionsInLesson = gradeQuestions.filter(
      (q) => q.lesson_id === les.id || q.category === les.title
    );
    const allIds = questionsInLesson.map((q) => q.id);
    const areAllSelected = allIds.every((id) =>
      selectedExamQuestions.some((q) => q.id === id)
    );

    if (areAllSelected) {
      setSelectedExamQuestions(
        selectedExamQuestions.filter((q) => !allIds.includes(q.id))
      );
    } else {
      const newItems = questionsInLesson.filter(
        (q) => !selectedExamQuestions.some((item) => item.id === q.id)
      );
      setSelectedExamQuestions([...selectedExamQuestions, ...newItems]);
    }
  };

  // Phân tích cơ cấu điểm Trắc nghiệm & Tự luận linh hoạt theo câu hỏi đã chọn
  const structureAnalysis = useMemo(() => {
    const essayQs = selectedExamQuestions.filter((q) => q.type === 'essay');
    const objQs = selectedExamQuestions.filter((q) => q.type !== 'essay');

    const rawObjScore = objQs.reduce((sum, q) => sum + (Number(q.points) || 1.0), 0);
    const rawEssayScore = essayQs.reduce((sum, q) => sum + (Number(q.points) || 1.0), 0);
    const rawTotal = rawObjScore + rawEssayScore;

    return {
      essayCount: essayQs.length,
      objCount: objQs.length,
      objScore: Number(rawObjScore.toFixed(2)),
      essayScore: Number(rawEssayScore.toFixed(2)),
      totalScore: Number(rawTotal.toFixed(2)),
      hasEssay: essayQs.length > 0,
    };
  }, [selectedExamQuestions]);

  // Chia đều tổng điểm các câu về tròn 10.0 điểm (nếu cô muốn)
  const handleNormalizeTo10 = () => {
    if (selectedExamQuestions.length === 0) {
      alert('Cô hãy chọn câu hỏi trước khi chuẩn hóa điểm nhé!');
      return;
    }
    const count = selectedExamQuestions.length;
    const pointPerQ = Number((10.0 / count).toFixed(2));
    const normalized = selectedExamQuestions.map((q, idx) => ({
      ...q,
      points: idx === count - 1 ? Number((10.0 - pointPerQ * (count - 1)).toFixed(2)) : pointPerQ,
    }));
    setSelectedExamQuestions(normalized);
    alert(`🎯 Đã chia đều ${count} câu hỏi thành đúng 10.0 Điểm (~${pointPerQ}đ/câu)!`);
  };

  // Khôi phục lại điểm gốc ban đầu của từng câu trong kho đề
  const handleResetToOriginalPoints = () => {
    if (selectedExamQuestions.length === 0) return;
    const restored = selectedExamQuestions.map((q) => {
      const orig = gradeQuestions.find((gq) => gq.id === q.id);
      return orig ? { ...q, points: orig.points } : q;
    });
    setSelectedExamQuestions(restored);
    alert('🔄 Đã khôi phục điểm gốc của từng câu hỏi theo kho đề!');
  };

  // --- THƯ VIỆN ĐỀ MẪU & LƯU ĐỀ MẪU DÙNG LẠI ---
  const handleApplyTemplate = (tpl: ExamTemplate) => {
    setCreateGrade(tpl.grade);
    setExamTitle(tpl.title);
    setDurationMinutes(tpl.duration_minutes);
    const matchedCat = ASSESSMENT_CATEGORIES.find((c) => c.name === tpl.category) || ASSESSMENT_CATEGORIES[1];
    setSelectedCategory(matchedCat.id);
    setSelectedExamQuestions(tpl.questions);
    setIsTemplateModalOpen(false);
    setIsCreateModalOpen(true);
    alert(`Đã nạp thành công "${tpl.title}"!\nTổng số: ${tpl.questions.length} câu. Cô chỉ cần chọn Lớp nhận đề và bấm Giao bài.`);
  };

  const handleSaveAsTemplate = () => {
    if (selectedExamQuestions.length === 0) {
      alert('Cô hãy chọn câu hỏi trước khi lưu làm đề mẫu nhé!');
      return;
    }
    const catObj = ASSESSMENT_CATEGORIES.find((c) => c.id === selectedCategory);
    const newTpl: ExamTemplate = {
      id: 'tpl_' + Date.now(),
      title: examTitle.trim() || `Đề Mẫu Địa Lí Khối ${createGrade}`,
      grade: createGrade,
      category: catObj ? catObj.name : 'Kiểm tra',
      duration_minutes: durationMinutes,
      description: `Đề mẫu chuẩn 70% TN + 30% TL gồm ${selectedExamQuestions.length} câu hỏi.`,
      structure: {
        objective_points: 7.0,
        essay_points: 3.0,
        total_points: 10.0,
      },
      questions: selectedExamQuestions,
      created_at: new Date().toISOString(),
    };

    const updated = [newTpl, ...examTemplates];
    setExamTemplates(updated);
    saveStoredExamTemplates(updated);
    alert(`⭐ Đã lưu thành công "${newTpl.title}" vào Thư viện Đề mẫu để dùng lại cho các năm học sau!`);
  };

  const handleDeleteTemplate = (templateId: string, templateTitle: string) => {
    if (window.confirm(`Cô có chắc chắn muốn xóa đề thi mẫu "${templateTitle}" khỏi Thư viện không?`)) {
      const updated = examTemplates.filter((tpl) => tpl.id !== templateId);
      setExamTemplates(updated);
      saveStoredExamTemplates(updated);
    }
  };

  const handleResetDefaultTemplates = () => {
    if (window.confirm('Cô có muốn khôi phục lại danh sách các Đề Thi Mẫu Chuẩn mặc định không?')) {
      setExamTemplates(DEFAULT_EXAM_TEMPLATES);
      saveStoredExamTemplates(DEFAULT_EXAM_TEMPLATES);
      alert('🔄 Đã khôi phục toàn bộ các đề thi mẫu chuẩn của Bộ GD&ĐT!');
    }
  };

  // --- HÀNH ĐỘNG GIAO BÀI CHO HỌC SINH ---
  const handleConfirmCreateAndAssign = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedExamQuestions.length === 0) {
      alert(
        '⚠️ Cô Hảo ơi, đề thi hiện đang có 0 câu hỏi!\n\n' +
        '• Cô vui lòng bấm nút "🎲 Bốc Câu Vào Đề" ở trên để hệ thống nạp câu hỏi vào đề,\n' +
        '• Hoặc chuyển sang tab "Tự Chọn Trong Kho Đề" để tự tích chọn các câu hỏi muốn giao nhé!\n\n' +
        '(Lưu ý: Nếu cô chọn phạm vi "Từ Bài 0", vui lòng đổi sang từ Bài 1 trở đi vì Bài 0 là bài mở đầu chưa có câu hỏi ạ).'
      );
      const el = document.getElementById('assignment-question-picker-section');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    if (createSelectedClasses.length === 0) {
      alert('Cô hãy chọn ít nhất 1 lớp nhận đề thi!');
      return;
    }

    // Cảnh báo khi giao đề cho lớp chưa có học sinh trong danh sách (Gợi ý 2)
    const emptyClasses = createSelectedClasses.filter(
      (cls) => students.filter((s) => s.class_name === cls).length === 0
    );

    if (emptyClasses.length === createSelectedClasses.length) {
      const proceedEmpty = window.confirm(
        `⚠️ CẢNH BÁO LỚP CHƯA CÓ HỌC SINH:\n\n` +
        `Tất cả các lớp cô chọn (${emptyClasses.join(', ')}) hiện ĐỀU CHƯA CÓ danh sách học sinh trong hệ thống (Sĩ số: 0 học sinh)!\n\n` +
        `• Cô có thể vào mục "Quản Lý Lớp Học" để nạp danh sách học sinh trước khi giao bài.\n` +
        `• Nếu cô vẫn muốn giao đề trước (sau đó nạp học sinh sau), bấm "OK" để tiếp tục.\n\n` +
        `Cô có muốn tiếp tục giao bài không ạ?`
      );
      if (!proceedEmpty) return;
    } else if (emptyClasses.length > 0) {
      const proceedPartial = window.confirm(
        `⚠️ LƯU Ý SĨ SỐ HỌC SINH:\n\n` +
        `Các lớp sau hiện chưa có học sinh trong danh sách: ${emptyClasses.join(', ')}.\n` +
        `Các lớp còn lại có đầy đủ học sinh.\n\n` +
        `Cô có muốn tiếp tục giao đề cho tất cả các lớp đã chọn không ạ?`
      );
      if (!proceedPartial) return;
    }

    // Xác nhận số lượng câu hỏi trước khi giao bài
    const confirmMsg =
      `Cô Hảo ơi, cô đang chuẩn bị giao bài kiểm tra:\n\n` +
      `📌 Tên đề: "${examTitle.trim() || `Kiểm Tra Địa Lí Khối ${createGrade}`}"\n` +
      `📚 Số lượng câu hỏi: ĐÚNG ${selectedExamQuestions.length} CÂU HỎI (${structureAnalysis.objCount} câu Trắc nghiệm + ${structureAnalysis.essayCount} câu Tự luận)\n` +
      `🎯 Tổng điểm: ${structureAnalysis.totalScore}đ • Thời gian: ${durationMinutes} phút\n` +
      `👥 Giao cho các lớp: ${createSelectedClasses.join(', ')}\n\n` +
      `Cô có xác nhận giao đề thi này cho học sinh không ạ?`;
    if (!window.confirm(confirmMsg)) {
      return;
    }

    const catObj = ASSESSMENT_CATEGORIES.find((c) => c.id === selectedCategory);
    const newAssignment: Assignment = {
      id: 'asg_' + Date.now(),
      exam_id: 'ex_' + Date.now(),
      title: examTitle.trim() || `Kiểm Tra Địa Lí Khối ${createGrade}`,
      target_type: 'class',
      target_ids: createSelectedClasses,
      start_time: new Date().toISOString(),
      deadline: deadlineDate,
      allow_late: allowLate,
      grade: createGrade,
      category: catObj ? catObj.name : 'Kiểm tra',
      duration_minutes: durationMinutes,
      questions: selectedExamQuestions,
      questions_count: selectedExamQuestions.length,
      total_points: structureAnalysis.totalScore,
      submissions_count: 0,
      total_students: (() => {
        const selectedClassStudentsCount = students.filter(
          (s) => Boolean(s.class_name && createSelectedClasses.includes(s.class_name))
        ).length;
        return selectedClassStudentsCount > 0
          ? selectedClassStudentsCount
          : createSelectedClasses.length * 35;
      })(),
      created_at: new Date().toISOString(),
    };

    // Đóng modal trước để giao diện cập nhật ngay
    setIsCreateModalOpen(false);

    // Lưu đồng bộ và chờ hoàn tất lưu trên Supabase Cloud
    await saveAssignments([newAssignment, ...assignments]);

    // Bắn pháo hoa ăn mừng
    triggerCelebration();

    alert(`🎉 Tạo đề và giao bài thành công cho các lớp: ${createSelectedClasses.join(', ')}!\nCấu trúc: ${structureAnalysis.objCount} câu Trắc nghiệm (${structureAnalysis.objScore}đ) + ${structureAnalysis.essayCount} câu Tự luận (${structureAnalysis.essayScore}đ).`);
  };

  // Lưu đề thi sau khi thêm/bớt hoặc chỉnh sửa câu hỏi (Gợi ý 3)
  const handleSaveEditedAssignment = (updated: Assignment) => {
    const updatedList = assignments.map((a) => (a.id === updated.id ? updated : a));
    saveAssignments(updatedList);
    if (previewAssignment?.id === updated.id) {
      setPreviewAssignment(updated);
      setPreviewQuestions(updated.questions || []);
    }
  };

  // Sao chép liên kết làm bài
  const handleCopyLink = (assignmentId: string) => {
    const targetAsg = assignments.find((a) => a.id === assignmentId);
    const primaryClass = targetAsg?.target_ids?.[0] || '';
    const classParam = primaryClass ? `?class=${encodeURIComponent(primaryClass)}&grade=${targetAsg?.grade || ''}` : '';
    const isLocalHost = typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    const networkIp = localStorage.getItem('geo_network_ip') || '192.168.120.8';
    const origin = isLocalHost ? `http://${networkIp}:5173` : window.location.origin;
    const testUrl = `${origin}/take-exam/${assignmentId}${classParam}`;
    navigator.clipboard.writeText(testUrl);
    setCopiedId(assignmentId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // 1. Tạm dừng nhận bài / Mở lại (Gợi ý 1)
  const handleTogglePause = (asg: Assignment) => {
    const newPaused = !asg.is_paused;
    const updated = assignments.map((a) =>
      a.id === asg.id ? { ...a, is_paused: newPaused } : a
    );
    saveAssignments(updated);
    if (warningModalAssignment?.id === asg.id) {
      setWarningModalAssignment(null);
    }
    alert(
      newPaused
        ? `⏸️ Đã tạm dừng nhận bài cho "${asg.title}".\nHọc sinh sẽ không thể vào làm bài mới, nhưng toàn bộ bài nộp và điểm số của các em đã thi trước đó vẫn được lưu an toàn 100%.`
        : `▶️ Đã mở lại bài kiểm tra "${asg.title}".\nHọc sinh có thể tiếp tục làm bài bình thường.`
    );
  };

  // 2. Chuyển bài kiểm tra vào Thùng rác (Gợi ý 2)
  const handleMoveToTrash = async (asg: Assignment) => {
    const deletedItem: Assignment = {
      ...asg,
      deleted_at: new Date().toISOString(),
    };

    // Cập nhật state cục bộ ngay tức thì
    setAssignments((prev) => prev.filter((a) => a.id !== asg.id));
    setTrashAssignments((prev) => [deletedItem, ...prev.filter((t) => t.id !== asg.id)]);
    setWarningModalAssignment(null);

    // Đồng bộ xóa trên Cloud và lưu vào thùng rác
    await deleteAssignmentFromCloud(asg.id, deletedItem);

    // Xóa thông báo gửi đến học sinh
    try {
      const notifs = JSON.parse(localStorage.getItem('geo_student_notifications') || '[]');
      const updatedNotifs = notifs.filter(
        (n: any) => n.assignment_id !== asg.id && n.assignment_title !== asg.title
      );
      localStorage.setItem('geo_student_notifications', JSON.stringify(updatedNotifs));
      window.dispatchEvent(new Event('geo_notifications_updated'));
    } catch (e) {
      console.warn(e);
    }

    alert(
      `🗑️ Đã chuyển bài kiểm tra "${asg.title}" vào Thùng rác.\nPhía học sinh sẽ không còn thấy bài này. Cô có thể bấm nút "Thùng Rác" ở phía trên để xem hoặc khôi phục lại bất kỳ lúc nào!`
    );
  };

  // 3. Xóa vĩnh viễn khỏi hệ thống
  const handleForceDelete = async (asg: Assignment) => {
    // Cập nhật state cục bộ ngay tức thì
    setAssignments((prev) => prev.filter((a) => a.id !== asg.id));
    setTrashAssignments((prev) => prev.filter((t) => t.id !== asg.id));
    setWarningModalAssignment(null);

    // Xóa triệt để cả LocalStorage và Supabase Cloud
    await deleteAssignmentFromCloud(asg.id);

    try {
      const subs = JSON.parse(localStorage.getItem('geo_student_submissions') || '[]');
      const updatedSubs = subs.filter((s: any) => s.assignment_id !== asg.id);
      localStorage.setItem('geo_student_submissions', JSON.stringify(updatedSubs));
    } catch (e) {
      console.warn(e);
    }

    try {
      const notifs = JSON.parse(localStorage.getItem('geo_student_notifications') || '[]');
      const updatedNotifs = notifs.filter(
        (n: any) => n.assignment_id !== asg.id && n.assignment_title !== asg.title
      );
      localStorage.setItem('geo_student_notifications', JSON.stringify(updatedNotifs));
      window.dispatchEvent(new Event('geo_notifications_updated'));
    } catch (e) {
      console.warn(e);
    }

    alert(`✅ Đã xóa hoàn toàn bài kiểm tra "${asg.title}" và giải phóng dữ liệu liên quan.`);
  };

  // 4. Kiểm tra trước khi xóa: Nếu đã có học sinh nộp bài -> Hiện Modal Cảnh báo (Gợi ý 3)
  const handleRequestDelete = (asg: Assignment) => {
    let subCount = 0;
    try {
      const subs = JSON.parse(localStorage.getItem('geo_student_submissions') || '[]');
      subCount = subs.filter((s: any) => s.assignment_id === asg.id).length;
    } catch (e) {
      console.warn(e);
    }
    const finalSubCount = Math.max(subCount, asg.submissions_count || 0);

    if (finalSubCount > 0) {
      // Đã có học sinh nộp bài -> Bật modal cảnh báo an toàn 3 lựa chọn
      setWarningModalSubmissionsCount(finalSubCount);
      setWarningModalAssignment(asg);
    } else {
      // Chưa có ai nộp -> Xác nhận chuyển vào Thùng rác
      if (
        confirm(
          `Cô có chắc chắn muốn xóa bài kiểm tra "${asg.title}" không?\n\nĐề thi sẽ được chuyển vào Thùng rác để cô có thể khôi phục lại bất kỳ lúc nào nếu cần.`
        )
      ) {
        handleMoveToTrash(asg);
      }
    }
  };

  // Khôi phục đề từ Thùng rác (Gợi ý 2)
  const handleRestoreFromTrash = async (id: string) => {
    const target = trashAssignments.find((t) => t.id === id);
    if (!target) return;

    setTrashAssignments((prev) => prev.filter((t) => t.id !== id));
    const { deleted_at, ...cleanAsg } = target;
    setAssignments((prev) => [cleanAsg as Assignment, ...prev.filter((a) => a.id !== id)]);

    await restoreAssignmentFromCloud(target);

    alert(
      `🎉 Đã khôi phục bài kiểm tra "${cleanAsg.title}" thành công!\nHọc sinh đã có thể tiếp tục nhìn thấy và làm bài.`
    );
  };

  // Xóa vĩnh viễn 1 bài trong Thùng rác
  const handlePermanentDeleteFromTrash = async (id: string) => {
    const target = trashAssignments.find((t) => t.id === id);
    if (
      confirm(
        `Cô có chắc chắn muốn xóa vĩnh viễn bài kiểm tra "${target?.title || ''}" không?\nHành động này không thể hoàn tác.`
      )
    ) {
      setTrashAssignments((prev) => prev.filter((t) => t.id !== id));
      await deleteAssignmentFromCloud(id);
    }
  };

  // Dọn sạch toàn bộ Thùng rác
  const handleEmptyTrash = async () => {
    if (confirm('Cô có chắc chắn muốn dọn sạch toàn bộ Thùng rác không?')) {
      const idsToDelete = trashAssignments.map((t) => t.id);
      setTrashAssignments([]);
      await saveTrashToCloud([]);
      for (const id of idsToDelete) {
        await deleteAssignmentFromCloud(id);
      }
    }
  };

  // Mở cửa sổ xem lại đề thi đã giao kèm đáp án và lời giải
  const handleOpenPreview = (asg: Assignment) => {
    let qList: Question[] = [];
    if (asg.questions && asg.questions.length > 0) {
      qList = asg.questions;
    } else if (asg.exam_id) {
      const foundTpl = examTemplates.find((t) => t.id === asg.exam_id);
      if (foundTpl && foundTpl.questions && foundTpl.questions.length > 0) {
        qList = foundTpl.questions;
      }
    }
    // Nếu đề chưa có mảng câu hỏi: Thử tìm đúng các câu hỏi thuộc bài học theo tiêu đề đề thi
    if (qList.length === 0 && asg.title) {
      const matched = allQuestions.filter((q) => {
        if (asg.grade && q.grade !== asg.grade) return false;
        return (q.category && asg.title.includes(q.category)) || (q.lesson_id && asg.title.includes(q.lesson_id));
      });
      if (matched.length > 0) {
        qList = matched.slice(0, asg.questions_count || matched.length);
      }
    }
    setPreviewQuestions(qList);
    setPreviewAssignment(asg);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16">
      {/* 1. Header Trang Tạo Đề & Giao Bài */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <CalendarCheck className="w-6 h-6 text-ocean-600" />
            <span>Tạo Đề & Giao Bài Kiểm Tra</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Tự do cấu hình điểm số theo câu hỏi • Đề 100% trắc nghiệm hoặc kết hợp tự luận linh hoạt
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Huy hiệu tình trạng kết nối Đám mây (Gợi ý 3) */}
          <div
            className="flex items-center gap-2 px-3.5 py-2.5 bg-emerald-50 border border-emerald-200/90 rounded-2xl shadow-2xs"
            title="Hệ thống đề thi & học sinh đang kết nối trực tiếp với Supabase Cloud"
          >
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <div className="flex items-center gap-1.5 text-emerald-950 font-black text-xs">
              <Cloud className="w-3.5 h-3.5 text-emerald-600" />
              <span>Đã kết nối Đám mây</span>
            </div>
          </div>

          {/* Nút Làm Mới Dữ Liệu 1-Click (Gợi ý 2) */}
          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-ocean-50 hover:bg-ocean-100 border border-ocean-200 text-ocean-800 text-xs sm:text-sm font-bold transition cursor-pointer active:scale-95 disabled:opacity-60 shadow-xs"
            title="Bấm để đồng bộ và cập nhật ngay bài nộp mới nhất từ máy chủ đám mây"
          >
            <RotateCw className={`w-4 h-4 text-ocean-600 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Đang đồng bộ...' : 'Làm Mới Dữ Liệu'}</span>
            <span className="text-[10px] text-ocean-600 font-normal hidden sm:inline">({lastSyncedTime})</span>
          </button>

          {/* Nút mở Thư viện đề mẫu chuẩn */}
          <button
            type="button"
            onClick={() => setIsTemplateModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 active:scale-95 text-xs sm:text-sm font-bold rounded-2xl shadow-xs transition cursor-pointer"
          >
            <FolderOpen className="w-4 h-4 text-amber-600" />
            Thư Viện Đề Mẫu ({examTemplates.length})
          </button>

          {/* Nút mở Thùng rác bài kiểm tra (Gợi ý 2) */}
          <button
            type="button"
            onClick={() => setIsTrashModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 active:scale-95 text-xs sm:text-sm font-bold rounded-2xl shadow-xs transition cursor-pointer"
            title="Xem và khôi phục các đề thi đã xóa"
          >
            <Trash2 className="w-4 h-4 text-slate-500" />
            <span>Thùng Rác</span>
            {trashAssignments.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[11px] font-black">
                {trashAssignments.length}
              </span>
            )}
          </button>

          {/* Nút Chuông Báo Nộp Bài (Gợi ý 3 - Cô Hảo yêu cầu) */}
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-2xl p-1 shadow-2xs">
            <button
              type="button"
              onClick={() => {
                const next = toggleSoundEnabled();
                setSoundActive(next);
                if (next) playSubmissionNotificationSound();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                soundActive
                  ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
              title="Bật/Tắt chuông báo khi học sinh nộp bài"
            >
              {soundActive ? (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                  <span>Chuông Báo: BẬT</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                  <span>Chuông Báo: TẮT</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => playSubmissionNotificationSound()}
              className="px-2.5 py-1.5 text-[11px] font-bold text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition cursor-pointer"
              title="Bấm để nghe thử tiếng chuông báo khi học sinh nộp bài"
            >
              🔊 Thử chuông
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setSelectedExamQuestions([]);
              setIsCreateModalOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-ocean-600 to-teal-600 hover:from-ocean-700 hover:to-teal-700 active:scale-95 text-white text-xs sm:text-sm font-black rounded-2xl shadow-md transition"
          >
            <Plus className="w-4 h-4" /> Tạo Đề & Giao Bài Mới
          </button>
        </div>
      </div>

      {/* 2. THANH TÌM KIẾM & BỘ LỌC BÀI KIỂM TRA (GỢI Ý 3) */}
      {assignments.length > 0 && (
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs space-y-3.5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Ô tìm kiếm */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchAssignmentTerm}
                onChange={(e) => setSearchAssignmentTerm(e.target.value)}
                placeholder="Tìm bài kiểm tra theo tên đề, loại kiểm tra hoặc lớp..."
                className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-ocean-500 focus:outline-hidden transition"
              />
              {searchAssignmentTerm && (
                <button
                  type="button"
                  onClick={() => setSearchAssignmentTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Dropdown Lọc theo Lớp & Trạng thái */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Lọc theo Lớp */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-1.5 text-xs font-medium text-slate-700">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[11px] text-slate-500">Lớp:</span>
                <select
                  value={filterClass}
                  onChange={(e) => setFilterClass(e.target.value)}
                  className="bg-transparent font-bold text-slate-800 text-xs focus:outline-hidden cursor-pointer"
                >
                  <option value="all">Tất cả lớp ({availableClassesForFilter.length})</option>
                  {availableClassesForFilter.map((cls) => (
                    <option key={cls} value={cls}>
                      {cls}
                    </option>
                  ))}
                </select>
              </div>

              {/* Lọc theo Trạng thái */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-1.5 text-xs font-medium text-slate-700">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[11px] text-slate-500">Trạng thái:</span>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="bg-transparent font-bold text-slate-800 text-xs focus:outline-hidden cursor-pointer"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="active">▶️ Đang nhận bài</option>
                  <option value="paused">⏸️ Đang tạm dừng</option>
                  <option value="has_submissions">📝 Đã có bài nộp</option>
                </select>
              </div>

              {/* Nút Đặt lại bộ lọc nếu có điều kiện lọc đang bật */}
              {(filterGrade !== 'all' || filterClass !== 'all' || filterStatus !== 'all' || searchAssignmentTerm) && (
                <button
                  type="button"
                  onClick={() => {
                    setFilterGrade('all');
                    setFilterClass('all');
                    setFilterStatus('all');
                    setSearchAssignmentTerm('');
                  }}
                  className="text-xs font-bold text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-2.5 py-1.5 rounded-xl transition cursor-pointer"
                >
                  ✕ Đặt lại
                </button>
              )}
            </div>
          </div>

          {/* Lọc nhanh theo Khối (Tất cả, 6, 7, 8, 9) */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 flex-wrap">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Khối:</span>
              <button
                type="button"
                onClick={() => setFilterGrade('all')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                  filterGrade === 'all'
                    ? 'bg-ocean-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Tất cả khối
              </button>
              {[6, 7, 8, 9].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setFilterGrade(g)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                    filterGrade === g
                      ? 'bg-ocean-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Khối {g}
                </button>
              ))}
            </div>

            <div className="text-[11px] font-bold text-slate-500">
              Hiển thị <span className="text-ocean-700 font-black">{filteredAssignments.length}</span> / {assignments.length} đề thi
            </div>
          </div>
        </div>
      )}

      {/* 3. Danh sách các bài kiểm tra đã giao */}
      <div className="space-y-4">
        {assignments.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
            <CalendarCheck className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <h3 className="font-bold text-slate-700 text-sm">
              Hiện chưa có bài kiểm tra nào được giao
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Cô hãy bấm nút <strong className="text-ocean-700">"Tạo Đề & Giao Bài Mới"</strong> hoặc chọn đề từ <strong className="text-amber-700">"Thư Viện Đề Mẫu"</strong> ở trên để giao cho học sinh nhé!
            </p>
          </div>
        ) : filteredAssignments.length === 0 ? (
          <div className="py-12 text-center bg-white rounded-3xl border border-slate-200 p-6 space-y-2">
            <Filter className="w-10 h-10 mx-auto text-slate-300" />
            <h4 className="font-bold text-slate-700 text-sm">Không tìm thấy bài kiểm tra nào phù hợp</h4>
            <p className="text-xs text-slate-500">
              Không có bài thi nào khớp với bộ lọc hoặc từ khóa "{searchAssignmentTerm}".
            </p>
            <button
              type="button"
              onClick={() => {
                setFilterGrade('all');
                setFilterClass('all');
                setFilterStatus('all');
                setSearchAssignmentTerm('');
              }}
              className="mt-2 px-4 py-1.5 bg-ocean-50 text-ocean-700 hover:bg-ocean-100 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Xóa bộ lọc để xem toàn bộ đề thi
            </button>
          </div>
        ) : (
          filteredAssignments.map((asg) => {
            const actualSubmissionsCount = studentSubmissions.filter(
              (s: any) => s.assignment_id === asg.id
            ).length || asg.submissions_count || 0;

            // Tính sĩ số học sinh thực tế của các lớp nhận bài
            const targetClasses = asg.target_ids || [];
            const actualClassStudentsCount = students.filter(
              (s) => Boolean(s.class_name && targetClasses.includes(s.class_name))
            ).length;
            const realTotalStudents = actualClassStudentsCount > 0 ? actualClassStudentsCount : (asg.total_students || 35);

            const submissionPercent = Math.min(
              100,
              Math.round((actualSubmissionsCount / (realTotalStudents || 1)) * 100)
            );

            return (
              <div
                key={asg.id}
                className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 hover:border-ocean-300 shadow-xs transition space-y-4 group"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Badge Loại kiểm tra */}
                      <span className="text-[11px] font-black bg-ocean-50 text-ocean-700 border border-ocean-200 px-2.5 py-0.5 rounded-full">
                        {asg.category || 'Kiểm tra'}
                      </span>

                      {/* Badge Tạm dừng nhận bài (Gợi ý 1) */}
                      {asg.is_paused && (
                        <span className="text-[11px] font-black bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                          <PauseCircle className="w-3.5 h-3.5 text-amber-700" />
                          Tạm Dừng Nhận Bài
                        </span>
                      )}

                      {/* Khối & Lớp */}
                      <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-md">
                        {asg.target_ids.join(', ')}
                      </span>

                      {/* Thời gian làm bài */}
                      <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {asg.duration_minutes || 15} Phút
                      </span>

                      {/* Số câu hỏi & Cơ cấu điểm */}
                      {asg.questions_count && (
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                          {asg.questions_count} Câu hỏi • Tổng {asg.total_points || 10}đ
                        </span>
                      )}

                      {/* Cho phép nộp trễ */}
                      {asg.allow_late ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.2 rounded-md">
                          ✓ Cho phép nộp trễ
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.2 rounded-md">
                          ✕ Khóa bài sau hạn
                        </span>
                      )}
                    </div>

                    <h3 className="font-black text-slate-900 text-base sm:text-lg group-hover:text-ocean-700 transition">
                      {asg.title}
                    </h3>

                    <div className="text-xs text-slate-500 flex flex-wrap items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        Hạn chót:{' '}
                        <strong className="text-slate-700">
                          {asg.deadline
                            ? new Date(asg.deadline).toLocaleString('vi-VN')
                            : 'Không giới hạn'}
                        </strong>
                      </span>

                      {/* Nút bấm xem danh sách đã nộp / chưa nộp bài (Gợi ý 1) */}
                      <button
                        type="button"
                        onClick={() => setStatusModalAssignment(asg)}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-50/80 hover:bg-blue-100 text-blue-900 border border-blue-200 text-xs font-medium transition cursor-pointer group/sub"
                        title="Bấm để xem danh sách chi tiết học sinh đã nộp / chưa nộp"
                      >
                        <Users className="w-3.5 h-3.5 text-blue-600 group-hover/sub:scale-110 transition" />
                        <span>
                          Đã nộp:{' '}
                          <strong className="text-blue-700 font-bold">
                            {actualSubmissionsCount}/{realTotalStudents}
                          </strong>{' '}
                          học sinh ({submissionPercent}%)
                        </span>
                        <span className="text-[10px] font-bold text-blue-600 underline ml-0.5">Chi tiết →</span>
                      </button>
                    </div>
                  </div>

                  {/* Các nút hành động */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {/* Nút Xem danh sách học sinh đã nộp / chưa nộp bài (Gợi ý 1) */}
                    <button
                      type="button"
                      onClick={() => setStatusModalAssignment(asg)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-bold transition active:scale-95 border border-blue-200 cursor-pointer shadow-2xs"
                      title="Xem danh sách học sinh đã nộp / chưa nộp bài và sao chép gửi Zalo"
                    >
                      <Users className="w-3.5 h-3.5 text-blue-600" />
                      <span>DS Nộp Bài</span>
                    </button>

                    {/* Nút Xem lại đề thi đã giao (Cô Hảo yêu cầu) */}
                    <button
                      type="button"
                      onClick={() => handleOpenPreview(asg)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold transition active:scale-95 border border-teal-200 cursor-pointer shadow-2xs"
                      title="Xem lại nội dung đề thi và đáp án chi tiết"
                    >
                      <Eye className="w-3.5 h-3.5 text-teal-600" />
                      <span>Xem lại đề</span>
                    </button>

                    {/* Nút Sửa đề / Thêm câu hỏi (Gợi ý 3) */}
                    <button
                      type="button"
                      onClick={() => setEditingQuestionsAssignment(asg)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-xs font-bold transition active:scale-95 border border-indigo-200 cursor-pointer shadow-2xs"
                      title="Thêm hoặc bớt câu hỏi trong đề thi này mà không cần tạo lại"
                    >
                      <FileEdit className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Sửa đề / Thêm câu</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setQrModalAssignment(asg)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold transition active:scale-95 border border-purple-200 cursor-pointer"
                      title="Xem và tải mã QR để học sinh quét làm bài"
                    >
                      <QrCode className="w-3.5 h-3.5 text-purple-600" />
                      <span>Mã QR Làm Bài</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleCopyLink(asg.id)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition active:scale-95 border border-slate-200 cursor-pointer"
                    >
                      {copiedId === asg.id ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Đã chép link</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-500" />
                          <span>Sao chép Link</span>
                        </>
                      )}
                    </button>

                    {/* Sửa nhãn: Chấm bài & Nhận xét */}
                    <Link
                      to={`/grading?assignmentId=${asg.id}`}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-ocean-600 hover:bg-ocean-700 text-white text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer"
                    >
                      Chấm bài & Nhận xét
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>

                    {/* Nút Tạm dừng / Mở lại nhận bài (Gợi ý 1) */}
                    <button
                      type="button"
                      onClick={() => handleTogglePause(asg)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition active:scale-95 border cursor-pointer shadow-2xs ${
                        asg.is_paused
                          ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                          : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300'
                      }`}
                      title={
                        asg.is_paused
                          ? 'Mở lại cho học sinh làm bài'
                          : 'Tạm dừng nhận bài mới (bảo toàn 100% điểm học sinh đã nộp)'
                      }
                    >
                      {asg.is_paused ? (
                        <>
                          <PlayCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Mở lại</span>
                        </>
                      ) : (
                        <>
                          <PauseCircle className="w-3.5 h-3.5 text-amber-600" />
                          <span>Tạm dừng</span>
                        </>
                      )}
                    </button>

                    {/* Nút Xóa (Gợi ý 2 + 3: Thùng rác & Cảnh báo an toàn) */}
                    <button
                      type="button"
                      onClick={() => handleRequestDelete(asg)}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer"
                      title="Xóa hoặc chuyển vào Thùng rác"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Thanh tiến độ nộp bài của lớp */}
                <div className="space-y-1">
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-ocean-600 transition-all duration-500"
                      style={{ width: `${submissionPercent}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 3. MODAL THƯ VIỆN ĐỀ THI MẪU CHUẨN (GỢI Ý 2) */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl border border-slate-100 space-y-5 my-auto max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <FolderOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">
                    Thư Viện Đề Thi Mẫu Chuẩn (Dùng lại cho các năm sau)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Chọn 1 đề mẫu để giao bài ngay lập tức chỉ với 1 click
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTemplateModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
              {examTemplates.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs border-2 border-dashed border-slate-200 rounded-3xl space-y-3">
                  <FolderOpen className="w-10 h-10 mx-auto text-slate-300" />
                  <div>
                    <p className="font-bold text-slate-700 text-sm">
                      Thư viện đề mẫu hiện đang trống
                    </p>
                    <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                      Cô có thể bấm nút <strong className="text-ocean-700">"Khôi phục đề mẫu mặc định"</strong> bên dưới để lấy lại các đề chuẩn, hoặc lưu các đề hay của cô để dùng lại nhé!
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetDefaultTemplates}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-ocean-50 hover:bg-ocean-100 text-ocean-700 border border-ocean-200 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Khôi phục đề mẫu mặc định
                  </button>
                </div>
              ) : (
                examTemplates.map((tpl) => (
                  <div
                    key={tpl.id}
                    className="p-4 rounded-2xl border border-slate-200 hover:border-amber-400 bg-white hover:bg-amber-50/20 transition space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[11px] font-black px-2 py-0.5 rounded-md bg-ocean-100 text-ocean-800">
                            Khối {tpl.grade}
                          </span>
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                            {tpl.category}
                          </span>
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
                            ⏱️ {tpl.duration_minutes} phút
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm mt-1">
                          {tpl.title}
                        </h4>
                      </div>

                      {/* Nhóm nút: Giao Đề Mẫu Này + Nút Xóa Đề Mẫu */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleApplyTemplate(tpl)}
                          className="px-3.5 py-1.5 bg-gradient-to-r from-ocean-600 to-teal-600 hover:from-ocean-700 hover:to-teal-700 text-white text-xs font-black rounded-xl shadow-xs transition active:scale-95 flex items-center gap-1 cursor-pointer"
                        >
                          <Zap className="w-3.5 h-3.5 fill-current" />
                          Giao Đề Mẫu Này
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteTemplate(tpl.id, tpl.title)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition border border-slate-200 hover:border-red-200 cursor-pointer"
                          title="Xóa đề mẫu này khỏi thư viện"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500">{tpl.description}</p>

                    <div className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center justify-between">
                      <span>✓ Cấu trúc chuẩn: 70% Trắc nghiệm (7.0đ) + 30% Tự luận (3.0đ)</span>
                      <span className="font-bold">{tpl.questions.length} câu hỏi</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer Modal: Nút Khôi phục đề mẫu gốc */}
            {examTemplates.length > 0 && (
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                <span className="text-slate-400 text-[11px]">
                  Tổng số: <strong>{examTemplates.length}</strong> đề mẫu trong thư viện
                </span>
                <button
                  type="button"
                  onClick={handleResetDefaultTemplates}
                  className="flex items-center gap-1.5 text-slate-500 hover:text-ocean-700 text-xs font-bold transition hover:underline cursor-pointer"
                  title="Khôi phục lại các đề mẫu mặc định theo chuẩn của Bộ GD&ĐT"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Khôi phục đề mặc định
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. MODAL QUY TRÌNH TẠO ĐỀ & GIAO BÀI (70% TRẮC NGHIỆM + 30% TỰ LUẬN) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-5 sm:p-7 shadow-2xl border border-slate-100 space-y-6 my-auto max-h-[92vh] overflow-y-auto">
            {/* Header Modal */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-ocean-500 to-teal-500 text-white flex items-center justify-center font-black shadow-md">
                  <Zap className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <h2 className="font-black text-slate-900 text-lg">
                    Tạo Đề Kiểm Tra & Giao Bài
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Cố định cấu trúc: <strong>70% Trắc nghiệm (7.0đ)</strong> + <strong>30% Tự luận (3.0đ)</strong> chuẩn Bộ GD&ĐT
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmCreateAndAssign} className="space-y-6">
              {/* PHẦN 1: CHỌN KHỐI VÀ LỚP HỌC */}
              <div className="bg-slate-50/80 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-3.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-ocean-600 text-white flex items-center justify-center text-[10px]">1</span>
                    Chọn Khối & Lớp Nhận Đề
                  </label>
                  <button
                    type="button"
                    onClick={handleSelectAllClasses}
                    className="text-[11px] font-bold text-ocean-600 hover:text-ocean-800"
                  >
                    {createSelectedClasses.length === availableClassesForGrade.length
                      ? 'Chỉ chọn 1 lớp'
                      : 'Chọn cả 4 lớp của khối'}
                  </button>
                </div>

                {/* Chọn Khối (6, 7, 8, 9) */}
                <div className="grid grid-cols-4 gap-2">
                  {[6, 7, 8, 9].map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setCreateGrade(g)}
                      className={`py-2.5 rounded-xl text-xs sm:text-sm font-black transition active:scale-95 ${
                        createGrade === g
                          ? 'bg-ocean-600 text-white shadow-md'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Khối {g}
                    </button>
                  ))}
                </div>

                {/* Chọn các lớp trong khối */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  {availableClassesForGrade.map((cls) => {
                    const isChecked = createSelectedClasses.includes(cls);
                    const countInClass = students.filter((s) => s.class_name === cls).length;
                    return (
                      <button
                        key={cls}
                        type="button"
                        onClick={() => toggleClassSelection(cls)}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-between ${
                          isChecked
                            ? countInClass === 0
                              ? 'bg-amber-50/80 border-amber-400 text-amber-950 shadow-xs'
                              : 'bg-ocean-50 border-ocean-400 text-ocean-950 shadow-xs'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex flex-col text-left">
                          <span className="flex items-center gap-1">
                            {cls}
                            {countInClass === 0 && (
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" title="Lớp chưa có học sinh" />
                            )}
                          </span>
                          <span className={`text-[10px] font-normal ${countInClass === 0 ? 'text-amber-700 font-semibold' : 'text-slate-500'}`}>
                            {countInClass > 0 ? `${countInClass} học sinh` : 'Chưa có DS (0 HS)'}
                          </span>
                        </div>
                        {isChecked ? (
                          <CheckCircle2 className={`w-4 h-4 shrink-0 ${countInClass === 0 ? 'text-amber-600 fill-amber-100' : 'text-ocean-600 fill-ocean-100'}`} />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Cảnh báo lớp chưa có học sinh (Gợi ý 2) */}
                {(() => {
                  const emptyClasses = createSelectedClasses.filter(
                    (cls) => students.filter((s) => s.class_name === cls).length === 0
                  );
                  if (emptyClasses.length === 0) return null;
                  return (
                    <div className="p-3 bg-amber-50/90 border border-amber-300 rounded-xl text-xs text-amber-900 flex items-start gap-2 shadow-2xs">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div className="space-y-0.5 flex-1 text-left">
                        <p className="font-bold text-amber-950">
                          ⚠️ Chú ý: Lớp {emptyClasses.join(', ')} hiện chưa có học sinh trong danh sách (0 học sinh)!
                        </p>
                        <p className="text-[11px] text-amber-800 leading-relaxed">
                          Cô vẫn có thể giao đề bình thường, nhưng học sinh sẽ chưa có tên trong danh sách nộp bài. Cô có thể vào mục{' '}
                          <Link
                            to="/classes"
                            target="_blank"
                            className="font-bold text-ocean-700 underline hover:text-ocean-900"
                          >
                            Quản Lý Lớp Học
                          </Link>{' '}
                          để thêm danh sách học sinh nhé.
                        </p>
                      </div>
                    </div>
                  );
                })()}

                <div className="text-[11px] font-medium text-slate-600 flex items-center justify-between pt-1 border-t border-slate-200/60">
                  <span>
                    Đã chọn: <strong className="text-ocean-700 font-bold">{createSelectedClasses.length} lớp</strong> ({createSelectedClasses.join(', ')})
                  </span>
                  <span>
                    Tổng sĩ số thực tế:{' '}
                    <strong className="text-emerald-700 font-bold">
                      {createSelectedClasses.reduce(
                        (sum, cls) => sum + students.filter((s) => s.class_name === cls).length,
                        0
                      )} học sinh
                    </strong>
                  </span>
                </div>
              </div>

              {/* PHẦN 2: CHỌN HÌNH THỨC ĐÁNH GIÁ (7 LOẠI THEO CHUẨN BỘ GD&ĐT) */}
              <div className="bg-slate-50/80 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-3">
                <label className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-ocean-600 text-white flex items-center justify-center text-[10px]">2</span>
                  Hình Thức Đánh Giá / Loại Bài Kiểm Tra
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {ASSESSMENT_CATEGORIES.map((cat) => {
                    const isSelected = selectedCategory === cat.id;
                    return (
                      <div
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`p-3 rounded-2xl border transition cursor-pointer flex flex-col justify-between gap-1 ${
                          isSelected
                            ? 'bg-ocean-50/70 border-ocean-500 shadow-xs ring-1 ring-ocean-400'
                            : 'bg-white border-slate-200 hover:bg-slate-100/70 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-slate-900">
                            {cat.name}
                          </span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600">
                            {cat.defaultDuration}p
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-tight">
                          {cat.description}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Tiêu đề & Thời gian làm bài */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Tên đề bài hiển thị cho học sinh:
                    </label>
                    <input
                      type="text"
                      required
                      value={examTitle}
                      onChange={(e) => setExamTitle(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-ocean-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Thời gian làm bài (Phút):
                    </label>
                    <input
                      type="number"
                      min={5}
                      max={180}
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-ocean-500"
                    />
                  </div>
                </div>
              </div>

              {/* PHẦN 3: LỰA CHỌN CÂU HỎI VÀO ĐỀ (NGẪU NHIÊN HOẶC TỰ CHỌN THEO BÀI) */}
              <div id="assignment-question-picker-section" className="bg-slate-50/80 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-ocean-600 text-white flex items-center justify-center text-[10px]">3</span>
                    Phương Thức Chọn Câu Hỏi Vào Đề Thi
                  </label>

                  {/* 2 Tab chuyển đổi giữa Ngẫu nhiên và Tự chọn */}
                  <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setQuestionSelectMode('random')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition ${
                        questionSelectMode === 'random'
                          ? 'bg-ocean-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Shuffle className="w-3.5 h-3.5" />
                      Bốc Ngẫu Nhiên
                    </button>

                    <button
                      type="button"
                      onClick={() => setQuestionSelectMode('manual')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition ${
                        questionSelectMode === 'manual'
                          ? 'bg-ocean-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <ListFilter className="w-3.5 h-3.5" />
                      Tự Chọn Trong Kho Đề
                    </button>
                  </div>
                </div>

                {/* --- CHẾ ĐỘ 1: BỐC NGẪU NHIÊN THEO PHẠM VI BÀI HỌC --- */}
                {questionSelectMode === 'random' && (
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3.5 animate-in fade-in duration-200">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Từ Bài số:
                        </label>
                        <select
                          value={startLessonNum}
                          onChange={(e) => setStartLessonNum(Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-ocean-500 bg-white"
                        >
                          {gradeLessons.map((l) => {
                            const count = gradeQuestions.filter(
                              (q) => q.lesson_id === l.id || q.category === l.title
                            ).length;
                            return (
                              <option key={l.id} value={l.lesson_number}>
                                Bài {l.lesson_number}: {l.title.replace(/^Bài \d+:\s*/, '')} ({count} câu)
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Đến Bài số:
                        </label>
                        <select
                          value={endLessonNum}
                          onChange={(e) => setEndLessonNum(Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-ocean-500 bg-white"
                        >
                          {gradeLessons.map((l) => {
                            const count = gradeQuestions.filter(
                              (q) => q.lesson_id === l.id || q.category === l.title
                            ).length;
                            return (
                              <option key={l.id} value={l.lesson_number}>
                                Bài {l.lesson_number}: {l.title.replace(/^Bài \d+:\s*/, '')} ({count} câu)
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Số lượng câu cần bốc:
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={1}
                            max={50}
                            value={randomCount}
                            onChange={(e) => setRandomCount(Number(e.target.value))}
                            className="w-20 px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-ocean-500"
                          />
                          <button
                            type="button"
                            onClick={handleGenerateRandomQuestions}
                            className="flex-1 px-4 py-2 bg-gradient-to-r from-ocean-600 to-teal-600 hover:from-ocean-700 hover:to-teal-700 text-white text-xs font-black rounded-xl shadow-xs transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Shuffle className="w-3.5 h-3.5" /> Bốc Câu Vào Đề
                          </button>
                        </div>
                      </div>
                    </div>

                    {rangePoolQuestions.length === 0 ? (
                      <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>
                          Kho đề chưa có câu hỏi nào trong phạm vi từ Bài {startLessonNum} đến Bài {endLessonNum}. Cô hãy chọn từ Bài 1 trở đi hoặc chuyển sang tab "Tự Chọn Trong Kho Đề" nhé!
                        </span>
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
                        <span>
                          Kho đề đang có <strong className="text-emerald-700">{rangePoolQuestions.length}</strong> câu hỏi trong phạm vi từ Bài {startLessonNum} đến Bài {endLessonNum}
                        </span>
                        <span className="font-bold text-ocean-700">
                          ⚡ Điểm số tự động tính theo cấu hình của từng câu hỏi
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* --- CHẾ ĐỘ 2: GIÁO VIÊN TỰ CHỌN TỪNG CÂU TRONG KHO ĐỀ THEO BÀI --- */}
                {questionSelectMode === 'manual' && (
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3 animate-in fade-in duration-200 max-h-[360px] overflow-y-auto pr-1">
                    <p className="text-xs text-slate-500 font-medium">
                      Cô hãy bấm vào bài học để mở danh sách câu hỏi và tích chọn <code>[x]</code> các câu muốn đưa vào đề thi:
                    </p>

                    {gradeLessons.map((les) => {
                      const questionsInLesson = gradeQuestions.filter(
                        (q) => q.lesson_id === les.id || q.category === les.title
                      );
                      const isExpanded = expandedLessonId === les.id;
                      const selectedCountInThisLesson = selectedExamQuestions.filter(
                        (q) => q.lesson_id === les.id || q.category === les.title
                      ).length;

                      return (
                        <div
                          key={les.id}
                          className="border border-slate-200 rounded-2xl overflow-hidden"
                        >
                          {/* Header của bài học */}
                          <div
                            onClick={() =>
                              setExpandedLessonId(isExpanded ? null : les.id)
                            }
                            className="p-3 bg-slate-50 hover:bg-slate-100 cursor-pointer flex items-center justify-between gap-2 select-none"
                          >
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-lg bg-ocean-100 text-ocean-800 text-[11px] font-black flex items-center justify-center">
                                B{les.lesson_number}
                              </span>
                              <span className="text-xs font-bold text-slate-900">
                                {les.title}
                              </span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-slate-600 border border-slate-200">
                                {questionsInLesson.length} câu
                              </span>
                              {selectedCountInThisLesson > 0 && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                  Đã chọn: {selectedCountInThisLesson}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              {questionsInLesson.length > 0 && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSelectAllInLessonManual(les);
                                  }}
                                  className="text-[11px] font-bold text-ocean-600 hover:text-ocean-800 px-2 py-1 bg-white rounded-lg border border-slate-200"
                                >
                                  Chọn cả bài
                                </button>
                              )}
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-slate-400" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-slate-400" />
                              )}
                            </div>
                          </div>

                          {/* Danh sách câu hỏi khi mở bài */}
                          {isExpanded && (
                            <div className="p-3 bg-white space-y-2 border-t border-slate-100">
                              {questionsInLesson.length === 0 ? (
                                <p className="text-xs text-slate-400 italic py-2 text-center">
                                  Bài học này chưa có câu hỏi nào trong kho đề.
                                </p>
                              ) : (
                                questionsInLesson.map((q) => {
                                  const isSelected = selectedExamQuestions.some(
                                    (item) => item.id === q.id
                                  );

                                  return (
                                    <div
                                      key={q.id}
                                      onClick={() => toggleSelectManualQuestion(q)}
                                      className={`p-2.5 rounded-xl border text-xs cursor-pointer transition flex items-start gap-2.5 ${
                                        isSelected
                                          ? 'bg-ocean-50/70 border-ocean-400 shadow-xs'
                                          : 'bg-white border-slate-200 hover:bg-slate-50'
                                      }`}
                                    >
                                      <div className="pt-0.5">
                                        {isSelected ? (
                                          <CheckSquare className="w-4 h-4 text-ocean-600 fill-ocean-100" />
                                        ) : (
                                          <Square className="w-4 h-4 text-slate-300" />
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                          <span
                                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                              q.type === 'essay'
                                                ? 'bg-purple-100 text-purple-800'
                                                : 'bg-ocean-100 text-ocean-800'
                                            }`}
                                          >
                                            {q.type === 'essay' ? 'Tự Luận' : 'Trắc Nghiệm'}
                                          </span>
                                          <span className="text-[10px] font-bold text-slate-500">
                                            {q.points} Điểm
                                          </span>
                                        </div>
                                        <div className="text-slate-800 font-medium line-clamp-2">
                                          {q.content_json?.question || q.content_json?.prompt || q.title}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* KHUNG THỐNG KÊ CẤU TRÚC ĐỀ & NÚT ĐIỀU CHỈNH ĐIỂM */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <PieChart className="w-4 h-4 text-ocean-600" />
                      <span className="text-xs font-black text-slate-900">
                        Cơ cấu điểm đề thi ({selectedExamQuestions.length} câu)
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={handleNormalizeTo10}
                        className="px-3 py-1 bg-ocean-50 hover:bg-ocean-100 text-ocean-800 border border-ocean-200 text-[11px] font-bold rounded-lg transition active:scale-95 flex items-center gap-1 cursor-pointer"
                        title="Tự động chia đều tổng điểm của các câu đã chọn thành tròn 10.0 điểm"
                      >
                        <Sparkles className="w-3 h-3 text-ocean-600" />
                        Chia Đều Về Thang 10đ
                      </button>

                      <button
                        type="button"
                        onClick={handleResetToOriginalPoints}
                        className="px-3 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-bold rounded-lg transition active:scale-95 flex items-center gap-1 cursor-pointer"
                        title="Khôi phục lại số điểm gốc của từng câu trong kho đề"
                      >
                        <RotateCcw className="w-3 h-3 text-slate-600" />
                        Điểm Gốc Kho Đề
                      </button>

                      <button
                        type="button"
                        onClick={handleSaveAsTemplate}
                        className="px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-[11px] font-bold rounded-lg transition active:scale-95 flex items-center gap-1 cursor-pointer"
                        title="Lưu bộ câu hỏi này thành đề mẫu để dùng lại cho năm sau"
                      >
                        <BookmarkPlus className="w-3 h-3 text-amber-600" />
                        Lưu Đề Mẫu
                      </button>
                    </div>
                  </div>

                  {/* Thanh tỷ lệ điểm Trắc nghiệm & Tự luận */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="p-2.5 bg-blue-50/70 rounded-xl border border-blue-200 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] font-bold text-blue-700">Phần Trắc Nghiệm</div>
                        <div className="text-xs font-black text-blue-950">
                          {structureAnalysis.objCount} câu • {structureAnalysis.objScore} Điểm
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-blue-600 bg-white px-2 py-0.5 rounded-md">
                        Tự động chấm
                      </span>
                    </div>

                    <div className="p-2.5 bg-purple-50/70 rounded-xl border border-purple-200 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] font-bold text-purple-700">Phần Tự Luận</div>
                        <div className="text-xs font-black text-purple-950">
                          {structureAnalysis.essayCount > 0
                            ? `${structureAnalysis.essayCount} câu • ${structureAnalysis.essayScore} Điểm`
                            : 'Không có (0đ)'}
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-purple-600 bg-white px-2 py-0.5 rounded-md">
                        {structureAnalysis.essayCount > 0 ? 'Cô Hảo chấm' : '100% Trắc nghiệm'}
                      </span>
                    </div>

                    <div className="p-2.5 bg-emerald-50/70 rounded-xl border border-emerald-200 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] font-bold text-emerald-700">Tổng Quỹ Điểm Đề</div>
                        <div className="text-xs font-black text-emerald-950">
                          {structureAnalysis.totalScore} Điểm
                        </div>
                      </div>
                      <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                        ✓ Tự do theo câu hỏi
                      </span>
                    </div>
                  </div>

                  {/* Danh sách các câu hỏi trong đề */}
                  {selectedExamQuestions.length === 0 ? (
                    <div className="py-6 px-4 text-center border-2 border-dashed border-amber-300 bg-amber-50/70 rounded-2xl space-y-2.5">
                      <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto font-black text-sm">
                        !
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="font-bold text-xs sm:text-sm text-slate-900">
                          Đề thi hiện tại đang có 0 câu hỏi
                        </h4>
                        <p className="text-[11px] sm:text-xs text-slate-500 max-w-md mx-auto">
                          Để có thể giao bài cho học sinh, cô hãy bấm nút màu xanh <strong className="text-ocean-700">"🎲 Bốc Câu Vào Đề"</strong> ở trên, hoặc chọn câu trong tab <strong className="text-slate-800">"Tự Chọn Trong Kho Đề"</strong> nhé!
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                        {rangePoolQuestions.length > 0 && (
                          <button
                            type="button"
                            onClick={handleGenerateRandomQuestions}
                            className="px-4 py-2 bg-gradient-to-r from-ocean-600 to-teal-600 hover:from-ocean-700 hover:to-teal-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
                          >
                            <Shuffle className="w-3.5 h-3.5" />
                            Bốc Nhanh {Math.min(randomCount, rangePoolQuestions.length)} Câu Vào Đề Ngay
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setQuestionSelectMode('manual')}
                          className="px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <ListFilter className="w-3.5 h-3.5" />
                          Tự Chọn Trong Kho Đề
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsTemplateModalOpen(true)}
                          className="px-3.5 py-2 bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-900 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <BookmarkPlus className="w-3.5 h-3.5" />
                          Lấy Từ Đề Thi Mẫu
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                      {selectedExamQuestions.map((q, idx) => (
                        <div
                          key={q.id}
                          className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between gap-2"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-5 h-5 rounded-full bg-ocean-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.2 rounded shrink-0 ${
                                q.type === 'essay'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-ocean-100 text-ocean-800'
                              }`}
                            >
                              {q.type === 'essay' ? 'Tự Luận' : 'Trắc Nghiệm'}
                            </span>
                            <span className="text-slate-800 font-medium truncate">
                              {q.content_json?.question || q.content_json?.prompt || q.title}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] font-bold text-slate-600">
                              {q.points}đ
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedExamQuestions(
                                  selectedExamQuestions.filter((item) => item.id !== q.id)
                                )
                              }
                              className="text-slate-400 hover:text-red-600 p-1"
                              title="Bỏ câu này ra khỏi đề"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* PHẦN 4: CÀI ĐẶT THỜI GIAN & HẠN NỘP */}
              <div className="bg-slate-50/80 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-3">
                <label className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-ocean-600 text-white flex items-center justify-center text-[10px]">4</span>
                  Cài Đặt Hạn Nộp & Quy Chế Thi
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Hạn chót nộp bài (Deadline):
                    </label>
                    <input
                      type="datetime-local"
                      required
                      value={deadlineDate}
                      onChange={(e) => setDeadlineDate(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-ocean-500"
                    />
                  </div>

                  <div className="space-y-2 pt-1">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={allowLate}
                        onChange={(e) => setAllowLate(e.target.checked)}
                        className="rounded text-ocean-600"
                      />
                      <span>Cho phép nộp muộn (Gắn thẻ "Nộp trễ")</span>
                    </label>

                    <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={shuffleQuestions}
                        onChange={(e) => setShuffleQuestions(e.target.checked)}
                        className="rounded text-ocean-600"
                      />
                      <span>Trộn thứ tự câu hỏi và đáp án chống nhìn bài</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* BẢNG TỔNG KẾT VÀ XÁC NHẬN SỐ LƯỢNG CÂU HỎI (GỢI Ý 2) */}
              <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-amber-900">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Xác nhận thông tin đề thi chuẩn bị giao:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11.5px] pt-1">
                  <div className="bg-white/80 p-2 rounded-xl border border-amber-200">
                    <span className="text-slate-500 block text-[10px]">Số lượng câu:</span>
                    <strong className="text-amber-950 font-black text-xs">
                      {selectedExamQuestions.length} câu hỏi
                    </strong>{' '}
                    ({structureAnalysis.objCount} TN + {structureAnalysis.essayCount} TL)
                  </div>
                  <div className="bg-white/80 p-2 rounded-xl border border-amber-200">
                    <span className="text-slate-500 block text-[10px]">Lớp nhận đề:</span>
                    <strong className="text-amber-950 font-black text-xs">
                      {createSelectedClasses.join(', ') || 'Chưa chọn'}
                    </strong>
                  </div>
                  <div className="bg-white/80 p-2 rounded-xl border border-amber-200">
                    <span className="text-slate-500 block text-[10px]">Điểm số & Thời gian:</span>
                    <strong className="text-amber-950 font-black text-xs">
                      {structureAnalysis.totalScore}đ • {durationMinutes} phút
                    </strong>
                  </div>
                </div>
              </div>

              {/* NÚT TẠO ĐỀ & GIAO BÀI CUỐI CÙNG */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100">
                <div className="text-xs text-slate-600 flex items-center gap-2 flex-wrap">
                  <span>
                    Tổng kết: <strong>{createSelectedClasses.length} lớp</strong> (Khối {createGrade}) •{' '}
                    <strong className={selectedExamQuestions.length === 0 ? 'text-rose-600 font-black' : 'text-slate-900 font-bold'}>
                      {selectedExamQuestions.length} câu hỏi
                    </strong>{' '}
                    • <strong>{structureAnalysis.totalScore} Điểm</strong>
                  </span>
                  {selectedExamQuestions.length === 0 && (
                    <span className="text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                      ⚠️ Cần thêm câu hỏi vào đề
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                  >
                    Hủy Bỏ
                  </button>

                  <button
                    type="submit"
                    className={`flex-1 sm:flex-none px-6 py-2.5 font-black text-xs sm:text-sm rounded-xl shadow-md transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer ${
                      selectedExamQuestions.length === 0
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-amber-500/20'
                        : 'bg-gradient-to-r from-ocean-600 to-teal-600 hover:from-ocean-700 hover:to-teal-700 text-white shadow-ocean-500/20'
                    }`}
                  >
                    {selectedExamQuestions.length === 0 ? (
                      <>
                        <AlertCircle className="w-4 h-4 stroke-[2.5]" />
                        <span>Chưa Chọn Câu Hỏi (Bấm Để Xem)</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>Xác Nhận Tạo Đề & Giao Bài ({selectedExamQuestions.length} câu)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL MÃ QR & LINK GIAO BÀI (TẢI ẢNH / CHIẾU TOÀN MÀN HÌNH) */}
      <AssignmentQrModal
        assignment={qrModalAssignment}
        isOpen={Boolean(qrModalAssignment)}
        onClose={() => setQrModalAssignment(null)}
      />

      {/* MODAL XEM LẠI ĐỀ THI ĐÃ GIAO (CÔ HẢO YÊU CẦU) */}
      {previewAssignment && (
        <AssignmentPreviewModal
          assignment={previewAssignment}
          questions={previewQuestions}
          onClose={() => setPreviewAssignment(null)}
          onTakeExamAsStudent={(assignmentId) => {
            sessionStorage.setItem('is_teacher_previewing', 'true');
            setPreviewAssignment(null);
            navigate(`/take-exam/${assignmentId}?preview=true`);
          }}
          onEditQuestions={(asg) => {
            setPreviewAssignment(null);
            setEditingQuestionsAssignment(asg);
          }}
        />
      )}

      {/* MODAL CHỈNH SỬA CÂU HỎI TRONG ĐỀ ĐÃ GIAO (GỢI Ý 3) */}
      {editingQuestionsAssignment && (
        <EditAssignmentQuestionsModal
          isOpen={Boolean(editingQuestionsAssignment)}
          assignment={editingQuestionsAssignment}
          onClose={() => setEditingQuestionsAssignment(null)}
          onSave={handleSaveEditedAssignment}
        />
      )}

      {/* MODAL CẢNH BÁO AN TOÀN KHI XÓA BÀI CÓ HỌC SINH ĐÃ NỘP (GỢI Ý 3) */}
      <DeleteAssignmentWarningModal
        isOpen={Boolean(warningModalAssignment)}
        assignment={warningModalAssignment}
        submissionsCount={warningModalSubmissionsCount}
        onClose={() => setWarningModalAssignment(null)}
        onPause={(asg) => handleTogglePause(asg)}
        onMoveToTrash={(asg) => handleMoveToTrash(asg)}
        onForceDelete={(asg) => handleForceDelete(asg)}
      />

      {/* MODAL THÙNG RÁC LƯU TRỮ TẠM & KHÔI PHỤC (GỢI Ý 2) */}
      <AssignmentTrashModal
        isOpen={isTrashModalOpen}
        onClose={() => setIsTrashModalOpen(false)}
        trashAssignments={trashAssignments}
        onRestore={(id) => handleRestoreFromTrash(id)}
        onPermanentDelete={(id) => handlePermanentDeleteFromTrash(id)}
        onEmptyTrash={handleEmptyTrash}
      />

      {/* MODAL XEM CHI TIẾT DANH SÁCH ĐÃ NỘP / CHƯA NỘP & SAO CHÉP GỬI ZALO (GỢI Ý 1) */}
      <SubmissionStatusModal
        isOpen={Boolean(statusModalAssignment)}
        onClose={() => setStatusModalAssignment(null)}
        assignment={statusModalAssignment}
        students={students}
        studentSubmissions={studentSubmissions}
      />
    </div>
  );
};
