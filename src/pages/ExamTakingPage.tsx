import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Send,
  Sparkles,
  BookOpen,
  HelpCircle,
  LogIn,
  GraduationCap,
  ShieldCheck,
  UserCheck,
  LogOut,
} from 'lucide-react';
import { Question, Assignment, Profile } from '../types/database';
import { SingleChoiceQuestion } from '../components/questions/SingleChoiceQuestion';
import { MultipleChoiceQuestion } from '../components/questions/MultipleChoiceQuestion';
import { TrueFalseQuestion } from '../components/questions/TrueFalseQuestion';
import { FillBlankQuestion } from '../components/questions/FillBlankQuestion';
import { DragDropQuestion } from '../components/questions/DragDropQuestion';
import { EssayQuestion } from '../components/questions/EssayQuestion';
import { gradeEntireExam } from '../lib/gradingEngine';
import { triggerCelebration } from '../lib/gamification';
import { fetchAssignmentById, saveStudentSubmission } from '../lib/assignmentCloudSync';
import { fetchStudentsFromCloud } from '../lib/studentCloudSync';
import { getStoredStudents, INITIAL_CLASSES } from '../data/studentsData';
import { normalizeQuestion, normalizeQuestionList } from '../lib/questionUtils';

export const ExamTakingPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile, role, signInAsStudent, signOut, quickLogin } = useAuth();
  const schoolLogo = localStorage.getItem('geo_school_logo') || '';

  // Nhận diện xem giáo viên có đang chủ động xem thử đề thi hay không
  const isTeacherPreviewing = sessionStorage.getItem('is_teacher_previewing') === 'true';

  const isMockStudent = React.useMemo(() => {
    return Boolean(
      isTeacherPreviewing ||
      profile?.full_name?.toLowerCase().includes('học sinh mẫu') ||
      profile?.username?.toLowerCase().includes('hoc_sinh_mau') ||
      profile?.student_code === 'HS_MOCK' ||
      profile?.student_code === 'HS0601'
    );
  }, [isTeacherPreviewing, profile]);

  const [currentAssignment, setCurrentAssignment] = useState<Assignment | null>(() => {
    try {
      const savedAsgs = localStorage.getItem('geo_assignments');
      if (savedAsgs !== null) {
        const asgs = JSON.parse(savedAsgs);
        if (Array.isArray(asgs)) {
          return asgs.find((a: any) => String(a.id) === String(id)) || null;
        }
      }
    } catch (e) {
      console.warn('Lỗi đọc assignment:', e);
    }
    return null;
  });

  const [searchParams] = useSearchParams();
  const [loadingAssignment, setLoadingAssignment] = useState<boolean>(!currentAssignment);

  // Form đăng nhập học sinh: 'by_name' (chọn tên trong lớp) hoặc 'by_code' (nhập mã học sinh)
  const [loginMethod, setLoginMethod] = useState<'by_name' | 'by_code'>('by_name');
  const [selectedClass, setSelectedClass] = useState<string>(() => {
    const classFromUrl = searchParams.get('class');
    if (classFromUrl) return classFromUrl;
    if (currentAssignment?.target_ids && currentAssignment.target_ids.length > 0) {
      return currentAssignment.target_ids[0];
    }
    return 'Lớp 7A4';
  });
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [studentSearchKeyword, setStudentSearchKeyword] = useState<string>('');
  const [inputStudentCode, setInputStudentCode] = useState<string>('');
  const [inputGrade, setInputGrade] = useState<number>(() => {
    const gradeFromUrl = searchParams.get('grade');
    if (gradeFromUrl) return Number(gradeFromUrl) || 7;
    return currentAssignment?.grade || 7;
  });
  const [authError, setAuthError] = useState<string>('');
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);

  const [allSystemStudents, setAllSystemStudents] = useState<Profile[]>(() => getStoredStudents());

  // Tự động tải danh sách học sinh thật từ Supabase Cloud về điện thoại
  useEffect(() => {
    let isMounted = true;
    async function loadCloudStudents() {
      const cloudStudents = await fetchStudentsFromCloud();
      if (isMounted && cloudStudents && cloudStudents.length > 0) {
        setAllSystemStudents(cloudStudents);
      }
    }
    loadCloudStudents();
    return () => {
      isMounted = false;
    };
  }, []);

  // Danh sách học sinh theo lớp đang chọn (SẮP XẾP CHUẨN THEO TÊN HỌC SINH VIỆT NAM: A, B, C...)
  const classStudents = useMemo<Profile[]>(() => {
    return allSystemStudents
      .filter((s: Profile) => s.class_name === selectedClass)
      .sort((a: Profile, b: Profile) => {
        // Tách lấy Tên (chữ cuối cùng trong họ và tên) để so sánh theo bảng chữ cái
        const partsA = a.full_name.trim().split(/\s+/);
        const partsB = b.full_name.trim().split(/\s+/);
        const firstNameA = partsA[partsA.length - 1] || '';
        const firstNameB = partsB[partsB.length - 1] || '';
        const cmpFirst = firstNameA.localeCompare(firstNameB, 'vi', { sensitivity: 'base' });
        if (cmpFirst !== 0) return cmpFirst;
        return a.full_name.localeCompare(b.full_name, 'vi', { sensitivity: 'base' });
      });
  }, [allSystemStudents, selectedClass]);

  // Lọc theo từ khóa tìm kiếm nhanh của học sinh
  const filteredClassStudents = useMemo(() => {
    if (!studentSearchKeyword.trim()) return classStudents;
    const kw = studentSearchKeyword.toLowerCase().trim();
    return classStudents.filter(
      (st) =>
        st.full_name.toLowerCase().includes(kw) ||
        (st.student_code && st.student_code.toLowerCase().includes(kw))
    );
  }, [classStudents, studentSearchKeyword]);

  // Tự động tải đề thi từ Supabase Cloud khi học sinh quét mã QR từ điện thoại
  useEffect(() => {
    let isMounted = true;
    async function loadAssignmentData() {
      if (!id) {
        setLoadingAssignment(false);
        return;
      }
      setLoadingAssignment(true);
      const asg = await fetchAssignmentById(id);
      if (isMounted) {
        if (asg) {
          setCurrentAssignment(asg);
          if (asg.questions && asg.questions.length > 0) {
            setQuestions(normalizeQuestionList(asg.questions));
          }
          if (!searchParams.get('grade') && asg.grade) {
            setInputGrade(asg.grade);
          }
          if (asg.target_ids && asg.target_ids.length > 0 && !searchParams.get('class')) {
            setSelectedClass(asg.target_ids[0]);
          }
        }
        setLoadingAssignment(false);
      }
    }
    loadAssignmentData();
    return () => {
      isMounted = false;
    };
  }, [id]);

  // Thí sinh làm bài thi trong phiên này:
  // Luôn khởi tạo là null để bất kể khi quét lại QR hoặc vào lại link đều BẮT BUỘC chọn tên mới từ đầu
  const [examStudent, setExamStudent] = useState<Profile | null>(null);

  // CHỈ CHO PHÉP VÀO LÀM BÀI NẾU ĐÃ XÁC NHẬN TÊN TRONG PHIÊN NÀY
  const isStudentLoggedIn = Boolean(examStudent !== null);

  // Bất kể mở bằng link hay quét mã QR: Luôn reset trạng thái làm bài mới hoàn toàn khi tải trang
  useEffect(() => {
    setExamStudent(null);
    setAnswers({});
    setCurrentQIndex(0);
    sessionStorage.removeItem('is_teacher_previewing');
  }, [id]);

  const [questions, setQuestions] = useState<Question[]>(() => {
    if (currentAssignment && currentAssignment.questions && currentAssignment.questions.length > 0) {
      return normalizeQuestionList(currentAssignment.questions);
    }
    return [];
  });

  const [currentQIndex, setCurrentQIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const initialDuration = (currentAssignment?.duration_minutes || 15) * 60;
  const [durationSeconds, setDurationSeconds] = useState<number>(initialDuration);
  const [timeLeft, setTimeLeft] = useState<number>(initialDuration);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const timerRef = useRef<any>(null);

  // Cập nhật câu hỏi và thời gian khi assignment được nạp xong từ Cloud
  useEffect(() => {
    if (currentAssignment) {
      if (currentAssignment.questions && currentAssignment.questions.length > 0) {
        setQuestions(normalizeQuestionList(currentAssignment.questions));
      } else {
        setQuestions([]);
      }
      const totalSecs = (currentAssignment.duration_minutes || 15) * 60;
      setDurationSeconds(totalSecs);
      setTimeLeft(totalSecs);
      setInputGrade(currentAssignment.grade || 7);
    }
  }, [currentAssignment]);

  // Đếm ngược thời gian làm bài (CHỈ CHẠY KHI HỌC SINH ĐÃ ĐĂNG NHẬP)
  useEffect(() => {
    if (!isStudentLoggedIn) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isStudentLoggedIn]);

  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const code = inputStudentCode.trim().toLowerCase();
    if (!code) {
      setAuthError('Vui lòng nhập mã số học sinh của em (Ví dụ: HS071, HS061...)');
      return;
    }

    setIsAuthenticating(true);
    // 1. Tìm trực tiếp trong danh sách học sinh của hệ thống
    const found = allSystemStudents.find(
      (s: Profile) =>
        (s.student_code && s.student_code.toLowerCase() === code) ||
        (s.username && s.username.toLowerCase() === code) ||
        (s.id && s.id.toLowerCase() === code)
    );

    if (found) {
      setExamStudent(found);
      setIsAuthenticating(false);
      return;
    }

    // 2. Thử đăng nhập qua AuthContext
    const result = await signInAsStudent(code, inputGrade);
    setIsAuthenticating(false);

    if (result.error) {
      setAuthError(result.error.message || 'Mã học sinh không tồn tại hoặc sai khối lớp. Vui lòng kiểm tra lại!');
    } else {
      const updated = allSystemStudents.find(
        (s: Profile) =>
          (s.student_code && s.student_code.toLowerCase() === code) ||
          (s.username && s.username.toLowerCase() === code)
      );
      if (updated) {
        setExamStudent(updated);
      }
    }
  };

  const handleSelectNameLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!selectedStudentId) {
      setAuthError('Em vui lòng chọn đúng họ tên của mình trong danh sách lớp!');
      return;
    }

    const student = allSystemStudents.find((s: Profile) => s.id === selectedStudentId);
    if (!student) {
      setAuthError('Không tìm thấy thông tin học sinh đã chọn. Vui lòng thử lại!');
      return;
    }

    // Gán ngay thí sinh của phiên làm bài này
    setExamStudent(student);
  };

  const handleAutoSubmit = () => {
    alert('⏰ ĐÃ HẾT THỜI GIAN LÀM BÀI! Hệ thống đang tự động nộp bài của em...');
    submitExam();
  };

  const handleAnswerChange = (questionId: string, answer: any) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const submitExam = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsSubmitting(true);

    // Chấm điểm tự động qua Grading Engine dựa trên điểm số thực tế của từng câu hỏi
    const gradeResult = gradeEntireExam(questions, answers);

    const timeSpent = durationSeconds - timeLeft;
    const resultId = 'sub_' + Date.now();

    const essayQ = questions.find((q) => q.type === 'essay');
    const essayAnswer = essayQ ? answers[essayQ.id] : null;

    const submissionData = {
      id: resultId,
      assignment_id: id || 'asg_1',
      assignment_title: currentAssignment?.title || 'Bài Kiểm Tra Địa Lí',
      student_name: examStudent?.full_name || 'Học Sinh',
      student_code: examStudent?.student_code || 'HS071',
      class_name: examStudent?.class_name || (currentAssignment?.target_ids?.[0] || 'Lớp 7A1'),
      score_tn: gradeResult.objectiveScore,
      max_score_tn: gradeResult.objectiveMaxScore,
      score_tl: 0,
      max_score_tl: gradeResult.essayMaxScore,
      score: gradeResult.totalScore,
      max_score: gradeResult.maxScore,
      essay_question: essayQ ? (essayQ.content_json?.prompt || essayQ.title) : null,
      essay_answer: typeof essayAnswer === 'string' ? essayAnswer : null,
      answers_json: answers,
      detailed_scores_json: gradeResult.detailedResults,
      questions: questions,
      is_late: false,
      time_spent_seconds: timeSpent,
      status: gradeResult.hasEssay ? 'waiting_teacher_grading' : 'graded',
      submitted_at: 'Vừa xong',
      teacher_feedback_text: '',
    };

    // 1. Lưu kết quả của đợt thi này trên máy học sinh để màn hình kết quả hiển thị ngay
    localStorage.setItem(`geo_result_${id || 'asg_1'}`, JSON.stringify(submissionData));

    // 2. Tự động đồng bộ bài nộp lên Supabase Cloud (Để bàn làm việc của Cô Hảo nhận ngay)
    await saveStudentSubmission(submissionData);

    // 3. Dọn dẹp phiên đăng nhập để nếu bạn khác mượn điện thoại quét lại QR sẽ phải đăng nhập lại từ đầu
    sessionStorage.removeItem('is_teacher_previewing');
    localStorage.removeItem('geo_thcs_auth_profile');

    if (!gradeResult.hasEssay) {
      triggerCelebration();
      alert(`🎉 Chúc mừng em! Đề thi 100% trắc nghiệm đã có kết quả ngay:\n• Điểm số chính thức của em: ${gradeResult.totalScore} / 10.0 điểm.`);
    } else {
      alert(`🎉 Em đã nộp bài thành công!\n• Điểm phần trắc nghiệm tạm tính: ${gradeResult.objectiveScore} / 7.0 điểm.\n• Phần tự luận (3.0 điểm) đã được chuyển sang mục chờ Cô Hảo chấm điểm và nhận xét.`);
    }

    navigate(`/results/${id || 'asg_1'}`);
  };

  // --- KHI ĐANG TẢI ĐỀ THI TỪ CLOUD (HỌC SINH QUÉT QR TRÊN ĐIỆN THOẠI) ---
  if (loadingAssignment && !currentAssignment) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl text-center space-y-4 animate-in fade-in duration-300">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto shadow-inner border border-teal-100 animate-pulse">
            <Sparkles className="w-8 h-8 animate-spin" />
          </div>
          <span className="inline-block text-[11px] font-black uppercase tracking-wider bg-teal-50 text-teal-700 px-3 py-1 rounded-full border border-teal-200">
            Đang kết nối hệ thống
          </span>
          <h2 className="text-lg sm:text-xl font-black text-slate-900">
            Đang tải đề thi từ Cô Hảo...
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            Hệ thống đang đồng bộ nội dung đề kiểm tra qua Internet. Em vui lòng đợi trong giây lát nhé!
          </p>
        </div>
      </div>
    );
  }

  // --- NẾU BÀI KIỂM TRA KHÔNG TỒN TẠI HOẶC ĐÃ ĐƯỢC GIÁO VIÊN XÓA BỎ ---
  if (!currentAssignment) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl text-center space-y-4 animate-in fade-in duration-300">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto shadow-inner border border-rose-100">
            <AlertCircle className="w-8 h-8" />
          </div>
          <span className="inline-block text-[11px] font-black uppercase tracking-wider bg-rose-50 text-rose-700 px-3 py-1 rounded-full border border-rose-200">
            Đề thi đã ngừng hoạt động
          </span>
          <h2 className="text-lg sm:text-xl font-black text-slate-900">
            Bài kiểm tra không tồn tại hoặc đã được gỡ bỏ
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            Giáo viên (Cô Dương Thu Hảo) đã xóa hoặc ngừng đợt kiểm tra này. Phía học sinh sẽ không còn nhận được yêu cầu làm bài nữa.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => navigate('/student-dashboard')}
              className="w-full py-3 px-4 bg-ocean-600 hover:bg-ocean-700 text-white text-xs sm:text-sm font-bold rounded-2xl shadow-sm transition active:scale-95 cursor-pointer"
            >
              Quay lại Góc học tập
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- NẾU BÀI KIỂM TRA ĐANG TRONG TRẠNG THÁI TẠM DỪNG NHẬN BÀI (GỢI Ý 1) ---
  if (currentAssignment.is_paused && !isMockStudent) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl text-center space-y-4 animate-in fade-in duration-300">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto shadow-inner border border-amber-200">
            <Clock className="w-8 h-8 animate-pulse" />
          </div>
          <span className="inline-block text-[11px] font-black uppercase tracking-wider bg-amber-50 text-amber-900 px-3 py-1 rounded-full border border-amber-300">
            Đang Tạm Dừng Nhận Bài
          </span>
          <h2 className="text-lg sm:text-xl font-black text-slate-900">
            Bài kiểm tra đang tạm khóa
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            Giáo viên (Cô Dương Thu Hảo) đang tạm dừng đợt kiểm tra này. Kết quả các bài làm đã nộp trước đó vẫn được lưu an toàn. Em vui lòng đợi cô Hảo mở lại nhé!
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => navigate('/student-dashboard')}
              className="w-full py-3 px-4 bg-ocean-600 hover:bg-ocean-700 text-white text-xs sm:text-sm font-bold rounded-2xl shadow-sm transition active:scale-95 cursor-pointer"
            >
              Quay lại Góc học tập
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- MÀN HÌNH CHỜ TẢI ĐỀ THI TỪ HỆ THỐNG CLOUD ---
  if (loadingAssignment && !currentAssignment) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-4 animate-in fade-in">
        <div className="w-12 h-12 border-4 border-ocean-200 border-t-ocean-600 rounded-full animate-spin" />
        <h3 className="text-base font-bold text-slate-800">Đang tải đề thi từ hệ thống...</h3>
        <p className="text-xs text-slate-500">Vui lòng đợi trong giây lát để hệ thống nạp chính xác đề thi từ giáo viên.</p>
      </div>
    );
  }

  // --- MÀN HÌNH BÁO LỖI NẾU KHÔNG TÌM THẤY BÀI KIỂM TRA ---
  if (!loadingAssignment && !currentAssignment) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-4 animate-in fade-in">
        <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h3 className="text-base font-bold text-slate-800">Không tìm thấy bài kiểm tra này</h3>
        <p className="text-xs text-slate-500 max-w-sm">
          Bài kiểm tra có thể đã bị xóa hoặc đường link không chính xác. Cô hoặc các em vui lòng kiểm tra lại nhé!
        </p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-ocean-600 hover:bg-ocean-700 text-white rounded-xl text-xs font-bold transition"
        >
          Trở về Trang chủ
        </button>
      </div>
    );
  }

  // --- NẾU HỌC SINH CHƯA ĐĂNG NHẬP: HIỂN THỊ MÀN HÌNH ĐĂNG NHẬP BẮT BUỘC ---
  if (!isStudentLoggedIn) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-300">
        <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            {schoolLogo ? (
              <img
                src={schoolLogo}
                alt="Logo Trường"
                className="w-16 h-16 rounded-2xl object-contain mx-auto shadow-md border border-slate-200 bg-white p-1"
              />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-ocean-600 to-teal-500 text-white flex items-center justify-center mx-auto shadow-md">
                <GraduationCap className="w-8 h-8" />
              </div>
            )}
            <span className="inline-block text-[11px] font-black uppercase tracking-wider bg-ocean-50 text-ocean-700 px-3 py-1 rounded-full border border-ocean-200">
              {currentAssignment?.category || 'Kiểm Tra Môn Địa Lí THCS'}
            </span>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 leading-snug">
              {currentAssignment?.title || 'Bài Kiểm Tra Địa Lí Trực Tuyến'}
            </h2>
            <p className="text-xs text-slate-500">
              Thời gian làm bài: <strong>{currentAssignment?.duration_minutes || 15} phút</strong> • Giáo viên: <strong>Cô Dương Thu Hảo</strong>
            </p>
          </div>

          {/* Thông báo chế độ Giáo viên nếu đang dùng tài khoản Cô Hảo */}
          {profile?.role === 'teacher' && (
            <div className="p-3.5 bg-teal-50 rounded-2xl border border-teal-200 text-xs text-teal-950 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold flex items-center gap-1.5 text-teal-800">
                  <Sparkles className="w-4 h-4 text-teal-600" />
                  Cô Dương Thu Hảo (Giáo viên)
                </span>
                <span className="text-[10px] bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full font-bold">
                  Bàn làm việc
                </span>
              </div>
              <p className="text-[11px] text-teal-800/80">
                Cô đang mở đề thi này trên thiết bị của mình. Cô có thể bấm nút dưới để xem/làm thử đề thi, hoặc để học sinh tự chọn tên làm bài ở khung bên dưới:
              </p>
              <button
                type="button"
                onClick={() => {
                  sessionStorage.setItem('is_teacher_previewing', 'true');
                  const teacherMock: Profile = {
                    id: 'teacher_preview',
                    username: 'co_hao_preview',
                    full_name: 'Cô Dương Thu Hảo (Giáo viên thử nghiệm)',
                    role: 'teacher',
                    student_code: 'GV_PREVIEW',
                    class_name: selectedClass || 'Lớp Giáo Viên',
                    grade: currentAssignment?.grade || 7,
                    xp: 0,
                    level: 1,
                  };
                  setExamStudent(teacherMock);
                }}
                className="w-full py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl font-bold text-xs shadow-xs transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Làm Thử Đề Thi Với Tư Cách Giáo Viên 👩‍🏫
              </button>
            </div>
          )}

          {/* CHỌN CÁCH ĐĂNG NHẬP DÀNH CHO HỌC SINH */}
          <div className="space-y-4">
            <div className="flex items-center p-1 bg-slate-100 rounded-2xl">
              <button
                type="button"
                onClick={() => {
                  setLoginMethod('by_name');
                  setAuthError('');
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  loginMethod === 'by_name'
                    ? 'bg-white text-ocean-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                👤 Chọn Tên Trong Lớp (Dễ nhất)
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginMethod('by_code');
                  setAuthError('');
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  loginMethod === 'by_code'
                    ? 'bg-white text-ocean-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                🔑 Nhập Mã Học Sinh
              </button>
            </div>

            {authError && (
              <div className="p-3 bg-rose-50 rounded-2xl border border-rose-200 text-xs text-rose-700 flex items-start gap-2 animate-shake">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}

            {/* CÁCH 1: CHỌN TÊN TRONG DANH SÁCH LỚP */}
            {loginMethod === 'by_name' ? (
              <form onSubmit={handleSelectNameLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Lớp của em:
                  </label>
                  <select
                    value={selectedClass}
                    onChange={(e) => {
                      setSelectedClass(e.target.value);
                      setSelectedStudentId('');
                    }}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-300 text-xs sm:text-sm font-bold text-slate-800 focus:ring-2 focus:ring-ocean-500 bg-white"
                  >
                    {(currentAssignment?.target_ids && currentAssignment.target_ids.length > 0
                      ? currentAssignment.target_ids
                      : INITIAL_CLASSES.filter((c) => Number(c.grade) === Number(inputGrade)).map((c) => c.name)
                    ).map((cName) => (
                      <option key={cName} value={cName}>
                        {cName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      Họ và tên của em ({classStudents.length} học sinh):
                    </label>
                    <span className="text-[11px] font-semibold text-ocean-700 bg-ocean-50 px-2 py-0.5 rounded-md">
                      Xếp theo tên (A - Z)
                    </span>
                  </div>

                  {/* Ô TÌM NHANH TÊN HỌC SINH */}
                  <div className="relative mb-2">
                    <input
                      type="text"
                      placeholder="🔍 Gõ tên của em để tìm nhanh (Ví dụ: Anh, Bách, Mai, Say...)"
                      value={studentSearchKeyword}
                      onChange={(e) => setStudentSearchKeyword(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-ocean-500 bg-slate-50 font-medium"
                    />
                    {studentSearchKeyword && (
                      <button
                        type="button"
                        onClick={() => setStudentSearchKeyword('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-300 text-xs sm:text-sm font-bold text-slate-800 focus:ring-2 focus:ring-ocean-500 bg-white"
                  >
                    <option value="">
                      {filteredClassStudents.length === 0
                        ? '-- Không tìm thấy học sinh nào trùng khớp --'
                        : '-- Bấm vào đây để chọn đúng tên của em --'}
                    </option>
                    {filteredClassStudents.map((st: Profile, idx: number) => (
                      <option key={st.id} value={st.id}>
                        {idx + 1}. {st.full_name}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-400 mt-1">
                    💡 Danh sách đã được sắp xếp chuẩn theo Tên (A - Z). Em hãy bấm chọn đúng tên của mình nhé!
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isAuthenticating || !selectedStudentId}
                  className="w-full py-3.5 bg-gradient-to-r from-ocean-600 to-teal-600 hover:from-ocean-700 hover:to-teal-700 text-white rounded-2xl font-black text-sm shadow-md transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isAuthenticating ? (
                    <span>Đang xác nhận tên em...</span>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      Xác Nhận Tên & Bắt Đầu Làm Bài Ngay 🚀
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* CÁCH 2: NHẬP MÃ SỐ HỌC SINH */
              <form onSubmit={handleStudentLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Khối lớp của em:
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[6, 7, 8, 9].map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setInputGrade(g)}
                        className={`py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                          inputGrade === g
                            ? 'bg-ocean-600 text-white border-ocean-600 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        Khối {g}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Mã số học sinh của em:
                  </label>
                  <input
                    type="text"
                    value={inputStudentCode}
                    onChange={(e) => setInputStudentCode(e.target.value.toUpperCase())}
                    placeholder="Ví dụ: HS071, HS061..."
                    required
                    autoFocus
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-ocean-500 font-mono text-sm tracking-wider font-bold uppercase"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Gợi ý: Dùng mã học sinh được cấp trên lớp (Ví dụ: HS071, HS072...)
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isAuthenticating}
                  className="w-full py-3.5 bg-gradient-to-r from-ocean-600 to-teal-600 hover:from-ocean-700 hover:to-teal-700 text-white rounded-2xl font-black text-sm shadow-md transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isAuthenticating ? (
                    <span>Đang kiểm tra mã...</span>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      Xác Nhận Mã & Bắt Đầu Làm Bài Ngay 🚀
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Nút đăng nhập nhanh chế độ Thử nghiệm dành cho Giáo viên */}
            <div className="pt-2 border-t border-slate-100 text-center">
              <button
                type="button"
                onClick={() => {
                  sessionStorage.setItem('is_teacher_previewing', 'true');
                  const mockSt: Profile = {
                    id: 'mock_student_preview',
                    username: 'hs_mau',
                    full_name: 'Học Sinh Mẫu (Thử nghiệm)',
                    role: 'student',
                    student_code: 'HS_MOCK',
                    class_name: selectedClass || 'Lớp 7A1',
                    grade: currentAssignment?.grade || 7,
                    xp: 0,
                    level: 1,
                  };
                  setExamStudent(mockSt);
                }}
                className="w-full py-2.5 px-4 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold rounded-2xl transition cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 shadow-2xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Vào Thử Nghiệm Ngay Với "Học Sinh Mẫu" 🧪</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Nếu đã đăng nhập nhưng đề thi không có câu hỏi nào
  if (questions.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-4 animate-in fade-in">
        <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h3 className="text-base font-bold text-slate-800">Bài kiểm tra chưa có câu hỏi</h3>
        <p className="text-xs text-slate-500 max-w-sm">
          Bài kiểm tra "{currentAssignment?.title}" hiện chưa có câu hỏi nào. Cô vui lòng kiểm tra lại trong mục Quản lý Đề thi nhé!
        </p>
        <button
          type="button"
          onClick={() => {
            setExamStudent(null);
            navigate('/');
          }}
          className="px-4 py-2 bg-ocean-600 hover:bg-ocean-700 text-white rounded-xl text-xs font-bold transition"
        >
          Trở về Trang chủ
        </button>
      </div>
    );
  }

  const currentQ = normalizeQuestion(questions[currentQIndex]);
  const isLastQuestion = currentQIndex === questions.length - 1;

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-300 pb-16">
      {/* Sticky Header: Đồng hồ đếm ngược & Nút nộp bài */}
      <div className="sticky top-16 z-30 bg-white/95 backdrop-blur-md p-4 rounded-3xl border border-slate-200 shadow-md flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {schoolLogo ? (
            <img
              src={schoolLogo}
              alt="Logo Trường"
              className="w-10 h-10 rounded-2xl object-contain shadow-xs border border-slate-200 shrink-0 bg-white p-0.5"
            />
          ) : (
            <div className="w-10 h-10 rounded-2xl bg-ocean-100 text-ocean-700 flex items-center justify-center font-bold shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
          )}
          <div>
            <h2 className="text-xs sm:text-sm font-black text-slate-900 line-clamp-1">
              {currentAssignment?.title || 'Bài Kiểm Tra Môn Địa Lí'}
            </h2>
            <div className="text-[11px] text-slate-500 font-medium flex items-center gap-2">
              <span>
                Thí sinh: <strong className="text-slate-800">{examStudent?.full_name || 'Học sinh'}</strong> ({examStudent?.class_name || 'Lớp học'} {examStudent?.student_code ? `- ${examStudent?.student_code}` : ''})
              </span>
              <button
                type="button"
                onClick={async () => {
                  if (confirm('Em có muốn đổi sang học sinh khác không?')) {
                    setExamStudent(null);
                    setAnswers({});
                    setCurrentQIndex(0);
                    sessionStorage.removeItem('is_teacher_previewing');
                    await signOut();
                  }
                }}
                className="text-[10px] text-ocean-600 hover:text-ocean-800 underline font-semibold cursor-pointer"
                title="Đổi sang học sinh khác làm bài"
              >
                (Không phải em? Đổi tên)
              </button>
            </div>
          </div>
        </div>

        {/* Đồng hồ đếm ngược */}
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl font-mono font-black text-sm border shadow-xs ${
              timeLeft < 180
                ? 'bg-red-50 text-red-600 border-red-300 animate-pulse'
                : 'bg-ocean-50 text-ocean-800 border-ocean-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>{formatTimer(timeLeft)}</span>
          </div>

          <button
            type="button"
            onClick={() => {
              if (confirm('Em có chắc chắn muốn NỘP BÀI ngay bây giờ không?')) {
                submitExam();
              }
            }}
            disabled={isSubmitting}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            Nộp Bài
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Khung Làm Bài (Câu hỏi hiện tại) */}
        <div className="lg:col-span-3 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-slate-900 text-white font-black text-sm flex items-center justify-center">
                {currentQIndex + 1}
              </span>
              <span className="text-xs font-bold text-ocean-700 bg-ocean-50 px-2.5 py-1 rounded-full border border-ocean-200">
                {currentQ.type}
              </span>
            </div>

            <span className="text-xs font-semibold text-slate-500">
              {currentQ.points} Điểm
            </span>
          </div>

          {/* Render Dạng Câu Hỏi Tương Ứng */}
          <div className="min-h-[220px]">
            {currentQ.type === 'single_choice' && (
              <SingleChoiceQuestion
                question={currentQ}
                selectedAnswer={answers[currentQ.id]}
                onAnswerChange={(ans) => handleAnswerChange(currentQ.id, ans)}
              />
            )}

            {currentQ.type === 'multiple_choice' && (
              <MultipleChoiceQuestion
                question={currentQ}
                selectedAnswers={answers[currentQ.id]}
                onAnswerChange={(ans) => handleAnswerChange(currentQ.id, ans)}
              />
            )}

            {currentQ.type === 'true_false' && (
              <TrueFalseQuestion
                question={currentQ}
                selectedAnswers={answers[currentQ.id]}
                onAnswerChange={(ans) => handleAnswerChange(currentQ.id, ans)}
              />
            )}

            {currentQ.type === 'fill_blank' && (
              <FillBlankQuestion
                question={currentQ}
                selectedAnswers={answers[currentQ.id]}
                onAnswerChange={(ans) => handleAnswerChange(currentQ.id, ans)}
              />
            )}

            {currentQ.type === 'drag_drop' && (
              <DragDropQuestion
                question={currentQ}
                selectedAnswers={answers[currentQ.id]}
                onAnswerChange={(ans) => handleAnswerChange(currentQ.id, ans)}
              />
            )}

            {currentQ.type === 'essay' && (
              <EssayQuestion
                question={currentQ}
                studentAnswer={answers[currentQ.id]}
                onAnswerChange={(ans) => handleAnswerChange(currentQ.id, ans)}
              />
            )}
          </div>

          {/* Thanh chuyển câu hỏi */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              disabled={currentQIndex === 0}
              onClick={() => setCurrentQIndex(currentQIndex - 1)}
              className="flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:pointer-events-none transition"
            >
              <ArrowLeft className="w-4 h-4" /> Câu trước
            </button>

            {isLastQuestion ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Em đã hoàn thành câu cuối cùng. Bấm OK để nộp bài!')) {
                    submitExam();
                  }
                }}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" /> Hoàn Thành & Nộp Bài
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setCurrentQIndex(currentQIndex + 1)}
                className="flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-bold text-white bg-ocean-600 hover:bg-ocean-700 shadow-xs transition active:scale-95"
              >
                Câu tiếp theo <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Cột Phải: Bản đồ câu hỏi (Jump-to-question navigation) */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-sm">Bản Đồ Câu Hỏi</h3>

          <div className="grid grid-cols-5 gap-2">
            {questions.map((q, idx) => {
              const isAnswered = answers[q.id] !== undefined && answers[q.id] !== '';
              const isCurrent = currentQIndex === idx;

              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setCurrentQIndex(idx)}
                  className={`w-10 h-10 rounded-xl font-bold text-xs flex items-center justify-center transition border ${
                    isCurrent
                      ? 'bg-ocean-600 text-white border-ocean-600 ring-2 ring-ocean-300'
                      : isAnswered
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-black'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <div className="space-y-1.5 pt-3 border-t border-slate-100 text-[11px] text-slate-500 font-medium">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              <span>Đã trả lời ({Object.keys(answers).filter((k) => answers[k] !== undefined && answers[k] !== '').length}/{questions.length})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-slate-200"></span>
              <span>Chưa trả lời</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
