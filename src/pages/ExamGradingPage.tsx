import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  CheckCircle,
  Edit3,
  Search,
  Filter,
  User,
  Clock,
  Award,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Save,
  Check,
  Sparkles,
  HelpCircle,
  Send,
  CheckSquare,
  Square,
  Users,
  MessageSquare,
  ThumbsUp,
  Flame,
  Star,
  Layers,
  Trash2,
  Eraser,
  RotateCcw,
} from 'lucide-react';
import { StudentResult, Question } from '../types/database';
import { LatexRenderer } from '../components/common/LatexRenderer';
import { triggerCelebration } from '../lib/gamification';
import { BadgeList } from '../components/common/BadgeList';
import { getStudentBadges, toggleBadgeForStudent } from '../data/badgeService';
import { playSoftClick } from '../utils/soundEffects';

// Danh sách bài nộp mẫu của học sinh
const DEFAULT_SUBMISSIONS: any[] = [
  {
    id: 'sub_1',
    assignment_id: 'asg_1',
    assignment_title: 'Kiểm Tra 15 Phút: Vị Trí Địa Lí & Bản Đồ',
    student_name: 'Nguyễn Văn An',
    student_code: 'HS0601',
    class_name: 'Lớp 6A1',
    score_tn: 6.5,
    max_score_tn: 7.0,
    score_tl: 2.5,
    max_score_tl: 3.0,
    score: 9.0,
    max_score: 10.0,
    is_late: false,
    submitted_at: '15 phút trước',
    status: 'graded',
    teacher_feedback_text: 'Em nắm rất vững kiến thức và lập luận câu tự luận chặt chẽ!',
    essay_question: 'Em hãy nêu 2 thuận lợi cơ bản do vị trí địa lí mang lại cho thiên nhiên nước ta.',
    essay_answer: '1. Nước ta có khí hậu nhiệt đới ẩm, nhiều ánh sáng và nước mưa dồi dào;\n2. Sinh vật rất đa dạng, có nhiều loài động thực vật quý hiếm phát triển quanh năm.',
    answers_json: {
      q_take_1: 0,
      q_take_2: 0,
      q_take_3: { st1: true, st2: false },
      q_take_4: { blank_1: 'Phan-xi-păng' },
    },
  },
  {
    id: 'sub_2',
    assignment_id: 'asg_1',
    assignment_title: 'Kiểm Tra 15 Phút: Vị Trí Địa Lí & Bản Đồ',
    student_name: 'Tẩn Thị Lan Anh',
    student_code: 'HS071',
    class_name: 'Lớp 7A1',
    score_tn: 7.0,
    max_score_tn: 7.0,
    score_tl: 0,
    max_score_tl: 3.0,
    score: 7.0,
    max_score: 10.0,
    is_late: false,
    submitted_at: '30 phút trước',
    status: 'waiting_teacher_grading',
    teacher_feedback_text: '',
    essay_question: 'Em hãy nêu 2 thuận lợi cơ bản do vị trí địa lí mang lại cho thiên nhiên nước ta.',
    essay_answer: 'Vị trí địa lí giúp nước ta có nguồn nhiệt ẩm dồi dào, cây cối xanh tốt quanh năm và có đường bờ biển dài thuận lợi phát triển kinh tế biển.',
    answers_json: {},
  },
  {
    id: 'sub_3',
    assignment_id: 'asg_2',
    assignment_title: 'Khảo Sát Địa Lí Tự Nhiên & Biển Đảo Khối 9',
    student_name: 'Lò Giá Bè',
    student_code: 'HS074',
    class_name: 'Lớp 7A1',
    score_tn: 5.5,
    max_score_tn: 7.0,
    score_tl: 0,
    max_score_tl: 3.0,
    score: 5.5,
    max_score: 10.0,
    is_late: true,
    submitted_at: '2 giờ trước',
    status: 'waiting_teacher_grading',
    teacher_feedback_text: '',
    essay_question: 'Phân tích ý nghĩa của vùng biển đối với phát triển kinh tế nước ta.',
    essay_answer: 'Vùng biển nước ta có nhiều dầu khí, muối, hải sản và cảnh đẹp để làm du lịch.',
    answers_json: {},
  },
];

const PRESET_FEEDBACKS = [
  '🌟 Em nắm rất vững kiến thức và làm bài rất tốt!',
  '👍 Làm bài tốt, câu tự luận cần trình bày rõ ý hơn một chút.',
  '✍️ Em cần chú ý phân tích sâu hơn các số liệu địa lí.',
  '🎯 Cần ôn lại kiến thức bài học để đạt kết quả cao hơn nhé.',
  '👏 Rất đáng khen ngợi, có tiến bộ vượt bậc tuần này!',
];

const BULK_PRESET_FEEDBACKS = [
  {
    title: 'Khen nhóm xuất sắc (8-10đ)',
    text: '🌟 Cô khen các em làm bài rất xuất sắc, nắm vững kiến thức và tiến bộ vượt bậc!',
    icon: '🌟',
  },
  {
    title: 'Khen bài làm khá tốt (6.5-7.9đ)',
    text: '👍 Các em làm bài khá tốt, cần chú ý đọc kỹ câu hỏi hơn để đạt điểm tuyệt đối nhé!',
    icon: '👍',
  },
  {
    title: 'Nhắc nhở ôn tập (Dưới 6.5đ)',
    text: '🎯 Các em cần ôn lại kiến thức bài học và làm bài cẩn thận hơn ở lần kiểm tra tới nhé!',
    icon: '✍️',
  },
];

