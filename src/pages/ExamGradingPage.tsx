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
  RotateCw,
  Volume2,
  VolumeX,
  Download,
  LayoutGrid,
  List,
  FolderOpen,
  BookOpen,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  Folder,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { StudentResult, Question, ClassItem } from '../types/database';
import { INITIAL_CLASSES } from '../data/studentsData';
import { LatexRenderer } from '../components/common/LatexRenderer';
import { triggerCelebration } from '../lib/gamification';
import { BadgeList } from '../components/common/BadgeList';
import { getStudentBadges, toggleBadgeForStudent } from '../data/badgeService';
import {
  fetchStudentSubmissionsFromCloud,
  fetchAssignmentsFromCloud,
  saveAllSubmissionsToCloud,
  saveAssignmentsToCloud,
} from '../lib/assignmentCloudSync';
import { playSoftClick, playSubmissionNotificationSound, isSoundEnabled, toggleSoundEnabled } from '../utils/soundEffects';
import { formatSubmissionDisplayTime } from '../utils/formatDate';

// Danh sách bài nộp mẫu của học sinh (Rỗng ban đầu khi giáo viên chưa giao đề thi)
const DEFAULT_SUBMISSIONS: any[] = [];

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

// Xác định bài nộp cần được nhận xét / chấm điểm
export function isSubmissionPending(sub: any): boolean {
  if (!sub) return false;
  const hasFeedback = Boolean(sub.teacher_feedback_text && sub.teacher_feedback_text.trim().length > 0);
  const isWaitingGrading = sub.status === 'waiting_teacher_grading';
  return isWaitingGrading || !hasFeedback;
}