// Hàm phân loại màu sắc và xếp loại học lực theo điểm số (Gợi ý 3)
export function getPerformanceCategory(score: number, maxScore: number = 10) {
  const normalized = maxScore > 0 ? (score / maxScore) * 10 : 0;
  if (normalized >= 8.0) {
    return {
      label: 'Giỏi / Xuất Sắc',
      icon: '🌟',
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-1 ring-emerald-200',
      rowBorderClass: 'border-l-4 border-l-emerald-500',
      categoryKey: 'excellent',
    };
  }
  if (normalized >= 6.5) {
    return {
      label: 'Khá',
      icon: '👍',
      badgeClass: 'bg-sky-50 text-sky-800 border-sky-300 ring-1 ring-sky-200',
      rowBorderClass: 'border-l-4 border-l-sky-500',
      categoryKey: 'good',
    };
  }
  if (normalized >= 5.0) {
    return {
      label: 'Trung Bình',
      icon: '⚠️',
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-300 ring-1 ring-amber-200',
      rowBorderClass: 'border-l-4 border-l-amber-500',
      categoryKey: 'average',
    };
  }
  return {
    label: 'Cần Cố Gắng',
    icon: '❗',
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-300 ring-1 ring-rose-200',
    rowBorderClass: 'border-l-4 border-l-rose-500',
    categoryKey: 'poor',
  };
}

// Lưu thông báo mới cho học sinh (Gợi ý 2)
export function notifyStudentOfFeedback(
  studentCode: string,
  studentName: string,
  assignmentTitle: string,
  assignmentId: string,
  feedback: string
) {
  try {
    const existingNotifs = JSON.parse(localStorage.getItem('geo_student_notifications') || '[]');
    const newNotif = {
      id: 'notif_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      student_code: studentCode,
      student_name: studentName,
      assignment_title: assignmentTitle,
      assignment_id: assignmentId,
      feedback_text: feedback,
      created_at: new Date().toISOString(),
      is_read: false,
    };
    localStorage.setItem('geo_student_notifications', JSON.stringify([newNotif, ...existingNotifs]));
    window.dispatchEvent(new Event('geo_notifications_updated'));
  } catch (e) {
    console.warn('Lỗi lưu thông báo:', e);
  }
}

// Nhận diện bài thi nộp thử nghiệm của Học Sinh Mẫu (Gợi ý 3)
export function isTestSubmission(sub: any): boolean {
  if (!sub) return false;
  const name = (sub.student_name || '').toLowerCase();
  const code = (sub.student_code || '').toLowerCase();
  return (
    name.includes('học sinh mẫu') ||
    name.includes('thử nghiệm') ||
    name.includes('test') ||
    code.includes('hs_mock') ||
    code.includes('hs_test') ||
    (code === 'hs0601' && name.includes('học sinh mẫu'))
  );
}

export const ExamGradingPage: React.FC = () => {
  const [searchParams] = useSearchParams();

  // Đọc danh sách bài nộp từ LocalStorage
  const [submissions, setSubmissions] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('geo_student_submissions');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Lỗi đọc submissions:', e);
    }
    return DEFAULT_SUBMISSIONS;
  });

  // Đọc danh sách các đợt giao bài từ LocalStorage
  const [assignmentsList] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('geo_assignments');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Lỗi đọc geo_assignments:', e);
    }
    return [];
  });

  const saveSubmissions = (newSubs: any[]) => {
    setSubmissions(newSubs);
    localStorage.setItem('geo_student_submissions', JSON.stringify(newSubs));
  };

  const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null);

  // Tab phân loại: 'pending' (Mặc định - Chỉ hiện bài chưa nhận xét), 'graded' (Đã nhận xét xong), 'all' (Tất cả)
  const [activeTab, setActiveTab] = useState<'pending' | 'graded' | 'all'>('pending');

  // Bộ lọc
  const [assignmentFilter, setAssignmentFilter] = useState<string>(() => {
    return searchParams.get('assignmentId') || 'all';
  });
  const [classFilter, setClassFilter] = useState<string>('all');
  const [scoreFilter, setScoreFilter] = useState<string>('all'); // Bộ lọc học lực (Gợi ý 3)
  const [testTypeFilter, setTestTypeFilter] = useState<'all' | 'real_only' | 'test_only'>('all'); // Lọc bài thi thật vs bài thi thử
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Đếm tổng số bài thi thử của học sinh mẫu
  const testSubmissionsCount = useMemo(() => {
    return submissions.filter((s) => isTestSubmission(s)).length;
  }, [submissions]);

  // Danh sách học sinh được chọn để nhận xét nhanh hàng loạt hoặc xóa
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState<boolean>(false);
  const [bulkFeedbackText, setBulkFeedbackText] = useState<string>(
    '🌟 Cô khen các em làm bài rất xuất sắc, nắm vững kiến thức và tiến bộ vượt bậc!'
  );

  // Form chấm điểm & nhận xét cá nhân
  const [essayScore, setEssayScore] = useState<number>(0);
  const [feedbackText, setFeedbackText] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [, setGradingBadgeRefresh] = useState<number>(0);

  useEffect(() => {
    const asgId = searchParams.get('assignmentId');
    if (asgId) {
      setAssignmentFilter(asgId);
    }
    const submissionId = searchParams.get('submissionId');
    if (submissionId) {
      const found = submissions.find((s) => s.id === submissionId);
      if (found) openGradingModal(found);
    }
  }, [searchParams, submissions]);

  const openGradingModal = (sub: any) => {
    setSelectedSubmission(sub);
    setEssayScore(sub.score_tl || 0);
    setFeedbackText(sub.teacher_feedback_text || '');
  };

  // Xác định bài nộp cần được nhận xét / chấm điểm
  const isSubmissionPending = (sub: any) => {
    const hasFeedback = Boolean(sub.teacher_feedback_text && sub.teacher_feedback_text.trim().length > 0);
    const isWaitingGrading = sub.status === 'waiting_teacher_grading';
    return isWaitingGrading || !hasFeedback;
  };

  // Tổng số lượng bài theo từng tab
  const pendingCount = useMemo(() => {
    return submissions.filter((s) => isSubmissionPending(s)).length;
  }, [submissions]);

  const completedCount = useMemo(() => {
    return submissions.filter((s) => !isSubmissionPending(s)).length;
  }, [submissions]);

  // Tổng điểm tự động cộng dồn
  const calculatedTotalScore = useMemo(() => {
    if (!selectedSubmission) return 0;
    const tn = Number(selectedSubmission.score_tn) || 0;
    const tl = Number(essayScore) || 0;
    const max = Number(selectedSubmission.max_score) || 10;
    return Number(Math.min(max, tn + tl).toFixed(2));
  }, [selectedSubmission, essayScore]);

  // Lưu Điểm & Gửi Nhận Xét Cá Nhân (Bài làm sẽ tự động rời khỏi danh sách Chờ)
  const handleSaveGrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubmission) return;

    setIsSaving(true);
    const feedback = feedbackText.trim() || 'Cô đã ghi nhận và đánh giá tốt bài làm của em!';

    const updatedSubmissions = submissions.map((s) =>
      s.id === selectedSubmission.id
        ? {
            ...s,
            score_tl: Number(essayScore),
            score: calculatedTotalScore,
            status: 'graded',
            teacher_feedback_text: feedback,
            graded_at: new Date().toISOString(),
          }
        : s
    );

    saveSubmissions(updatedSubmissions);

    // Cập nhật kết quả lưu cache cho học sinh xem ngay
    try {
      const cachedKey = `geo_result_${selectedSubmission.assignment_id}`;
      const cachedResultStr = localStorage.getItem(cachedKey);
      if (cachedResultStr) {
        const cached = JSON.parse(cachedResultStr);
        if (cached.student_code === selectedSubmission.student_code || cached.id === selectedSubmission.id) {
          cached.score_tl = Number(essayScore);
          cached.score = calculatedTotalScore;
          cached.status = 'graded';
          cached.teacher_feedback_text = feedback;
          localStorage.setItem(cachedKey, JSON.stringify(cached));
        }
      }
    } catch (err) {
      console.warn('Lỗi cập nhật cached result:', err);
    }

    // Gửi thông báo cho học sinh (Gợi ý 2)
    notifyStudentOfFeedback(
      selectedSubmission.student_code,
      selectedSubmission.student_name,
      selectedSubmission.assignment_title,
      selectedSubmission.assignment_id,
      feedback
    );

    setIsSaving(false);
    setSelectedSubmission(null);
    triggerCelebration();

    alert(`🎉 Đã gửi nhận xét thành công cho học sinh ${selectedSubmission.student_name}!\nBài làm đã hoàn tất và được chuyển sang mục "Đã nhận xét xong".`);
  };

  // Gợi ý 1: Áp dụng nhận xét nhanh hàng loạt cho các học sinh được chọn
  const handleApplyBulkFeedback = () => {
    if (selectedIds.length === 0) return;

    const feedback = bulkFeedbackText.trim() || 'Cô khen các em làm bài tốt, tiếp tục phát huy nhé!';

    const updatedSubmissions = submissions.map((s) => {
      if (selectedIds.includes(s.id)) {
        try {
          const cachedKey = `geo_result_${s.assignment_id}`;
          const cachedResultStr = localStorage.getItem(cachedKey);
          if (cachedResultStr) {
            const cached = JSON.parse(cachedResultStr);
            if (cached.student_code === s.student_code || cached.id === s.id) {
              cached.status = 'graded';
              cached.teacher_feedback_text = feedback;
              localStorage.setItem(cachedKey, JSON.stringify(cached));
            }
          }
        } catch (err) {
          console.warn('Lỗi cập nhật cached result:', err);
        }

        notifyStudentOfFeedback(
          s.student_code,
          s.student_name,
          s.assignment_title,
          s.assignment_id,
          feedback
        );

        return {
          ...s,
          status: 'graded',
          teacher_feedback_text: feedback,
          graded_at: new Date().toISOString(),
        };
      }
      return s;
    });

    saveSubmissions(updatedSubmissions);
    const count = selectedIds.length;
    setSelectedIds([]);
    setIsBulkModalOpen(false);
    triggerCelebration();

    alert(`🎉 Đã gửi nhận xét 1-click thành công cho ${count} học sinh!\nToàn bộ bài làm đã hoàn tất và tự động chuyển sang mục "Đã nhận xét xong".`);
  };

  // XÓA 1 BÀI NỘP / NHẬN XÉT CỦA HỌC SINH ĐỂ GIẢI PHÓNG DUNG LƯỢNG
  const handleDeleteSingle = (subId: string, studentName: string) => {
    if (
      window.confirm(
        `Cô có chắc chắn muốn xóa bài kiểm tra & nhận xét của học sinh "${studentName}" không?\nThao tác này giúp dọn dẹp và giải phóng bộ nhớ lưu trữ.`
      )
    ) {
      const updated = submissions.filter((s) => s.id !== subId);
      saveSubmissions(updated);
      setSelectedIds((prev) => prev.filter((id) => id !== subId));
      alert(`Đã xóa bài làm của học sinh ${studentName} thành công!`);
    }
  };

  // XÓA HÀNG LOẠT CÁC BÀI ĐÃ CHỌN
  const handleDeleteBulk = () => {
    if (selectedIds.length === 0) return;
    if (
      window.confirm(
        `Cô có chắc chắn muốn xóa ${selectedIds.length} bài làm đã chọn không?\nThao tác này sẽ xóa vĩnh viễn dữ liệu các bài này để tiết kiệm bộ nhớ.`
      )
    ) {
      const count = selectedIds.length;
      const updated = submissions.filter((s) => !selectedIds.includes(s.id));
      saveSubmissions(updated);
      setSelectedIds([]);
      alert(`Đã xóa thành công ${count} bài kiểm tra đã chọn!`);
    }
  };

  // DỌN DẸP / XÓA TOÀN BỘ BÀI ĐÃ NHẬN XÉT XONG
  const handleClearAllGraded = () => {
    if (completedCount === 0) {
      alert('Hiện không có bài nào trong danh mục "Đã nhận xét xong" để dọn dẹp.');
      return;
    }
    if (
      window.confirm(
        `Cô có chắc chắn muốn xóa toàn bộ ${completedCount} bài đã nhận xét xong không?\nViệc này giúp giải phóng dung lượng sau khi cô đã tổng kết xong sổ điểm.`
      )
    ) {
      const updated = submissions.filter((s) => isSubmissionPending(s));
      saveSubmissions(updated);
      setSelectedIds([]);
      alert(`Đã dọn dẹp và xóa thành công ${completedCount} bài đã hoàn tất!`);
    }
  };

  // XÓA TOÀN BỘ BÀI LÀM THỬ NGHIỆM CỦA HỌC SINH MẪU (GỢI Ý 3)
  const handleDeleteAllTestSubmissions = () => {
    playSoftClick();
    if (testSubmissionsCount === 0) {
      alert('Hiện không có bài làm thử nghiệm nào của học sinh mẫu trong hệ thống.');
      return;
    }

    const confirmDelete = window.confirm(
      `Cô Hảo có chắc chắn muốn xóa toàn bộ ${testSubmissionsCount} bài làm thử nghiệm của Học Sinh Mẫu không?\n\n• Thao tác này giúp bảng điểm chỉ còn lại bài làm của học sinh thật.\n• Hoàn toàn không ảnh hưởng đến bài kiểm tra và điểm số của học sinh thật.`
    );

    if (!confirmDelete) return;

    // Lọc bỏ toàn bộ bài thi của học sinh mẫu
    const remainingSubmissions = submissions.filter((s) => !isTestSubmission(s));
    saveSubmissions(remainingSubmissions);
    setSelectedIds([]);

    // Dọn dẹp cả bài nộp trong kết quả chi tiết geo_result_... của học sinh mẫu
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('geo_result_')) {
          try {
            const data = JSON.parse(localStorage.getItem(key) || '{}');
            if (isTestSubmission(data)) {
              keysToRemove.push(key);
            }
          } catch (e) {}
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch (e) {
      console.warn(e);
    }

    // Cập nhật lại số lượng bài nộp submissions_count trong danh sách đề thi geo_assignments
    try {
      const savedAsgs = localStorage.getItem('geo_assignments');
      if (savedAsgs) {
        const asgs = JSON.parse(savedAsgs);
        const updatedAsgs = asgs.map((a: any) => {
          const realSubsCount = remainingSubmissions.filter((s) => s.assignment_id === a.id).length;
          return {
            ...a,
            submissions_count: realSubsCount,
          };
        });
        localStorage.setItem('geo_assignments', JSON.stringify(updatedAsgs));
        window.dispatchEvent(new Event('geo_assignments_updated'));
      }
    } catch (e) {
      console.warn(e);
    }

    // Phát sự kiện đồng bộ toàn hệ thống
    window.dispatchEvent(new Event('geo_student_submissions_updated'));
    window.dispatchEvent(new Event('geo_notifications_updated'));

    alert(`✨ Đã dọn dẹp thành công ${testSubmissionsCount} bài làm thử nghiệm!\nBảng điểm giờ đây hoàn toàn tinh gọn và chỉ lưu bài làm của học sinh thật.`);
  };

  // Chọn hoặc bỏ chọn tất cả
  const handleToggleSelectAll = () => {
    if (selectedIds.length === filteredSubmissions.length && filteredSubmissions.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredSubmissions.map((s) => s.id));
    }
  };

  // Chọn hoặc bỏ chọn 1 học sinh
  const handleToggleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Lọc bài nộp theo Tab, đợt giao bài, lớp, học lực, loại bài (thật/thử), từ khóa
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      // 1. Lọc theo Tab chính
      if (activeTab === 'pending' && !isSubmissionPending(sub)) return false;
      if (activeTab === 'graded' && isSubmissionPending(sub)) return false;

      // 2. Lọc theo Đợt giao bài
      if (assignmentFilter !== 'all' && sub.assignment_id && sub.assignment_id !== assignmentFilter) {
        return false;
      }

      // 3. Lọc theo Lớp
      if (classFilter !== 'all' && sub.class_name !== classFilter) return false;

      // 4. Lọc theo Học Lực (Gợi ý 3)
      if (scoreFilter !== 'all') {
        const perf = getPerformanceCategory(sub.score, sub.max_score || 10);
        if (perf.categoryKey !== scoreFilter) return false;
      }

      // 5. Lọc theo Bài thi thật vs Bài thi thử
      if (testTypeFilter === 'real_only' && isTestSubmission(sub)) return false;
      if (testTypeFilter === 'test_only' && !isTestSubmission(sub)) return false;

      // 6. Lọc theo Từ khóa tìm kiếm
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchName = sub.student_name?.toLowerCase().includes(term);
        const matchTitle = sub.assignment_title?.toLowerCase().includes(term);
        const matchCode = sub.student_code?.toLowerCase().includes(term);
        if (!matchName && !matchTitle && !matchCode) return false;
      }

      return true;
    });
  }, [submissions, activeTab, assignmentFilter, classFilter, scoreFilter, testTypeFilter, searchTerm]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16">
      {/* 1. Header Trang Chấm Bài */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-ocean-600" />
            <span>Chấm Bài Kiểm Tra & Ghi Nhận Xét</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Gửi lời nhận xét và phản hồi kết quả trực tiếp tới học sinh • Hỗ trợ xóa dọn dẹp dung lượng
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {pendingCount > 0 && (
            <div className="px-3.5 py-1.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-black flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              <span>{pendingCount} bài chờ nhận xét</span>
            </div>
          )}

          {/* Nút Xóa Toàn Bộ Bài Làm Thử Nghiệm (Gợi ý 3) */}
          {testSubmissionsCount > 0 && (
            <button
              type="button"
              onClick={handleDeleteAllTestSubmissions}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-[#FAF6EE] hover:bg-[#F4E8D3] border border-[#ECD9B5] text-[#774F1B] text-xs font-black transition cursor-pointer active:scale-95 shadow-2xs"
              title="Xóa toàn bộ các bài nộp của học sinh mẫu thử nghiệm để làm sạch sổ điểm"
            >
              <Trash2 className="w-3.5 h-3.5 text-[#C9942C]" />
              <span>Dọn Dẹp {testSubmissionsCount} Bài Thi Thử 🧪</span>
            </button>
          )}

          {/* Nút Dọn dẹp / Xóa bài đã nhận xét xong để tiết kiệm bộ nhớ */}
          {completedCount > 0 && (
            <button
              type="button"
              onClick={handleClearAllGraded}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold transition cursor-pointer active:scale-95"
              title="Xóa tất cả các bài đã nhận xét xong để giải phóng bộ nhớ"
            >
              <Eraser className="w-3.5 h-3.5 text-rose-600" />
              <span>Dọn Dẹp {completedCount} Bài Đã Xong</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. TAB PHÂN LOẠI TRẠNG THÁI: CHỜ NHẬN XÉT / ĐÃ XONG */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => {
            setActiveTab('pending');
            setSelectedIds([]);
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition cursor-pointer shrink-0 ${
            activeTab === 'pending'
              ? 'bg-ocean-600 text-white shadow-md ring-2 ring-ocean-300'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>⏳ Cần Nhận Xét & Chấm Bài</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === 'pending'
                ? 'bg-white/25 text-white'
                : pendingCount > 0
                ? 'bg-amber-100 text-amber-800 font-black'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {pendingCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('graded');
            setSelectedIds([]);
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition cursor-pointer shrink-0 ${
            activeTab === 'graded'
              ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-300'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>✓ Đã Nhận Xét Xong</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === 'graded' ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {completedCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('all');
            setSelectedIds([]);
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition cursor-pointer shrink-0 ${
            activeTab === 'all'
              ? 'bg-slate-900 text-white shadow-md ring-2 ring-slate-400'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Tất Cả ({submissions.length})</span>
        </button>
      </div>

      {/* 3. BỘ LỌC TÌM KIẾM & PHÂN LOẠI HỌC LỰC */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex-wrap">
        {/* Lọc theo đợt giao bài */}
        <select
          value={assignmentFilter}
          onChange={(e) => setAssignmentFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-ocean-500 max-w-xs cursor-pointer"
        >
          <option value="all">Tất cả đợt giao bài ({assignmentsList.length})</option>
          {assignmentsList.map((a) => (
            <option key={a.id} value={a.id}>
              {a.title}
            </option>
          ))}
        </select>

        {/* Lọc theo Lớp */}
        <select
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-ocean-500 cursor-pointer"
        >
          <option value="all">Tất cả các Lớp</option>
          <option value="Lớp 6A1">Lớp 6A1</option>
          <option value="Lớp 6A2">Lớp 6A2</option>
          <option value="Lớp 6A3">Lớp 6A3</option>
          <option value="Lớp 6A4">Lớp 6A4</option>
          <option value="Lớp 7A1">Lớp 7A1</option>
          <option value="Lớp 7A2">Lớp 7A2</option>
          <option value="Lớp 8A1">Lớp 8A1</option>
          <option value="Lớp 9A1">Lớp 9A1</option>
          <option value="Lớp 9A4">Lớp 9A4</option>
        </select>

        {/* Bộ lọc phân loại theo mức điểm học lực */}
        <select
          value={scoreFilter}
          onChange={(e) => setScoreFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-ocean-500 cursor-pointer"
        >
          <option value="all">📊 Tất cả mức điểm</option>
          <option value="excellent">🌟 Giỏi / Xuất Sắc (8.0 - 10đ)</option>
          <option value="good">👍 Khá (6.5 - 7.9đ)</option>
          <option value="average">⚠️ Trung Bình (5.0 - 6.4đ)</option>
          <option value="poor">❗ Cần Cố Gắng (&lt; 5.0đ)</option>
        </select>

        {/* Bộ lọc phân loại bài thi thật vs bài thi thử (Gợi ý 3) */}
        <select
          value={testTypeFilter}
          onChange={(e) => setTestTypeFilter(e.target.value as any)}
          className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-ocean-500 cursor-pointer"
        >
          <option value="all">👥 Mọi bài nộp ({submissions.length})</option>
          <option value="real_only">🎒 Chỉ học sinh thật ({submissions.length - testSubmissionsCount})</option>
          <option value="test_only">🧪 Chỉ bài thi thử ({testSubmissionsCount})</option>
        </select>

        <div className="relative flex-1 min-w-[200px] w-full">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm theo Tên học sinh, Mã học sinh..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-ocean-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* THANH THAO TÁC HÀNG LOẠT: NHẬN XÉT HOẶC XÓA (BULK ACTION BAR) */}
      {selectedIds.length > 0 && (
        <div className="p-3.5 bg-gradient-to-r from-ocean-600 via-teal-600 to-indigo-700 rounded-2xl text-white shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-xl bg-white/20 text-white font-black text-xs flex items-center justify-center">
              {selectedIds.length}
            </span>
            <span className="text-xs font-bold">
              Đang chọn <strong>{selectedIds.length}</strong> học sinh
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setIsBulkModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-yellow-400 hover:bg-yellow-300 active:scale-95 text-amber-950 text-xs font-black rounded-xl shadow transition cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              Nhận Xét Nhanh 1-Click ({selectedIds.length} HS)
            </button>

            {/* Nút Xóa Hàng Loạt */}
            <button
              type="button"
              onClick={handleDeleteBulk}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-black rounded-xl shadow transition cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              Xóa {selectedIds.length} Bài Đã Chọn
            </button>

            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="px-3 py-2 bg-white/15 hover:bg-white/25 text-white text-xs font-bold rounded-xl transition cursor-pointer"
            >
              Bỏ chọn
            </button>
          </div>
        </div>
      )}

      {/* 4. BẢNG DANH SÁCH BÀI NỘP */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm overflow-hidden">
        {filteredSubmissions.length === 0 ? (
          activeTab === 'pending' ? (
            <div className="py-16 text-center bg-white rounded-3xl border-2 border-dashed border-emerald-200">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="font-black text-slate-800 text-base">
                🎉 Tuyệt vời! Cô Hảo đã hoàn tất nhận xét cho tất cả học sinh!
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Hiện không còn bài làm nào đang chờ nhận xét. Các em học sinh đã nhận được đầy đủ kết quả và lời phê của Cô.
              </p>
              {completedCount > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTab('graded')}
                  className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Xem Danh Sách Bài Đã Nhận Xét Xong ({completedCount})
                </button>
              )}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 italic text-xs">
              Không tìm thấy bài nộp nào phù hợp với bộ lọc.
            </div>
          )
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-black uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={
                        filteredSubmissions.length > 0 &&
                        selectedIds.length === filteredSubmissions.length
                      }
                      onChange={handleToggleSelectAll}
                      className="w-4 h-4 text-ocean-600 rounded cursor-pointer"
                      title="Chọn tất cả danh sách"
                    />
                  </th>
                  <th className="py-3 px-3">Học Sinh</th>
                  <th className="py-3 px-3">Lớp</th>
                  <th className="py-3 px-3">Bài Kiểm Tra</th>
                  <th className="py-3 px-3">Điểm Trắc Nghiệm</th>
                  <th className="py-3 px-3">Điểm Tự Luận</th>
                  <th className="py-3 px-3">Tổng Điểm</th>
                  <th className="py-3 px-3">Xếp Loại Học Lực</th>
                  <th className="py-3 px-3">Lời Nhận Xét Của Cô</th>
                  <th className="py-3 px-3 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSubmissions.map((sub) => {
                  const isPending = isSubmissionPending(sub);
                  const isWaitingGrading = sub.status === 'waiting_teacher_grading';
                  const maxTn = sub.max_score_tn !== undefined ? sub.max_score_tn : 10.0;
                  const maxTl = sub.max_score_tl !== undefined ? sub.max_score_tl : (sub.essay_question ? 3.0 : 0);
                  const maxTotal = sub.max_score || (maxTn + maxTl);
                  const perf = getPerformanceCategory(sub.score, maxTotal);
                  const isSelected = selectedIds.includes(sub.id);

                  return (
                    <tr
                      key={sub.id}
                      className={`hover:bg-slate-50/80 transition ${perf.rowBorderClass} ${
                        isSelected ? 'bg-ocean-50/60' : ''
                      }`}
                    >
                      <td className="py-3.5 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectOne(sub.id)}
                          className="w-4 h-4 text-ocean-600 rounded cursor-pointer"
                        />
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5 flex-wrap">
                          <span>{sub.student_name}</span>
                          {isTestSubmission(sub) && (
                            <span className="px-2 py-0.5 rounded-md text-[9px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                              🧪 Thi Thử
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">{sub.student_code}</div>
                      </td>
                      <td className="py-3.5 px-3 font-semibold text-slate-700">
                        {sub.class_name}
                      </td>
                      <td className="py-3.5 px-3 font-medium text-slate-800">
                        {sub.assignment_title}
                      </td>
                      <td className="py-3.5 px-3 font-bold text-ocean-700">
                        {sub.score_tn ?? sub.score} / {maxTn}đ
                      </td>
                      {/* Cột Điểm Tự Luận: Hiển thị 0% Tự Luận (0đ) khi không có phần tự luận */}
                      <td className="py-3.5 px-3">
                        {maxTl > 0 ? (
                          isWaitingGrading ? (
                            <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                              Chờ chấm ({maxTl}đ)
                            </span>
                          ) : (
                            <span className="font-bold text-purple-700">
                              {sub.score_tl ?? 0} / {maxTl}đ
                            </span>
                          )
                        ) : (
                          <span className="text-slate-600 font-bold bg-slate-100 px-2.5 py-1 rounded-lg text-[11px] border border-slate-200 inline-block">
                            0% Tự luận (0đ)
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 font-black text-sm text-slate-900">
                        {sub.score} <span className="text-xs text-slate-400 font-normal">/ {maxTotal}đ</span>
                      </td>
                      {/* Cột Xếp Loại Màu Học Lực */}
                      <td className="py-3.5 px-3">
                        <span
                          className={`font-bold px-2.5 py-1 rounded-full text-[11px] flex items-center gap-1 w-fit ${perf.badgeClass}`}
                        >
                          <span>{perf.icon}</span>
                          <span>{perf.label}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-3 max-w-xs">
                        {sub.teacher_feedback_text ? (
                          <span className="text-[11px] text-slate-700 line-clamp-1 italic bg-slate-100/70 px-2 py-1 rounded-lg">
                            "{sub.teacher_feedback_text}"
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                            ⏳ Chưa nhận xét
                          </span>
                        )}
                      </td>
                      {/* Cột Thao Tác: Nhận xét + Nút Xóa bài nộp */}
                      <td className="py-3.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openGradingModal(sub)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer ${
                              isPending
                                ? 'bg-gradient-to-r from-ocean-600 to-teal-600 hover:from-ocean-700 hover:to-teal-700 text-white'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                          >
                            {isPending ? 'Nhận Xét' : 'Xem Lời Phê'}
                          </button>

                          {/* Nút Xóa bài nộp này */}
                          <button
                            type="button"
                            onClick={() => handleDeleteSingle(sub.id, sub.student_name)}
                            className="p-1.5 rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 transition cursor-pointer"
                            title="Xóa bài nộp này để giải phóng dung lượng"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. MODAL NHẬN XÉT NHANH HÀNG LOẠT 1-CLICK */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-100 space-y-4 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <h3 className="font-black text-slate-900 text-base">
                  Nhận Xét Nhanh Cho {selectedIds.length} Học Sinh
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsBulkModalOpen(false)}
                className="text-xs font-bold text-slate-400 hover:text-slate-600 px-2 py-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                Đóng
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Cô hãy chọn một câu nhận xét mẫu có sẵn hoặc nhập nội dung tùy biến. Lời nhận xét sẽ được gửi đồng loạt tới <strong>{selectedIds.length}</strong> học sinh đã chọn:
            </p>

            {/* Các mẫu nhận xét nhanh theo nhóm */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-500">Mẫu nhận xét sư phạm gợi ý:</span>
              {BULK_PRESET_FEEDBACKS.map((preset, idx) => (
                <div
                  key={idx}
                  onClick={() => setBulkFeedbackText(preset.text)}
                  className={`p-2.5 rounded-xl border text-xs cursor-pointer transition flex items-start gap-2 ${
                    bulkFeedbackText === preset.text
                      ? 'bg-ocean-50/80 border-ocean-400 text-ocean-950 font-bold shadow-xs'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <span className="text-base">{preset.icon}</span>
                  <div className="flex-1">
                    <div className="text-[11px] font-black text-ocean-700">{preset.title}</div>
                    <div className="font-medium text-xs mt-0.5">{preset.text}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Ô nhập lời nhận xét tùy biến */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Hoặc chỉnh sửa lời nhận xét gửi chung:
              </label>
              <textarea
                rows={3}
                value={bulkFeedbackText}
                onChange={(e) => setBulkFeedbackText(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-300 text-xs text-slate-800 focus:ring-2 focus:ring-ocean-500"
                placeholder="Nhập lời phê chung cho cả nhóm..."
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsBulkModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                onClick={handleApplyBulkFeedback}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-ocean-600 to-teal-600 hover:from-ocean-700 hover:to-teal-700 text-white text-xs font-black rounded-xl shadow-md transition cursor-pointer active:scale-95"
              >
                <Send className="w-4 h-4" />
                Gửi Nhận Xét Cho {selectedIds.length} Học Sinh
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL CHẤM ĐIỂM TỰ LUẬN & GỬI LỜI PHÊ CÁ NHÂN */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl border border-slate-100 space-y-5 my-auto max-h-[92vh] overflow-y-auto">
            {/* Header Modal */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-black text-slate-900 text-base">
                  Nhận Xét & Chấm Bài: {selectedSubmission.student_name} ({selectedSubmission.class_name})
                </h3>
                <p className="text-xs text-slate-500 font-medium">{selectedSubmission.assignment_title}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSubmission(null)}
                className="text-xs font-bold text-slate-400 hover:text-slate-600 px-2 py-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                Đóng
              </button>
            </div>

            {/* Khung Điểm Trắc Nghiệm Tự Động */}
            <div className="p-3.5 bg-ocean-50/60 rounded-2xl border border-ocean-200 flex items-center justify-between">
              <div>
                <div className="text-xs font-black text-ocean-950">
                  Phần 1: Trắc Nghiệm Khách Quan
                </div>
                <div className="text-[11px] text-ocean-700">
                  Hệ thống đã tự động chấm điểm chính xác
                </div>
              </div>
              <div className="text-right">
                <span className="text-base font-black text-ocean-700">
                  {selectedSubmission.score_tn ?? selectedSubmission.score}
                </span>
                <span className="text-xs text-slate-500 font-bold">
                  {' '}/ {selectedSubmission.max_score_tn || 10} Điểm
                </span>
              </div>
            </div>

            {/* Khung Xem Bài Làm Tự Luận Của Học Sinh (Nếu có) */}
            {(selectedSubmission.max_score_tl > 0 || selectedSubmission.essay_question) && (
              <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-2.5">
                <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-purple-600" />
                  Phần 2: Câu Hỏi Tự Luận (Tối đa {selectedSubmission.max_score_tl || 3.0} điểm)
                </div>

                {selectedSubmission.essay_question && (
                  <div className="text-xs font-bold text-slate-700 bg-white/70 p-2.5 rounded-xl border border-slate-200">
                    Đề bài: {selectedSubmission.essay_question}
                  </div>
                )}

                <div className="text-xs text-slate-800 leading-relaxed font-normal bg-white p-3.5 rounded-xl border border-slate-200 whitespace-pre-line">
                  <LatexRenderer
                    content={
                      selectedSubmission.essay_answer ||
                      selectedSubmission.answers_json?.q_take_5 ||
                      'Học sinh đã nộp bài tự luận đầy đủ.'
                    }
                  />
                </div>
              </div>
            )}

            {/* Form Chấm Điểm Tự Luận và Nhận Xét Văn Bản */}
            <form onSubmit={handleSaveGrade} className="space-y-4">
              {/* Nhập Điểm Tự Luận & Xem Tổng Điểm */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                {(selectedSubmission.max_score_tl > 0 || selectedSubmission.essay_question) ? (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Điểm phần tự luận của Cô (Tối đa {selectedSubmission.max_score_tl || 3.0}đ):
                    </label>
                    <input
                      type="number"
                      step="0.25"
                      min="0"
                      max={selectedSubmission.max_score_tl || 10.0}
                      value={essayScore}
                      onChange={(e) => setEssayScore(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-black text-sm text-purple-700 focus:ring-2 focus:ring-ocean-500 bg-white"
                      required
                    />
                  </div>
                ) : (
                  <div>
                    <div className="text-xs font-bold text-slate-500 mb-1">Đề thi 100% Trắc nghiệm (0% Tự luận):</div>
                    <div className="text-xs font-bold text-emerald-700 bg-emerald-50 p-2 rounded-xl border border-emerald-200">
                      ✓ Không có tự luận (0% Tự luận - 0đ)
                    </div>
                  </div>
                )}

                <div className="flex flex-col justify-center sm:text-right pt-1 sm:pt-0">
                  <div className="text-xs font-bold text-slate-500">
                    Tổng điểm bài làm:
                  </div>
                  <div className="text-2xl font-black text-slate-900">
                    {calculatedTotalScore}{' '}
                    <span className="text-xs font-bold text-slate-500">
                      / {selectedSubmission.max_score || 10} Điểm
                    </span>
                  </div>
                </div>
              </div>

              {/* Nhận Xét Bằng Văn Bản (Lời phê của Cô Hảo) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Lời phê & Nhận xét của Cô Hảo (Gửi tới học sinh):
                  </label>
                  <span className="text-[11px] text-slate-400">Học sinh xem ngay trên kết quả</span>
                </div>
                <textarea
                  rows={3}
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Nhập lời nhận xét hoặc bấm chọn gợi ý nhanh bên dưới..."
                  className="w-full p-3 rounded-xl border border-slate-300 text-xs text-slate-800 focus:ring-2 focus:ring-ocean-500"
                />

                {/* Các nút nhận xét nhanh sư phạm */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-[11px] font-bold text-slate-500">Gợi ý nhanh:</span>
                  {PRESET_FEEDBACKS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setFeedbackText(preset)}
                      className="text-[10px] font-semibold px-2.5 py-1 bg-slate-100 hover:bg-ocean-100 hover:text-ocean-800 text-slate-700 rounded-lg transition cursor-pointer"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Trao Tặng Huy Hiệu Danh Dự Cho Học Sinh (Cô bật sáng huy hiệu nào thì bên học sinh sáng huy hiệu đó) */}
              <div className="bg-gradient-to-r from-amber-50/70 to-orange-50/50 p-4 rounded-2xl border border-amber-200/80 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-600" />
                    <span className="font-bold text-xs text-amber-950">
                      Trao Tặng Huy Hiệu Khen Thưởng Cho {selectedSubmission.student_name}:
                    </span>
                  </div>
                  <span className="text-[11px] text-amber-800 font-medium">
                    (Cô bấm vào huy hiệu để Bật/Tắt - bên học sinh sẽ sáng ngay)
                  </span>
                </div>

                <BadgeList
                  unlockedBadgeIds={getStudentBadges(
                    selectedSubmission.student_code || selectedSubmission.student_name,
                    selectedSubmission.student_name
                  )}
                  onToggleBadge={(badgeId) => {
                    toggleBadgeForStudent(
                      selectedSubmission.student_code || selectedSubmission.student_name,
                      badgeId,
                      selectedSubmission.student_name
                    );
                    setGradingBadgeRefresh((k) => k + 1);
                  }}
                  isTeacherMode={true}
                />
              </div>

              {/* Nút Lưu Kết Quả & Nút Xóa Bài Trong Modal */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    handleDeleteSingle(selectedSubmission.id, selectedSubmission.student_name);
                    setSelectedSubmission(null);
                  }}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Xóa Bài Nộp Này
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedSubmission(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    Hủy Bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex items-center gap-1.5 px-6 py-2.5 bg-gradient-to-r from-ocean-600 to-teal-600 hover:from-ocean-700 hover:to-teal-700 active:scale-95 text-white text-xs font-black rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    {isSaving ? 'Đang Lưu...' : 'Lưu Điểm & Gửi Nhận Xét'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