export const ExamGradingPage: React.FC = () => {
  const [searchParams] = useSearchParams();

  // Đọc danh sách bài nộp từ LocalStorage
  const [submissions, setSubmissions] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('geo_student_submissions');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // Lọc bỏ toàn bộ bài nộp gắn liền với các bài mẫu mặc định cũ
          const cleaned = parsed.filter(
            (s: any) => !['asg_1', 'asg_2', 'asg_3', 'asg_4'].includes(s.assignment_id)
          );
          if (cleaned.length !== parsed.length) {
            localStorage.setItem('geo_student_submissions', JSON.stringify(cleaned));
          }
          return cleaned;
        }
      }
    } catch (e) {
      console.warn('Lỗi đọc submissions:', e);
    }
    return [];
  });

  // Đọc danh sách các đợt giao bài từ LocalStorage và Cloud
  const [assignmentsList, setAssignmentsList] = useState<any[]>(() => {
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

  // Tự động đồng bộ các bài nộp từ học sinh và đợt giao bài từ Supabase Cloud
  useEffect(() => {
    async function syncGradingCloud() {
      const [cloudSubs, cloudAsgs] = await Promise.all([
        fetchStudentSubmissionsFromCloud(),
        fetchAssignmentsFromCloud(),
      ]);
      if (cloudSubs && cloudSubs.length > 0) {
        setSubmissions(cloudSubs);
      }
      if (cloudAsgs && cloudAsgs.length > 0) {
        setAssignmentsList(cloudAsgs);
      }
    }
    syncGradingCloud();
  }, []);

  const saveSubmissions = (newSubs: any[]) => {
    setSubmissions(newSubs);
    saveAllSubmissionsToCloud(newSubs);

    // Cập nhật lại số lượng bài nộp submissions_count cho các đề thi
    try {
      const savedAsgs = localStorage.getItem('geo_assignments');
      if (savedAsgs) {
        const asgs = JSON.parse(savedAsgs);
        const updatedAsgs = asgs.map((a: any) => {
          const realSubsCount = newSubs.filter((s: any) => s.assignment_id === a.id).length;
          return {
            ...a,
            submissions_count: realSubsCount,
          };
        });
        saveAssignmentsToCloud(updatedAsgs);
      }
    } catch (e) {
      console.warn(e);
    }
  };

  const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null);
  const [soundActive, setSoundActive] = useState<boolean>(() => isSoundEnabled());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<string>('Vừa xong');

  // Danh sách lớp học thực tế để hỗ trợ lọc theo khối & lớp
  const [classesList] = useState<ClassItem[]>(() => {
    try {
      const saved = localStorage.getItem('geo_classes_list');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_CLASSES;
  });

  // Tab phân loại: 'pending' (Cần nhận xét), 'graded' (Đã xong), 'all' (Tất cả)
  const [activeTab, setActiveTab] = useState<'pending' | 'graded' | 'all'>('pending');

  // Chế độ xem: 'grouped' (Gom nhóm theo từng Đề thi - Mặc định) hoặc 'table' (Bảng danh sách tổng hợp)
  const [viewMode, setViewMode] = useState<'grouped' | 'table'>('grouped');

  // Danh sách các ID đề thi đang được mở rộng trong chế độ gom nhóm
  const [expandedAssignmentIds, setExpandedAssignmentIds] = useState<Set<string>>(() => {
    const fromUrl = searchParams.get('assignmentId');
    if (fromUrl && fromUrl !== 'all') return new Set([fromUrl]);
    return new Set();
  });

  // Bộ lọc lớp con cho từng đề thi cụ thể trong chế độ gom nhóm: Record<assignmentId, className>
  const [assignmentClassSubFilter, setAssignmentClassSubFilter] = useState<Record<string, string>>({});

  // Chế độ hiển thị mật độ bảng: gọn nhẹ (compact) hoặc tiêu chuẩn
  const [isCompactDensity, setIsCompactDensity] = useState<boolean>(true);

  // Bộ lọc đợt giao bài / đề thi
  const [assignmentFilter, setAssignmentFilter] = useState<string>(() => {
    const fromUrl = searchParams.get('assignmentId');
    if (fromUrl) return fromUrl;
    try {
      const saved = localStorage.getItem('geo_last_grading_assignment');
      if (saved) return saved;
    } catch (e) {}
    return 'all';
  });

  const [gradeFilter, setGradeFilter] = useState<number | 'all'>('all');
  const [classFilter, setClassFilter] = useState<string>('all');
  const [scoreFilter, setScoreFilter] = useState<string>('all'); // Bộ lọc học lực
  const [lateFilter, setLateFilter] = useState<'all' | 'late_only' | 'on_time_only'>('all'); // Bộ lọc nộp đúng hạn / nộp muộn
  const [testTypeFilter, setTestTypeFilter] = useState<'all' | 'real_only' | 'test_only'>('all'); // Lọc bài thi thật vs bài thi thử
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Danh sách các Đề thi thực tế có trong hệ thống hoặc có bài nộp
  const availableAssignments = useMemo(() => {
    const map = new Map<string, any>();

    // 1. Thêm từ danh sách đề thi chính thức
    assignmentsList.forEach((a) => {
      if (a.id && !['asg_1', 'asg_2', 'asg_3', 'asg_4'].includes(a.id)) {
        map.set(a.id, {
          id: a.id,
          title: a.title,
          grade: a.grade || 7,
          target_ids: a.target_ids || [],
          total_points: a.total_points || 10,
          deadline: a.deadline,
          created_at: a.created_at || a.start_time,
        });
      }
    });

    // 2. Thêm từ danh sách bài nộp thực tế nếu chưa có trong map
    submissions.forEach((s) => {
      if (s.assignment_id && !['asg_1', 'asg_2', 'asg_3', 'asg_4'].includes(s.assignment_id)) {
        if (!map.has(s.assignment_id)) {
          const gradeMatch = s.class_name ? s.class_name.match(/\d+/) : null;
          const grade = gradeMatch ? parseInt(gradeMatch[0].charAt(0)) : 7;
          map.set(s.assignment_id, {
            id: s.assignment_id,
            title: s.assignment_title || 'Bài kiểm tra Địa lí',
            grade: grade,
            target_ids: s.class_name ? [s.class_name] : [],
            total_points: s.max_score || 10,
            created_at: s.created_at,
          });
        }
      }
    });

    // Tính toán số lượng bài nộp cho từng đề thi
    const list = Array.from(map.values()).map((asg) => {
      const asgSubs = submissions.filter((s) => s.assignment_id === asg.id);
      const pending = asgSubs.filter((s) => isSubmissionPending(s)).length;
      const graded = asgSubs.filter((s) => !isSubmissionPending(s)).length;
      const late = asgSubs.filter((s) => s.is_late).length;
      const avg = asgSubs.length > 0
        ? (asgSubs.reduce((acc, s) => acc + (Number(s.score) || 0), 0) / asgSubs.length).toFixed(1)
        : '0';

      return {
        ...asg,
        submissions_count: asgSubs.length,
        pending_count: pending,
        graded_count: graded,
        late_count: late,
        avg_score: avg,
      };
    });

    return list;
  }, [assignmentsList, submissions]);

  // Tự động mở rộng đề thi đầu tiên có bài chờ chấm nếu chưa mở đề nào
  useEffect(() => {
    if (availableAssignments.length > 0 && expandedAssignmentIds.size === 0) {
      if (assignmentFilter !== 'all') {
        setExpandedAssignmentIds(new Set([assignmentFilter]));
      } else {
        const firstPending = availableAssignments.find((a) => a.pending_count > 0) || availableAssignments[0];
        if (firstPending) {
          setExpandedAssignmentIds(new Set([firstPending.id]));
        }
      }
    }
  }, [availableAssignments, assignmentFilter]);

  // Bật / Tắt mở rộng cho 1 đề thi
  const toggleExpandAssignment = (asgId: string) => {
    setExpandedAssignmentIds((prev) => {
      const next = new Set(prev);
      if (next.has(asgId)) {
        next.delete(asgId);
      } else {
        next.add(asgId);
      }
      return next;
    });
  };

  const handleExpandAll = () => {
    setExpandedAssignmentIds(new Set(availableAssignments.map((a) => a.id)));
  };

  const handleCollapseAll = () => {
    setExpandedAssignmentIds(new Set());
  };

  // Xử lý chọn đề thi và ghi nhớ lựa chọn
  const handleSelectAssignment = (asgId: string) => {
    setAssignmentFilter(asgId);
    try {
      localStorage.setItem('geo_last_grading_assignment', asgId);
    } catch (e) {}
    if (asgId !== 'all') {
      setExpandedAssignmentIds((prev) => new Set([...prev, asgId]));
    }
  };

  // Xuất file Excel danh sách điểm & nhận xét cho một đề thi cụ thể
  const handleExportExcelForAssignment = (asgTitle: string, subsToExport: any[]) => {
    if (subsToExport.length === 0) {
      alert('Không có bài nộp nào trong đề thi này để xuất Excel.');
      return;
    }

    const data = subsToExport.map((sub, index) => {
      const perf = getPerformanceCategory(sub.score, sub.max_score || 10);
      return {
        'STT': index + 1,
        'Mã Học Sinh': sub.student_code || '',
        'Họ và Tên': sub.student_name || '',
        'Lớp': sub.class_name || '',
        'Tên Bài Kiểm Tra': sub.assignment_title || asgTitle || '',
        'Điểm Trắc Nghiệm': sub.score_tn ?? sub.score ?? 0,
        'Điểm Tự Luận': sub.score_tl ?? 0,
        'Tổng Điểm': sub.score ?? 0,
        'Xếp Loại Học Lực': perf.label,
        'Trạng Thái Nộp': sub.is_late ? `Nộp muộn (${sub.late_minutes ? `${sub.late_minutes}p` : ''})` : 'Đúng hạn',
        'Thời Gian Nộp': formatSubmissionDisplayTime(sub),
        'Lời Nhận Xét Của Cô': sub.teacher_feedback_text || 'Chưa nhận xét',
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'BangDiem');
    const cleanTitle = (asgTitle || 'BangDiem').replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF]/g, '_');
    const fileName = `BangDiem_${cleanTitle}_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  // Danh sách các lớp khả dụng theo Khối đang chọn
  const availableClasses = useMemo(() => {
    if (gradeFilter === 'all') return classesList;
    return classesList.filter((c) => c.grade === Number(gradeFilter));
  }, [classesList, gradeFilter]);

  // Xử lý khi chọn đổi Khối -> Reset lại bộ lọc lớp
  const handleGradeChange = (newGrade: number | 'all') => {
    setGradeFilter(newGrade);
    setClassFilter('all');
  };

  // Nút Làm Mới Dữ Liệu 1-Click (Đồng bộ tức thì từ Supabase Cloud)
  const handleManualRefresh = async () => {
    setIsSyncing(true);
    try {
      const [cloudSubs, cloudAsgs] = await Promise.all([
        fetchStudentSubmissionsFromCloud(),
        fetchAssignmentsFromCloud(),
      ]);
      if (cloudSubs && Array.isArray(cloudSubs)) {
        setSubmissions(
          cloudSubs.filter((s: any) => !['asg_1', 'asg_2', 'asg_3', 'asg_4'].includes(s.assignment_id))
        );
      }
      if (cloudAsgs && Array.isArray(cloudAsgs)) {
        setAssignmentsList(
          cloudAsgs.filter((a: any) => !['asg_1', 'asg_2', 'asg_3', 'asg_4'].includes(a.id))
        );
      }
      const now = new Date();
      setLastSyncedTime(
        `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`
      );
    } catch (err) {
      console.warn('Lỗi làm mới dữ liệu:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Danh sách bài nộp theo bài kiểm tra / khối / lớp đang chọn
  const scopedSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      // 1. Lọc theo Đợt giao bài
      if (assignmentFilter !== 'all' && sub.assignment_id && sub.assignment_id !== assignmentFilter) {
        return false;
      }
      // 2. Lọc theo Khối
      if (gradeFilter !== 'all') {
        const asg = assignmentsList.find((a) => a.id === sub.assignment_id);
        const gradeMatch = sub.class_name ? sub.class_name.match(/\d+/) : null;
        const gradeNum = gradeMatch ? parseInt(gradeMatch[0].charAt(0)) : null;
        const targetGrade = asg?.grade || gradeNum;
        if (targetGrade !== gradeFilter) return false;
      }
      // 3. Lọc theo Lớp
      if (classFilter !== 'all' && sub.class_name !== classFilter) {
        return false;
      }
      return true;
    });
  }, [submissions, assignmentFilter, gradeFilter, classFilter, assignmentsList]);

  // Đếm tổng số bài thi thử của học sinh mẫu theo bộ lọc đang xem
  const testSubmissionsCount = useMemo(() => {
    return scopedSubmissions.filter((s) => isTestSubmission(s)).length;
  }, [scopedSubmissions]);

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

  // Tổng số lượng bài theo từng tab (Khớp 100% với đợt kiểm tra và lớp học đang chọn)
  const pendingCount = useMemo(() => {
    return scopedSubmissions.filter((s) => isSubmissionPending(s)).length;
  }, [scopedSubmissions]);

  const completedCount = useMemo(() => {
    return scopedSubmissions.filter((s) => !isSubmissionPending(s)).length;
  }, [scopedSubmissions]);

  const allScopedCount = useMemo(() => {
    return scopedSubmissions.length;
  }, [scopedSubmissions]);

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

  // Lọc bài nộp theo Tab, đợt giao bài, khối, lớp, học lực, nộp muộn, loại bài (thật/thử), từ khóa
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      // 1. Lọc theo Tab chính
      if (activeTab === 'pending' && !isSubmissionPending(sub)) return false;
      if (activeTab === 'graded' && isSubmissionPending(sub)) return false;

      // 2. Lọc theo Đợt giao bài
      if (assignmentFilter !== 'all' && sub.assignment_id && sub.assignment_id !== assignmentFilter) {
        return false;
      }

      // 3. Lọc theo Khối
      if (gradeFilter !== 'all') {
        const asg = assignmentsList.find((a) => a.id === sub.assignment_id);
        const gradeMatch = sub.class_name ? sub.class_name.match(/\d+/) : null;
        const gradeNum = gradeMatch ? parseInt(gradeMatch[0].charAt(0)) : null;
        const targetGrade = asg?.grade || gradeNum;
        if (targetGrade !== gradeFilter) return false;
      }

      // 4. Lọc theo Lớp
      if (classFilter !== 'all' && sub.class_name !== classFilter) return false;

      // 5. Lọc theo Trạng thái Nộp muộn / Đúng hạn
      if (lateFilter === 'late_only' && !sub.is_late) return false;
      if (lateFilter === 'on_time_only' && sub.is_late) return false;

      // 6. Lọc theo Học Lực
      if (scoreFilter !== 'all') {
        const perf = getPerformanceCategory(sub.score, sub.max_score || 10);
        if (perf.categoryKey !== scoreFilter) return false;
      }

      // 7. Lọc theo Bài thi thật vs Bài thi thử
      if (testTypeFilter === 'real_only' && isTestSubmission(sub)) return false;
      if (testTypeFilter === 'test_only' && !isTestSubmission(sub)) return false;

      // 8. Lọc theo Từ khóa tìm kiếm
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchName = sub.student_name?.toLowerCase().includes(term);
        const matchTitle = sub.assignment_title?.toLowerCase().includes(term);
        const matchCode = sub.student_code?.toLowerCase().includes(term);
        if (!matchName && !matchTitle && !matchCode) return false;
      }

      return true;
    });
  }, [submissions, activeTab, assignmentFilter, gradeFilter, classFilter, lateFilter, scoreFilter, testTypeFilter, searchTerm, assignmentsList]);

  // Danh sách các đề thi cần hiển thị theo bộ lọc đang chọn
  const filteredAssignmentsToDisplay = useMemo(() => {
    return availableAssignments.filter((asg) => {
      // 1. Lọc theo đợt giao bài đang chọn
      if (assignmentFilter !== 'all' && asg.id !== assignmentFilter) {
        return false;
      }
      // 2. Lọc theo Khối
      if (gradeFilter !== 'all' && asg.grade !== gradeFilter) {
        return false;
      }
      return true;
    });
  }, [availableAssignments, assignmentFilter, gradeFilter]);

  // Hàm render bảng danh sách bài nộp với hỗ trợ Mật Độ Gọn Nhẹ và Tự Động Ẩn Cột Tự Luận
  const renderSubmissionTable = (
    subsList: any[],
    showAssignmentColumn: boolean = true,
    customShowEssay?: boolean
  ) => {
    if (subsList.length === 0) {
      if (activeTab === 'pending') {
        return (
          <div className="py-10 text-center bg-white rounded-2xl border-2 border-dashed border-emerald-200 p-6">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h4 className="font-black text-slate-800 text-sm">
              🎉 Đã hoàn tất nhận xét cho toàn bộ học sinh trong mục này!
            </h4>
            <p className="text-xs text-slate-500 mt-0.5 max-w-md mx-auto">
              Không còn bài làm nào đang chờ chấm. Học sinh đã nhận được điểm số và lời nhận xét đầy đủ.
            </p>
          </div>
        );
      }
      return (
        <div className="py-8 text-center text-slate-400 italic text-xs bg-slate-50/60 rounded-2xl border border-slate-200">
          Không tìm thấy bài nộp nào phù hợp với các tiêu chí lọc đang chọn.
        </div>
      );
    }

    // Tự động phát hiện xem danh sách có bài nào có câu hỏi tự luận không
    const hasAnyEssay =
      customShowEssay !== undefined
        ? customShowEssay
        : subsList.some(
            (s) => (s.max_score_tl !== undefined ? s.max_score_tl > 0 : Boolean(s.essay_question))
          );

    const isAllSelectedInList =
      subsList.length > 0 && subsList.every((s) => selectedIds.includes(s.id));

    const toggleSelectAllInList = () => {
      if (isAllSelectedInList) {
        const listIds = subsList.map((s) => s.id);
        setSelectedIds((prev) => prev.filter((id) => !listIds.includes(id)));
      } else {
        const listIds = subsList.map((s) => s.id);
        setSelectedIds((prev) => Array.from(new Set([...prev, ...listIds])));
      }
    };

    const padTh = isCompactDensity ? 'py-2 px-2.5 text-[11px]' : 'py-3 px-3 text-xs';
    const padTd = isCompactDensity ? 'py-2 px-2.5 text-xs' : 'py-3.5 px-3 text-xs';

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-600 font-black uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th className={`${padTh} w-9 text-center`}>
                <input
                  type="checkbox"
                  checked={isAllSelectedInList}
                  onChange={toggleSelectAllInList}
                  className="w-3.5 h-3.5 text-ocean-600 rounded cursor-pointer"
                  title="Chọn tất cả bài nộp trong danh sách này"
                />
              </th>
              <th className={padTh}>Học Sinh</th>
              <th className={padTh}>Lớp</th>
              {showAssignmentColumn && <th className={padTh}>Bài Kiểm Tra</th>}
              <th className={padTh}>Điểm TN</th>
              {hasAnyEssay && <th className={padTh}>Điểm TL</th>}
              <th className={padTh}>Tổng Điểm</th>
              <th className={padTh}>Xếp Loại</th>
              <th className={padTh}>Lời Nhận Xét Của Cô</th>
              <th className={`${padTh} text-right`}>Thao Tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {subsList.map((sub) => {
              const isPending = isSubmissionPending(sub);
              const isWaitingGrading = sub.status === 'waiting_teacher_grading';
              const maxTn = sub.max_score_tn !== undefined ? sub.max_score_tn : 10.0;
              const maxTl =
                sub.max_score_tl !== undefined ? sub.max_score_tl : sub.essay_question ? 3.0 : 0;
              const maxTotal = sub.max_score || maxTn + maxTl;
              const perf = getPerformanceCategory(sub.score, maxTotal);
              const isSelected = selectedIds.includes(sub.id);
              const displayTime = formatSubmissionDisplayTime(sub);

              return (
                <tr
                  key={sub.id}
                  className={`hover:bg-slate-50/80 transition ${perf.rowBorderClass} ${
                    isSelected ? 'bg-ocean-50/60' : ''
                  }`}
                >
                  <td className={`${padTd} text-center`}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleSelectOne(sub.id)}
                      className="w-3.5 h-3.5 text-ocean-600 rounded cursor-pointer"
                    />
                  </td>
                  <td className={padTd}>
                    <div className="font-bold text-slate-900 flex items-center gap-1.5 flex-wrap">
                      <span>{sub.student_name}</span>
                      {sub.is_late && (
                        <span
                          className="px-1.5 py-0.2 rounded text-[9px] font-black bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-0.5"
                          title={`Học sinh nộp bài sau thời hạn quy định ${sub.late_minutes ? `(${sub.late_minutes} phút)` : ''}`}
                        >
                          <AlertTriangle className="w-2.5 h-2.5 text-rose-600" />
                          Nộp muộn
                        </span>
                      )}
                      {isTestSubmission(sub) && (
                        <span className="px-1.5 py-0.2 rounded text-[8.5px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                          🧪 Thi Thử
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                      <span>{sub.student_code}</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-slate-500 font-sans font-medium flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5 text-slate-400" />
                        {displayTime}
                      </span>
                    </div>
                  </td>
                  <td className={`${padTd} font-semibold text-slate-700`}>
                    <span className="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-md border border-slate-200">
                      {sub.class_name}
                    </span>
                  </td>
                  {showAssignmentColumn && (
                    <td
                      className={`${padTd} font-medium text-slate-800 max-w-[180px] truncate`}
                      title={sub.assignment_title}
                    >
                      {sub.assignment_title}
                    </td>
                  )}
                  <td className={`${padTd} font-bold text-ocean-700`}>
                    {sub.score_tn ?? sub.score} / {maxTn}đ
                  </td>
                  {hasAnyEssay && (
                    <td className={padTd}>
                      {maxTl > 0 ? (
                        isWaitingGrading ? (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-md">
                            Chờ chấm ({maxTl}đ)
                          </span>
                        ) : (
                          <span className="font-bold text-purple-700">
                            {sub.score_tl ?? 0} / {maxTl}đ
                          </span>
                        )
                      ) : (
                        <span className="text-slate-400 text-[10.5px]">0đ</span>
                      )}
                    </td>
                  )}
                  <td className={`${padTd} font-black text-slate-900`}>
                    {sub.score}{' '}
                    <span className="text-[10px] text-slate-400 font-normal">/ {maxTotal}đ</span>
                  </td>
                  <td className={padTd}>
                    <span
                      className={`font-bold px-2 py-0.5 rounded-full text-[10.5px] flex items-center gap-1 w-fit ${perf.badgeClass}`}
                    >
                      <span>{perf.icon}</span>
                      <span>{perf.label}</span>
                    </span>
                  </td>
                  <td className={`${padTd} max-w-xs`}>
                    {sub.teacher_feedback_text ? (
                      <span
                        className="text-[11px] text-slate-700 line-clamp-1 italic bg-slate-100/70 px-2 py-0.5 rounded-md"
                        title={sub.teacher_feedback_text}
                      >
                        "{sub.teacher_feedback_text}"
                      </span>
                    ) : (
                      <span className="text-[10.5px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-md">
                        ⏳ Chưa nhận xét
                      </span>
                    )}
                  </td>
                  <td className={`${padTd} text-right`}>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => openGradingModal(sub)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition shadow-2xs cursor-pointer ${
                          isPending
                            ? 'bg-gradient-to-r from-ocean-600 to-teal-600 hover:from-ocean-700 hover:to-teal-700 text-white'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        {isPending ? 'Nhận Xét' : 'Xem Lời Phê'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteSingle(sub.id, sub.student_name)}
                        className="p-1 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 transition cursor-pointer"
                        title="Xóa bài nộp này để giải phóng dung lượng"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

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
            Kết quả học sinh được phân loại theo từng bài kiểm tra • Hỗ trợ xuất Excel và dọn dẹp dung lượng
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Nút Làm Mới Dữ Liệu 1-Click (Gợi ý 2) */}
          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl bg-ocean-50 hover:bg-ocean-100 border border-ocean-200 text-ocean-800 text-xs font-bold transition cursor-pointer active:scale-95 disabled:opacity-60 shadow-2xs"
            title="Bấm để đồng bộ và cập nhật ngay bài nộp mới nhất từ máy chủ đám mây"
          >
            <RotateCw className={`w-3.5 h-3.5 text-ocean-600 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Đang đồng bộ...' : 'Làm Mới Dữ Liệu'}</span>
            <span className="text-[10px] text-ocean-600 font-normal hidden sm:inline">({lastSyncedTime})</span>
          </button>

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

      {/* 2. THANH CHỌN ĐỀ THI TRỰC QUAN (EXAM CARDS / TABS CAROUSEL) */}
      <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-ocean-600" />
            <h2 className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-wider">
              Chọn Đề Thi Để Xem Kết Quả ({availableAssignments.length} Đề)
            </h2>
          </div>
          <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
            Bấm chọn 1 đề để tự động xếp gọn bài làm của đề đó
          </span>
        </div>

        <div className="flex items-stretch gap-3 overflow-x-auto pb-2 pt-1 scrollbar-thin">
          {/* Thẻ: Tất Cả Đề Thi */}
          <div
            onClick={() => handleSelectAssignment('all')}
            className={`min-w-[210px] sm:min-w-[230px] p-3.5 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between select-none ${
              assignmentFilter === 'all'
                ? 'bg-gradient-to-br from-ocean-50 to-teal-50/60 border-ocean-600 shadow-md ring-2 ring-ocean-200'
                : 'bg-slate-50/70 border-slate-200 hover:border-ocean-300 hover:bg-slate-100/70'
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase text-ocean-700 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5" /> Tất Cả Đề
                </span>
                <span className="text-[11px] font-black bg-white px-2 py-0.5 rounded-full border border-slate-200 text-slate-700">
                  {submissions.length} bài nộp
                </span>
              </div>
              <div className="font-black text-slate-900 text-xs sm:text-sm mt-1.5 line-clamp-1">
                Tổng Hợp Toàn Bộ
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Hiển thị mọi đợt kiểm tra
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs">
              {pendingCount > 0 ? (
                <span className="text-amber-800 font-black flex items-center gap-1 text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  {pendingCount} bài chờ chấm
                </span>
              ) : (
                <span className="text-emerald-700 font-bold text-[11px]">✓ Đã chấm xong</span>
              )}
              <span className="text-slate-400 font-mono text-[10px]">
                {availableAssignments.length} đề thi
              </span>
            </div>
          </div>

          {/* Danh sách thẻ cho từng Đề thi */}
          {availableAssignments.map((asg) => {
            const isSelected = assignmentFilter === asg.id;
            return (
              <div
                key={asg.id}
                onClick={() => handleSelectAssignment(asg.id)}
                className={`min-w-[260px] sm:min-w-[280px] p-3.5 rounded-2xl border-2 transition cursor-pointer flex flex-col justify-between select-none ${
                  isSelected
                    ? 'bg-gradient-to-br from-ocean-50 to-teal-50/60 border-ocean-600 shadow-md ring-2 ring-ocean-200'
                    : 'bg-slate-50/70 border-slate-200 hover:border-ocean-300 hover:bg-slate-100/70'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-black uppercase text-ocean-700 bg-ocean-100/80 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <BookOpen className="w-3 h-3" /> Khối {asg.grade}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const subsForThis = submissions.filter((s) => s.assignment_id === asg.id);
                        handleExportExcelForAssignment(asg.title, subsForThis);
                      }}
                      className="text-[10.5px] font-bold text-ocean-700 hover:text-ocean-900 bg-white hover:bg-ocean-50 border border-ocean-200 px-2 py-0.5 rounded-lg flex items-center gap-1 transition shadow-2xs cursor-pointer"
                      title="Tải bảng điểm Excel của đề thi này"
                    >
                      <Download className="w-3 h-3" /> Excel
                    </button>
                  </div>
                  <div className="font-black text-slate-900 text-xs sm:text-sm mt-1.5 line-clamp-1" title={asg.title}>
                    {asg.title}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2 flex-wrap">
                    <span>ĐTB: <strong className="text-slate-800">{asg.avg_score}đ</strong></span>
                    <span>•</span>
                    <span>Đã nộp: <strong className="text-slate-800">{asg.submissions_count}</strong> bài</span>
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px]">
                  {asg.pending_count > 0 ? (
                    <span className="text-amber-800 font-black bg-amber-100/80 px-2 py-0.5 rounded-md flex items-center gap-1 text-[10.5px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
                      {asg.pending_count} chờ chấm
                    </span>
                  ) : asg.submissions_count > 0 ? (
                    <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md text-[10.5px]">
                      ✓ Đã chấm {asg.graded_count}/{asg.submissions_count}
                    </span>
                  ) : (
                    <span className="text-slate-400 italic text-[10.5px]">Chưa có bài nộp</span>
                  )}

                  {isSelected ? (
                    <span className="text-ocean-700 font-black flex items-center gap-0.5 text-xs">
                      Đang xem <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  ) : (
                    <span className="text-slate-400 hover:text-slate-600 text-[11px]">
                      Bấm chọn
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2.2. THANH CHỌN LỚP NHANH TOÀN CỤC (GLOBAL CLASS PILLS SELECTOR) */}
      <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-2xs space-y-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 font-black text-slate-700">
            <Users className="w-4 h-4 text-ocean-600" />
            <span>Lọc Nhanh Theo Lớp Học ({classesList.length} Lớp):</span>
          </div>
          <span className="text-[11px] text-slate-400">
            Bấm 1 click để chỉ xem học sinh của đúng lớp đó
          </span>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin flex-wrap sm:flex-nowrap">
          <button
            type="button"
            onClick={() => setClassFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer shrink-0 ${
              classFilter === 'all'
                ? 'bg-ocean-600 text-white shadow-xs ring-2 ring-ocean-200'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
            }`}
          >
            🏫 Tất Cả ({classesList.length} Lớp)
          </button>
          {classesList.map((c) => {
            const isSelected = classFilter === c.name;
            const classSubCount = submissions.filter((s) => s.class_name === c.name).length;
            return (
              <button
                key={c.id || c.name}
                type="button"
                onClick={() => {
                  setClassFilter(c.name);
                  if (c.grade && gradeFilter !== 'all' && gradeFilter !== c.grade) {
                    setGradeFilter('all');
                  }
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-ocean-600 text-white shadow-xs ring-2 ring-ocean-200 font-black'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                <span>{c.name}</span>
                {classSubCount > 0 && (
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-black ${
                      isSelected ? 'bg-white/30 text-white' : 'bg-ocean-100 text-ocean-800'
                    }`}
                  >
                    {classSubCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. TAB PHÂN LOẠI TRẠNG THÁI VÀ CHUYỂN ĐỔI CHẾ ĐỘ XEM */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2 overflow-x-auto">
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
            <span>Tất Cả ({allScopedCount})</span>
          </button>
        </div>

        {/* Nút chuyển đổi Chế độ xem: Gom nhóm vs Bảng tổng hợp & Đổi mật độ hiển thị */}
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
          {/* Nút đổi mật độ: Gọn nhẹ / Tiêu chuẩn */}
          <button
            type="button"
            onClick={() => setIsCompactDensity((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
              isCompactDensity
                ? 'bg-ocean-50 border-ocean-300 text-ocean-800'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
            title="Bật/Tắt chế độ hiển thị siêu gọn nhẹ để nhìn được nhiều học sinh trên 1 màn hình"
          >
            {isCompactDensity ? (
              <>
                <Minimize2 className="w-3.5 h-3.5 text-ocean-600" />
                <span>Mật Độ: Gọn Nhẹ</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Mật Độ: Tiêu Chuẩn</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => setViewMode('grouped')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                viewMode === 'grouped'
                  ? 'bg-white text-ocean-800 shadow-xs ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Xếp kết quả học sinh theo từng đề thi riêng biệt"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-ocean-600" />
              <span>Xếp Theo Đề Thi</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-ocean-800 shadow-xs ring-1 ring-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Xem toàn bộ bài nộp trên một bảng duy nhất"
            >
              <List className="w-3.5 h-3.5 text-slate-600" />
              <span>Bảng Tổng Hợp</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. BỘ LỌC TÌM KIẾM THEO KHỐI, LỚP, HỌC LỰC, HẠN NỘP */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex-wrap">
        {/* Lọc theo đợt giao bài */}
        <select
          value={assignmentFilter}
          onChange={(e) => handleSelectAssignment(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-ocean-500 max-w-xs cursor-pointer"
        >
          <option value="all">Tất cả đợt giao bài ({assignmentsList.length})</option>
          {assignmentsList.map((a) => (
            <option key={a.id} value={a.id}>
              {a.title}
            </option>
          ))}
        </select>

        {/* Lọc theo Khối */}
        <select
          value={gradeFilter}
          onChange={(e) => handleGradeChange(e.target.value === 'all' ? 'all' : Number(e.target.value))}
          className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-ocean-500 cursor-pointer"
        >
          <option value="all">🏫 Tất cả các Khối</option>
          <option value="6">Khối 6</option>
          <option value="7">Khối 7</option>
          <option value="8">Khối 8</option>
          <option value="9">Khối 9</option>
        </select>

        {/* Lọc theo Lớp */}
        <select
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-ocean-500 cursor-pointer"
        >
          <option value="all">Tất cả các Lớp ({availableClasses.length})</option>
          {availableClasses.map((c) => (
            <option key={c.id || c.name} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>

        {/* Lọc theo Trạng thái Nộp bài (Đúng hạn vs Nộp muộn) */}
        <select
          value={lateFilter}
          onChange={(e) => setLateFilter(e.target.value as any)}
          className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-ocean-500 cursor-pointer"
        >
          <option value="all">⏱️ Mọi thời gian nộp</option>
          <option value="on_time_only">✓ Đúng hạn quy định</option>
          <option value="late_only">⚠️ Nộp muộn (quá hạn)</option>
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

        {/* Bộ lọc phân loại bài thi thật vs bài thi thử */}
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

      {/* 5. HIỂN THỊ DANH SÁCH BÀI NỘP THEO CHẾ ĐỘ XEM */}
      {viewMode === 'grouped' ? (
        /* CHẾ ĐỘ GOM NHÓM THEO TỪNG ĐỀ THI VỚI KHUNG THU GỌN VÀ TAB PHÂN LỚP */
        <div className="space-y-4">
          {/* Thanh công cụ mở rộng / thu gọn tất cả thẻ đề thi */}
          <div className="flex items-center justify-between text-xs px-1 text-slate-500">
            <div className="font-bold flex items-center gap-1.5">
              <span>Đang hiển thị {filteredAssignmentsToDisplay.length} đề thi</span>
              <span>•</span>
              <span className="text-ocean-700 font-semibold">
                {expandedAssignmentIds.size} đề đang mở rộng
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExpandAll}
                className="flex items-center gap-1 text-ocean-700 hover:text-ocean-900 font-bold hover:underline cursor-pointer"
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span>Mở Rộng Tất Cả</span>
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={handleCollapseAll}
                className="flex items-center gap-1 text-slate-600 hover:text-slate-900 font-bold hover:underline cursor-pointer"
              >
                <Folder className="w-3.5 h-3.5" />
                <span>Thu Gọn Tất Cả</span>
              </button>
            </div>
          </div>

          {filteredAssignmentsToDisplay.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center text-slate-400 italic text-xs border border-slate-200">
              Không tìm thấy đề thi nào phù hợp với bộ lọc hiện tại.
            </div>
          ) : (
            filteredAssignmentsToDisplay.map((asg) => {
              // Lọc bài nộp thuộc đề thi này theo tất cả các bộ lọc phụ
              const asgFilteredSubs = filteredSubmissions.filter(
                (s) => s.assignment_id === asg.id
              );
              const allAsgSubs = submissions.filter((s) => s.assignment_id === asg.id);
              const isExpanded = expandedAssignmentIds.has(asg.id);

              // Danh sách các lớp học có bài nộp trong đề thi này
              const asgClasses = Array.from(
                new Set(asgFilteredSubs.map((s) => s.class_name).filter(Boolean))
              ).sort();

              const currentSubClass = assignmentClassSubFilter[asg.id] || 'all';

              // Lọc tiếp bài nộp theo Tab lớp con đang chọn
              const displayedSubs =
                currentSubClass === 'all'
                  ? asgFilteredSubs
                  : asgFilteredSubs.filter((s) => s.class_name === currentSubClass);

              const asgHasEssay = displayedSubs.some(
                (s) => (s.max_score_tl !== undefined ? s.max_score_tl > 0 : Boolean(s.essay_question))
              );

              return (
                <div
                  key={asg.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden transition-all duration-200"
                >
                  {/* Header Khối Đề Thi Dạng Accordion Thu Gọn Siêu Mỏng */}
                  <div
                    onClick={() => toggleExpandAssignment(asg.id)}
                    className={`p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer transition select-none ${
                      isExpanded
                        ? 'bg-slate-50/90 border-b border-slate-200'
                        : 'bg-white hover:bg-slate-50/80'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border transition ${
                          isExpanded
                            ? 'bg-ocean-600 text-white border-ocean-700 shadow-xs'
                            : 'bg-ocean-50 text-ocean-700 border-ocean-200'
                        }`}
                      >
                        {isExpanded ? (
                          <FolderOpen className="w-5 h-5" />
                        ) : (
                          <Folder className="w-5 h-5" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-black text-slate-900 text-sm sm:text-base hover:text-ocean-700 transition">
                            {asg.title}
                          </h3>
                          <span className="text-[10px] font-black uppercase text-ocean-700 bg-ocean-100/80 px-2 py-0.5 rounded-md">
                            Khối {asg.grade}
                          </span>
                          {!asgHasEssay && (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                              100% Trắc nghiệm
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2.5 flex-wrap">
                          <span>
                            Tổng nộp: <strong className="text-slate-800">{allAsgSubs.length}</strong> bài
                          </span>
                          <span>•</span>
                          <span>
                            ĐTB: <strong className="text-slate-800">{asg.avg_score}đ</strong>
                          </span>
                          {asg.pending_count > 0 && (
                            <>
                              <span>•</span>
                              <span className="text-amber-800 font-bold bg-amber-100/80 px-2 py-0.2 rounded-md border border-amber-300 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
                                {asg.pending_count} bài chờ chấm
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExportExcelForAssignment(asg.title, allAsgSubs);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-ocean-50 text-slate-700 hover:text-ocean-800 text-xs font-bold border border-slate-200 transition cursor-pointer shadow-2xs"
                        title="Xuất bảng điểm Excel cho bài kiểm tra này"
                      >
                        <Download className="w-3.5 h-3.5 text-ocean-600" />
                        <span>Xuất Excel Đề Này</span>
                      </button>

                      <div className="flex items-center gap-1 text-xs font-bold text-ocean-700 bg-ocean-50/70 border border-ocean-200 px-2.5 py-1.5 rounded-xl">
                        <span>{isExpanded ? 'Thu gọn' : 'Mở rộng'}</span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Nội Dung Chi Tiết Khi Mở Rộng Thẻ Đề Thi */}
                  {isExpanded && (
                    <div className="p-4 space-y-3 bg-white animate-in fade-in duration-200">
                      {/* Dải Tab Chọn Lớp Con Trong Đề Này (Nếu đề có nhiều lớp nộp) */}
                      {asgClasses.length > 1 && (
                        <div className="flex items-center justify-between gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200 flex-wrap">
                          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-thin">
                            <span className="text-[11px] font-bold text-slate-500 px-1">
                              Xem lớp:
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setAssignmentClassSubFilter((prev) => ({
                                  ...prev,
                                  [asg.id]: 'all',
                                }))
                              }
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 ${
                                currentSubClass === 'all'
                                  ? 'bg-ocean-600 text-white shadow-2xs'
                                  : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                              }`}
                            >
                              Tất Cả Các Lớp ({asgFilteredSubs.length})
                            </button>
                            {asgClasses.map((cls) => {
                              const isSubClassSelected = currentSubClass === cls;
                              const countInCls = asgFilteredSubs.filter(
                                (s) => s.class_name === cls
                              ).length;
                              return (
                                <button
                                  key={cls}
                                  type="button"
                                  onClick={() =>
                                    setAssignmentClassSubFilter((prev) => ({
                                      ...prev,
                                      [asg.id]: cls,
                                    }))
                                  }
                                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 flex items-center gap-1 ${
                                    isSubClassSelected
                                      ? 'bg-ocean-600 text-white shadow-2xs font-black'
                                      : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                                  }`}
                                >
                                  <span>Lớp {cls}</span>
                                  <span
                                    className={`text-[10px] px-1 rounded-full ${
                                      isSubClassSelected
                                        ? 'bg-white/30 text-white'
                                        : 'bg-slate-100 text-slate-500'
                                    }`}
                                  >
                                    {countInCls}
                                  </span>
                                </button>
                              );
                            })}
                          </div>

                          {currentSubClass !== 'all' && (
                            <button
                              type="button"
                              onClick={() => {
                                const classSubs = allAsgSubs.filter(
                                  (s) => s.class_name === currentSubClass
                                );
                                handleExportExcelForAssignment(
                                  `${asg.title}_Lop_${currentSubClass}`,
                                  classSubs
                                );
                              }}
                              className="text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg flex items-center gap-1 transition cursor-pointer"
                              title={`Xuất riêng bảng điểm của lớp ${currentSubClass}`}
                            >
                              <Download className="w-3 h-3 text-emerald-600" />
                              <span>Xuất Excel Lớp {currentSubClass}</span>
                            </button>
                          )}
                        </div>
                      )}

                      {/* Bảng Học Sinh Trong Đề Thi Này */}
                      {renderSubmissionTable(displayedSubs, false, asgHasEssay)}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* CHẾ ĐỘ BẢNG TỔNG HỢP DUY NHẤT */
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm overflow-hidden">
          {renderSubmissionTable(filteredSubmissions, true)}
        </div>
      )}

      {/* 6. MODAL NHẬN XÉT NHANH HÀNG LOẠT 1-CLICK */}
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
