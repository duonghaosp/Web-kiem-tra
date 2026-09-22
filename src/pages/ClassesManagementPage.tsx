import React, { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  Users,
  Plus,
  Trash2,
  Edit2,
  Upload,
  Download,
  Zap,
  CheckCircle2,
  Search,
  School,
  Sparkles,
  UserPlus,
  FileSpreadsheet,
  RotateCcw,
  Award,
  Cloud,
  CloudUpload,
  RefreshCw,
  CheckSquare,
  Square,
  Eraser,
} from 'lucide-react';
import { ClassItem, Profile } from '../types/database';
import { GrantXpModal } from '../components/gamification/GrantXpModal';
import { BadgeList } from '../components/common/BadgeList';
import { getStudentBadges, toggleBadgeForStudent } from '../data/badgeService';
import {
  INITIAL_CLASSES,
  INITIAL_STUDENTS,
  getStoredStudents,
  saveStoredStudents,
  reindexAllStudentCodes,
  compareVietnameseNames,
} from '../data/studentsData';
import {
  saveStudentsToCloud,
  fetchStudentsFromCloud,
  saveClassesToCloud,
  fetchClassesFromCloud,
  autoSyncStudentsWithCloud,
} from '../lib/studentCloudSync';

export const ClassesManagementPage: React.FC = () => {
  const [academicYear, setAcademicYear] = useState<string>(() => {
    return localStorage.getItem('geo_academic_year') || '2026-2027';
  });

  const [gradeFilter, setGradeFilter] = useState<number>(6);

  // Quản lý danh sách lớp - Đảm bảo luôn đầy đủ 16 lớp THCS (Khối 6, 7, 8, 9)
  const [classes, setClasses] = useState<ClassItem[]>(() => {
    try {
      const saved = localStorage.getItem('geo_classes_list');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Chuẩn hóa grade thành Number và kiểm tra nếu thiếu khối nào thì bổ sung
          const normalized = parsed.map((c: any) => ({
            ...c,
            grade: Number(c.grade) || 6,
          }));

          const hasG6 = normalized.some((c: ClassItem) => c.grade === 6);
          const hasG7 = normalized.some((c: ClassItem) => c.grade === 7);
          const hasG8 = normalized.some((c: ClassItem) => c.grade === 8);
          const hasG9 = normalized.some((c: ClassItem) => c.grade === 9);

          if (hasG6 && hasG7 && hasG8 && hasG9) {
            return normalized;
          }

          // Tự động bổ sung các lớp còn thiếu
          const missingClasses = INITIAL_CLASSES.filter((ic) => {
            return !normalized.some((nc: ClassItem) => nc.name === ic.name);
          });
          const merged = [...normalized, ...missingClasses];
          localStorage.setItem('geo_classes_list', JSON.stringify(merged));
          return merged;
        }
      }
    } catch (e) {
      console.warn('Lỗi đọc classes từ LocalStorage:', e);
    }
    localStorage.setItem('geo_classes_list', JSON.stringify(INITIAL_CLASSES));
    return INITIAL_CLASSES;
  });

  // ID lớp đang được chọn
  const [selectedClassId, setSelectedClassId] = useState<string>('c_6a1');

  // Quản lý danh sách học sinh (Mã HS chạy liên tục: HS061-156, HS071-156, HS081-156, HS091-156)
  const [students, setStudents] = useState<Profile[]>(() => {
    return getStoredStudents();
  });

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());

  // Hàm lưu học sinh xuống LocalStorage & Supabase Cloud
  const saveStudents = (newStudents: Profile[]) => {
    setStudents(newStudents);
    saveStudentsToCloud(newStudents);
  };

  // Trạng thái đồng bộ đám mây (Gợi ý 2 & 3)
  const [isSyncingCloud, setIsSyncingCloud] = useState<boolean>(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<string>(() => {
    return localStorage.getItem('geo_last_cloud_sync_time') || 'Vừa xong';
  });

  // Nút đồng bộ ngay lên đám mây (Gợi ý 2)
  const handleManualCloudSync = async () => {
    setIsSyncingCloud(true);
    try {
      await saveStudentsToCloud(students);
      await saveClassesToCloud(classes);
      const nowStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      setLastSyncedTime(nowStr);
      localStorage.setItem('geo_last_cloud_sync_time', nowStr);
      alert(
        `🎉 Đã đồng bộ thành công toàn bộ ${students.length} học sinh và ${classes.length} lớp học lên Supabase Cloud!\nĐiện thoại của học sinh quét mã QR sẽ nhận ngay danh sách chuẩn này.`
      );
    } catch (err) {
      console.error('Lỗi đồng bộ:', err);
      alert('Đã xảy ra lỗi khi đồng bộ lên Đám mây. Cô vui lòng kiểm tra lại kết nối mạng nhé!');
    } finally {
      setIsSyncingCloud(false);
    }
  };

  // Hàm lưu danh sách lớp xuống LocalStorage & Supabase Cloud
  const saveClasses = (newClasses: ClassItem[]) => {
    setClasses(newClasses);
    saveClassesToCloud(newClasses);
  };

  // Khôi phục 16 lớp THCS mặc định nếu bị xóa nhầm
  const handleResetDefaultClasses = () => {
    if (confirm('Cô có muốn khôi phục lại danh sách 16 lớp chuẩn và danh sách học sinh thực tế của Khối 7 & 9 không?')) {
      saveClasses(INITIAL_CLASSES);
      saveStudents(INITIAL_STUDENTS);
      setSelectedClassId('c_9a1');
      setGradeFilter(9);
      alert('Đã khôi phục thành công 16 lớp THCS và danh sách học sinh thực tế!');
    }
  };

  // Modal thêm lớp
  const [isAddClassModalOpen, setIsAddClassModalOpen] = useState(false);
  const [newClassName, setNewClassName] = useState('');

  // Modal thêm/sửa học sinh
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Profile | null>(null);
  const [studentForm, setStudentForm] = useState({
    student_code: '',
    full_name: '',
    username: '',
  });

  // Modal tặng XP
  const [isGrantXpOpen, setIsGrantXpOpen] = useState(false);
  const [selectedStudentForXp, setSelectedStudentForXp] = useState<Profile | null>(null);

  // Modal Trao Huy Hiệu Danh Dự
  const [isBadgeModalOpen, setIsBadgeModalOpen] = useState(false);
  const [selectedStudentForBadge, setSelectedStudentForBadge] = useState<Profile | null>(null);
  const [, setBadgeRefresh] = useState<number>(0);

  // Tải danh sách lớp và đồng bộ học sinh từ Supabase Cloud
  useEffect(() => {
    async function loadData() {
      // 1. Tự động đồng bộ hai chiều học sinh giữa LocalStorage và Cloud
      await autoSyncStudentsWithCloud();
      const [cloudClasses, cloudStudents] = await Promise.all([
        fetchClassesFromCloud(),
        fetchStudentsFromCloud(),
      ]);
      if (cloudClasses && cloudClasses.length > 0) {
        setClasses(cloudClasses);
      }
      if (cloudStudents && cloudStudents.length > 0) {
        setStudents(cloudStudents);
      }
    }
    loadData();
  }, []);

  // Lọc các lớp của khối đang chọn
  const currentGradeClasses = useMemo(() => {
    return classes.filter((c) => Number(c.grade) === Number(gradeFilter));
  }, [classes, gradeFilter]);

  // Lớp hiện tại: BẮT BUỘC PHẢI THUỘC ĐÚNG KHỐI ĐANG CHỌN (KHÔNG BAO GIỜ LẤY LỚP CỦA KHỐI KHÁC)
  const currentClass = useMemo(() => {
    const found = currentGradeClasses.find((c) => c.id === selectedClassId);
    return found || currentGradeClasses[0] || {
      id: `c_${gradeFilter}a1`,
      grade: gradeFilter,
      name: `Lớp ${gradeFilter}A1`,
      academic_year: academicYear,
      student_count: 0,
    };
  }, [currentGradeClasses, selectedClassId, gradeFilter, academicYear]);

  // Khi bấm chuyển Tab Khối (6, 7, 8, 9) -> Tự động chuyển sang lớp đầu tiên của Khối đó
  const handleSelectGrade = (grade: number) => {
    setGradeFilter(grade);
    const gClasses = classes.filter((c) => Number(c.grade) === Number(grade));
    if (gClasses.length > 0) {
      setSelectedClassId(gClasses[0].id);
    } else {
      setSelectedClassId(`c_${grade}a1`);
    }
  };

  // Thêm lớp mới
  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;

    const formattedName = newClassName.trim().startsWith('Lớp ')
      ? newClassName.trim()
      : `Lớp ${newClassName.trim()}`;

    const newClass: ClassItem = {
      id: 'c_' + Math.random().toString(36).substring(2, 9),
      grade: gradeFilter,
      name: formattedName,
      academic_year: academicYear,
      teacher_name: 'Cô Dương Thu Hảo',
      student_count: 0,
    };

    if (isSupabaseConfigured) {
      await supabase.from('classes').insert({
        grade: gradeFilter,
        name: formattedName,
      });
    }

    const updated = [...classes, newClass];
    saveClasses(updated);
    setSelectedClassId(newClass.id);
    setNewClassName('');
    setIsAddClassModalOpen(false);
  };

  // Xóa lớp
  const handleDeleteClass = async (classId: string) => {
    const classToDelete = classes.find((c) => c.id === classId);
    if (confirm(`Cô có chắc chắn muốn xóa ${classToDelete?.name || ''} không?`)) {
      if (isSupabaseConfigured) {
        await supabase.from('classes').delete().eq('id', classId);
      }
      const updatedClasses = classes.filter((c) => c.id !== classId);
      saveClasses(updatedClasses);

      // Xóa luôn học sinh của lớp đó
      if (classToDelete) {
        const remainingStudents = students.filter((s) => s.class_name !== classToDelete.name);
        saveStudents(remainingStudents);
      }

      const remainingInGrade = updatedClasses.filter((c) => Number(c.grade) === Number(gradeFilter));
      if (remainingInGrade.length > 0) {
        setSelectedClassId(remainingInGrade[0].id);
      }
    }
  };

  // Lưu Học sinh (Thêm mới hoặc Sửa)
  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentForm.full_name.trim()) return;

    if (editingStudent) {
      // Sửa thông tin học sinh
      const updated = students.map((s) =>
        s.id === editingStudent.id
          ? {
              ...s,
              full_name: studentForm.full_name.trim(),
              student_code: studentForm.student_code.trim(),
              username: studentForm.username.trim() || s.username,
            }
          : s
      );
      const reindexed = reindexAllStudentCodes(updated, classes);
      saveStudents(reindexed);
    } else {
      // Thêm mới học sinh vào ĐÚNG lớp đang chọn
      const newSt: Profile = {
        id: 's_' + Date.now(),
        student_code: studentForm.student_code.trim() || `HS0${gradeFilter}1`,
        username: studentForm.username.trim() || `hs_${Date.now().toString().slice(-4)}`,
        full_name: studentForm.full_name.trim(),
        role: 'student',
        grade: gradeFilter,
        class_name: currentClass.name,
        xp: 100,
        level: 2,
      };
      const reindexed = reindexAllStudentCodes([...students, newSt], classes);
      saveStudents(reindexed);
    }

    setIsStudentModalOpen(false);
    setEditingStudent(null);
    setStudentForm({ student_code: '', full_name: '', username: '' });
  };

  // Xóa 1 học sinh đơn lẻ
  const handleDeleteStudent = (studentId: string, studentName: string) => {
    if (confirm(`Cô có chắc chắn muốn xóa học sinh "${studentName}" khỏi ${currentClass.name} không?`)) {
      const remaining = students.filter((s) => s.id !== studentId);
      const reindexed = reindexAllStudentCodes(remaining, classes);
      saveStudents(reindexed);
      setSelectedStudentIds((prev) => {
        const next = new Set(prev);
        next.delete(studentId);
        return next;
      });
    }
  };

  // 1. Xóa toàn bộ học sinh của Lớp hiện tại
  const handleDeleteAllInCurrentClass = () => {
    const inClassCount = students.filter((s) => s.class_name === currentClass.name).length;
    if (inClassCount === 0) {
      alert(`${currentClass.name} hiện tại chưa có học sinh nào!`);
      return;
    }
    if (
      confirm(
        `⚠️ CÔ CÓ CHẮC CHẮN MUỐN XÓA TOÀN BỘ ${inClassCount} HỌC SINH CỦA "${currentClass.name}" KHÔNG?\n\nThao tác này sẽ làm sạch danh sách học sinh của lớp để cô có thể nhập hoặc Import file Excel mới.`
      )
    ) {
      const remaining = students.filter((s) => s.class_name !== currentClass.name);
      const reindexed = reindexAllStudentCodes(remaining, classes);
      saveStudents(reindexed);
      setSelectedStudentIds(new Set());
      alert(`✅ Đã xóa sạch toàn bộ học sinh của ${currentClass.name} và đồng bộ lên Đám mây!`);
    }
  };

  // 2. Xóa toàn bộ học sinh của Khối hiện tại
  const handleDeleteAllInCurrentGrade = () => {
    const inGradeCount = students.filter((s) => Number(s.grade) === Number(gradeFilter)).length;
    if (inGradeCount === 0) {
      alert(`Khối ${gradeFilter} hiện tại chưa có học sinh nào!`);
      return;
    }
    if (
      confirm(
        `⚠️ CÔ CÓ CHẮC CHẮN MUỐN XÓA TOÀN BỘ ${inGradeCount} HỌC SINH CỦA "KHỐI ${gradeFilter}" KHÔNG?\n\n(Bao gồm tất cả các lớp của Khối ${gradeFilter})`
      )
    ) {
      const remaining = students.filter((s) => Number(s.grade) !== Number(gradeFilter));
      const reindexed = reindexAllStudentCodes(remaining, classes);
      saveStudents(reindexed);
      setSelectedStudentIds(new Set());
      alert(`✅ Đã xóa sạch ${inGradeCount} học sinh của Khối ${gradeFilter} thành công!`);
    }
  };

  // 3. Xóa sạch 100% toàn bộ học sinh của Toàn trường (4 Khối THCS)
  const handleClearAllStudentsSchool = () => {
    if (students.length === 0) {
      alert('Hiện tại hệ thống không có học sinh nào!');
      return;
    }
    if (
      confirm(
        `🚨 CẢNH BÁO QUAN TRỌNG: CÔ CÓ MUỐN XÓA SẠCH TOÀN BỘ ${students.length} HỌC SINH CỦA TOÀN TRƯỜNG KHÔNG?\n\nThao tác này sẽ làm trống toàn bộ 4 khối lớp để cô nạp lại danh sách học sinh mới từ đầu năm học.`
      )
    ) {
      saveStudents([]);
      setSelectedStudentIds(new Set());
      alert('✅ Đã xóa sạch toàn bộ học sinh của toàn trường và cập nhật lên Đám mây thành công!');
    }
  };

  // 4. Xóa các học sinh được chọn qua Checkbox
  const handleDeleteSelectedStudents = () => {
    if (selectedStudentIds.size === 0) return;
    const count = selectedStudentIds.size;
    if (
      confirm(
        `Cô có chắc chắn muốn xóa ${count} học sinh đã chọn khỏi ${currentClass.name} không?`
      )
    ) {
      const remaining = students.filter((s) => !selectedStudentIds.has(s.id));
      const reindexed = reindexAllStudentCodes(remaining, classes);
      saveStudents(reindexed);
      setSelectedStudentIds(new Set());
      alert(`✅ Đã xóa thành công ${count} học sinh đã chọn!`);
    }
  };

  // Chọn / Bỏ chọn 1 học sinh
  const toggleSelectStudent = (id: string) => {
    setSelectedStudentIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Chọn / Bỏ chọn tất cả học sinh đang hiển thị trong bảng
  const toggleSelectAll = () => {
    if (selectedStudentIds.size === filteredStudents.length && filteredStudents.length > 0) {
      setSelectedStudentIds(new Set());
    } else {
      setSelectedStudentIds(new Set(filteredStudents.map((s) => s.id)));
    }
  };

  // Đánh lại mã học sinh liên tục cho toàn bộ các lớp dựa trên sĩ số thực tế
  const handleReindexGradeCodes = () => {
    const reindexed = reindexAllStudentCodes(students, classes);
    saveStudents(reindexed);
    alert(`✅ Đã đánh lại mã số liên tục cho Khối ${gradeFilter} theo đúng danh sách thực tế của từng lớp!`);
  };

  // Hàm chuyển đổi tiếng Việt có dấu thành username không dấu
  const removeVietnameseTones = (str: string): string => {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'd')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
  };

  // Import học sinh từ file Excel SIÊU THÔNG MINH (Hỗ trợ 100% định dạng: vnEdu, SMAS, file không tiêu đề, file nhiều dòng tiêu đề...)
  const handleImportStudentsExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const dataBuffer = await file.arrayBuffer();
      const wb = XLSX.read(dataBuffer, { type: 'array' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];

      // Đọc toàn bộ bảng Excel dưới dạng mảng 2 chiều
      const rawRows = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, defval: '' });

      if (!rawRows || rawRows.length === 0) {
        alert('File Excel trống hoặc không có nội dung!');
        return;
      }

      let fullNameCol = -1;
      let hoDemCol = -1;
      let tenCol = -1;
      let codeCol = -1;
      let usernameCol = -1;

      // 1. Quét tìm các cột thông qua từ khóa tiêu đề (tìm trong 20 dòng đầu)
      for (let r = 0; r < Math.min(rawRows.length, 20); r++) {
        const row = rawRows[r];
        if (!Array.isArray(row)) continue;

        row.forEach((cell, cIdx) => {
          const text = String(cell || '').trim().toLowerCase();
          if (!text) return;

          if (
            text === 'họ và tên' ||
            text === 'họ tên' ||
            text === 'họ & tên' ||
            text === 'họ và tên học sinh' ||
            text === 'tên học sinh' ||
            text === 'họ và tên hs' ||
            text === 'full name' ||
            text === 'fullname' ||
            text === 'họ tên hs'
          ) {
            if (fullNameCol === -1) fullNameCol = cIdx;
          } else if (
            text === 'họ và đệm' ||
            text === 'họ đệm' ||
            text === 'họ' ||
            text === 'họ và tên đệm' ||
            text === 'họ đệm hs'
          ) {
            if (hoDemCol === -1) hoDemCol = cIdx;
          } else if (text === 'tên' || text === 'tên hs' || text === 'tên gọi') {
            if (tenCol === -1) tenCol = cIdx;
          } else if (
            text.includes('mã học sinh') ||
            text.includes('mã hs') ||
            text.includes('mã định danh') ||
            text === 'student code' ||
            text === 'code' ||
            text === 'mã'
          ) {
            if (codeCol === -1) codeCol = cIdx;
          } else if (
            text.includes('tên đăng nhập') ||
            text.includes('tài khoản') ||
            text === 'username' ||
            text === 'user'
          ) {
            if (usernameCol === -1) usernameCol = cIdx;
          }
        });

        if (fullNameCol !== -1 || (hoDemCol !== -1 && tenCol !== -1)) {
          break;
        }
      }

      // 2. Nếu không tìm thấy cột bằng tiêu đề, tự động quét tìm cột chứa Họ Tên tiếng Việt
      if (fullNameCol === -1 && (hoDemCol === -1 || tenCol === -1)) {
        let bestNameCol = -1;
        let maxNameScore = 0;

        for (let c = 0; c < 20; c++) {
          let score = 0;
          for (let r = 0; r < Math.min(rawRows.length, 30); r++) {
            const val = String(rawRows[r]?.[c] || '').trim();
            // Chuỗi họ tên: có độ dài >= 3, không chỉ là số
            if (val.length >= 3 && !/^\d+$/.test(val) && (val.includes(' ') || /[a-zA-Zà-ỹÀ-Ỹ]/.test(val))) {
              score++;
            }
          }
          if (score > maxNameScore && score >= 2) {
            maxNameScore = score;
            bestNameCol = c;
          }
        }
        if (bestNameCol !== -1) {
          fullNameCol = bestNameCol;
        }
      }

      const newImportedStudents: Profile[] = [];

      // 3. Đọc từ dòng 0 đến hết, kiểm tra từng dòng xem có phải học sinh hay không
      for (let r = 0; r < rawRows.length; r++) {
        const row = rawRows[r];
        if (!Array.isArray(row) || row.length === 0) continue;

        let fullName = '';
        if (fullNameCol !== -1 && row[fullNameCol]) {
          fullName = String(row[fullNameCol]).trim();
        } else if (hoDemCol !== -1 && tenCol !== -1) {
          const ho = String(row[hoDemCol] || '').trim();
          const ten = String(row[tenCol] || '').trim();
          if (ho && ten) fullName = `${ho} ${ten}`.trim();
          else if (ten) fullName = ten;
          else if (ho) fullName = ho;
        } else if (fullNameCol !== -1) {
          for (let c = 0; c < row.length; c++) {
            const candidate = String(row[c] || '').trim();
            if (candidate.length >= 3 && candidate.includes(' ') && !/^\d+$/.test(candidate)) {
              fullName = candidate;
              break;
            }
          }
        }

        // Làm sạch họ và tên: Xóa số thứ tự đầu dòng nếu có (ví dụ "1. Nguyễn Văn A" -> "Nguyễn Văn A")
        fullName = fullName.replace(/^\d+[\.\-\s]+/, '').trim();

        if (!fullName || fullName.length < 2) continue;

        // Bỏ qua các dòng tiêu đề, thông tin trường/lớp/tổng số
        const lowerName = fullName.toLowerCase();
        const isHeaderOrMeta =
          /^(stt|tt|số tt|thứ tự|mã|mã hs|mã học sinh|mã định danh|họ và tên|họ tên|họ & tên|họ và đệm|họ đệm|tên|tên học sinh|ngày sinh|giới tính|dân tộc|địa chỉ|nơi sinh|lớp|khối|năm học|trường|phòng giáo dục|bộ giáo dục|sở giáo dục|danh sách|danh sách học sinh|bảng điểm|tổng số|người lập|giáo viên|hiệu trưởng|ban giám hiệu|ghi chú|kết quả|xếp loại|điểm số)$/i.test(
            lowerName
          ) ||
          lowerName.startsWith('tổng số') ||
          lowerName.startsWith('danh sách học sinh') ||
          lowerName.startsWith('trường th') ||
          lowerName.startsWith('trường ptdtbt') ||
          lowerName.startsWith('bộ giáo dục') ||
          lowerName.startsWith('sở giáo dục') ||
          lowerName.startsWith('phòng giáo dục') ||
          lowerName.startsWith('giáo viên phụ trách') ||
          lowerName.startsWith('người lập biểu') ||
          /^\d+$/.test(fullName);

        if (isHeaderOrMeta) {
          continue;
        }

        const customCode = codeCol !== -1 && row[codeCol] ? String(row[codeCol]).trim() : '';
        const customUsername = usernameCol !== -1 && row[usernameCol] ? String(row[usernameCol]).trim() : '';
        const cleanUname = customUsername || `${removeVietnameseTones(fullName)}${gradeFilter}${newImportedStudents.length + 1}`;

        newImportedStudents.push({
          id: 's_imp_' + Date.now() + '_' + r + '_' + newImportedStudents.length,
          student_code: customCode || `HS0${gradeFilter}${newImportedStudents.length + 1}`,
          full_name: fullName,
          username: cleanUname,
          role: 'student',
          grade: gradeFilter,
          class_name: currentClass.name,
          xp: 100,
          level: 2,
          avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanUname}`,
        });
      }

      if (newImportedStudents.length === 0) {
        alert(
          'Không tìm thấy danh sách họ tên trong file Excel. Cô vui lòng kiểm tra file có cột "Họ và tên" hoặc "Họ và đệm" + "Tên" nhé!'
        );
        return;
      }

      // Lọc bỏ học sinh cũ của riêng lớp này trước khi nạp mới
      const otherStudents = students.filter((s) => s.class_name !== currentClass.name);
      const combined = [...otherStudents, ...newImportedStudents];
      const reindexed = reindexAllStudentCodes(combined, classes);
      saveStudents(reindexed);

      alert(`🎉 Đã import thành công ĐẦY ĐỦ ${newImportedStudents.length} học sinh vào ${currentClass.name} và tự động đánh mã liên tục!`);
    } catch (err) {
      console.error('Lỗi khi đọc file Excel:', err);
      alert('Đã xảy ra lỗi khi đọc file Excel. Cô vui lòng thử lại hoặc tải file mẫu để kiểm tra nhé!');
    } finally {
      e.target.value = '';
    }
  };

  // Tải file mẫu danh sách học sinh
  const downloadStudentExcelTemplate = () => {
    const templateData = [
      { 'Mã học sinh': `HS0${gradeFilter}1`, 'Họ và tên': 'Tẩn Thị Lan Anh', 'Tên đăng nhập': 'tanthilananh' },
      { 'Mã học sinh': `HS0${gradeFilter}2`, 'Họ và tên': 'Phàn Ngọc Anh', 'Tên đăng nhập': 'phanngocanh' },
      { 'Mã học sinh': `HS0${gradeFilter}3`, 'Họ và tên': 'Phàn Thúy Anh', 'Tên đăng nhập': 'phanthuyanh' },
      { 'Mã học sinh': `HS0${gradeFilter}4`, 'Họ và tên': 'Lò Giá Bè', 'Tên đăng nhập': 'logiabe' },
      { 'Mã học sinh': `HS0${gradeFilter}5`, 'Họ và tên': 'Chang Dì Bư', 'Tên đăng nhập': 'changdibu' },
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Danh_Sach_Hoc_Sinh');
    XLSX.writeFile(wb, `Mau_Danh_Sach_Hoc_Sinh_${currentClass.name}.xlsx`);
  };

  // LỌC HỌC SINH: CHỈ HIỂN THỊ HỌC SINH CỦA ĐÚNG LỚP ĐANG ĐƯỢC CHỌN (SẮP XẾP CHUẨN A - Z THEO TÊN)
  const filteredStudents = useMemo(() => {
    return students
      .filter((s) => {
        // 1. Phải thuộc đúng lớp đang chọn
        const isSameClass = s.class_name === currentClass.name;
        if (!isSameClass) return false;

        // 2. Lọc theo từ khóa tìm kiếm
        if (!searchTerm.trim()) return true;
        const term = searchTerm.toLowerCase();
        return (
          s.full_name.toLowerCase().includes(term) ||
          (s.student_code && s.student_code.toLowerCase().includes(term))
        );
      })
      .sort((a, b) => compareVietnameseNames(a.full_name, b.full_name));
  }, [students, currentClass.name, searchTerm]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <School className="w-6 h-6 text-ocean-600" />
            <span>Quản Lý Lớp Học & Học Sinh</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Năm học {academicYear} • Trường PTDTBT TH&THCS Sì Lở Lầu
          </p>
        </div>

        {/* Khu vực trạng thái Đám mây & 4 Nút Chọn Khối */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Huy hiệu tình trạng kết nối Đám mây (Gợi ý 3) */}
          <div
            className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200/90 rounded-2xl shadow-2xs cursor-pointer hover:bg-emerald-100/70 transition"
            onClick={handleManualCloudSync}
            title="Đám mây Supabase Cloud đang kết nối ổn định. Bấm để đồng bộ lại ngay!"
          >
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <div className="flex items-center gap-1.5 text-emerald-950 font-black text-xs">
              <Cloud className="w-3.5 h-3.5 text-emerald-600" />
              <span>Đã đồng bộ Đám mây</span>
              <span className="text-emerald-700/80 font-semibold text-[11px]">({lastSyncedTime})</span>
            </div>
          </div>

          {/* 4 Nút Chọn Khối To Rõ */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl">
            {[6, 7, 8, 9].map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => handleSelectGrade(g)}
                className={`px-4 py-2 rounded-xl text-xs font-black transition ${
                  gradeFilter === g
                    ? 'bg-ocean-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Khối {g}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleResetDefaultClasses}
            className="p-2 rounded-xl text-slate-400 hover:text-ocean-600 hover:bg-ocean-50 border border-slate-200 transition"
            title="Khôi phục 16 lớp THCS chuẩn"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleClearAllStudentsSchool}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold transition active:scale-95 cursor-pointer"
            title="Xóa sạch toàn bộ học sinh 4 khối (Toàn trường) để nạp mới"
          >
            <Eraser className="w-3.5 h-3.5 text-red-600" />
            <span className="hidden sm:inline">Xóa Toàn Trường</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Danh sách các Lớp của Khối đã chọn (Cột bên trái) */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-slate-900 text-base">Khối {gradeFilter}</h3>
            <button
              type="button"
              onClick={() => setIsAddClassModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-ocean-50 text-ocean-700 hover:bg-ocean-100 transition text-xs font-bold flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Thêm Lớp
            </button>
          </div>

          <div className="space-y-2">
            {currentGradeClasses.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                Chưa có lớp nào ở Khối {gradeFilter}. Cô bấm "Thêm Lớp" nhé!
              </div>
            ) : (
              currentGradeClasses.map((cls) => {
                const isSelected = cls.id === selectedClassId;
                // Đếm CHÍNH XÁC số lượng học sinh của riêng lớp này
                const studentCount = students.filter((s) => s.class_name === cls.name).length;

                return (
                  <div
                    key={cls.id}
                    onClick={() => setSelectedClassId(cls.id)}
                    className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-ocean-50 border-ocean-400 text-ocean-950 font-bold shadow-xs'
                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black ${
                          isSelected ? 'bg-ocean-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {cls.name.replace('Lớp ', '')}
                      </div>
                      <div>
                        <div className="text-xs font-bold">{cls.name}</div>
                        <div className={`text-[10px] ${studentCount > 0 ? 'text-ocean-700 font-semibold' : 'text-slate-400'}`}>
                          {studentCount} Học sinh
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClass(cls.id);
                      }}
                      title="Xóa lớp này"
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Bảng Danh Sách Học Sinh của Lớp (Cột bên phải) */}
        <div className="lg:col-span-3 bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <span>{currentClass.name}</span>
                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                    filteredStudents.length > 0
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {filteredStudents.length} Học Sinh
                </span>
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Giáo viên phụ trách: Cô Dương Thu Hảo
              </p>
            </div>

            {/* Các nút thao tác */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleReindexGradeCodes}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold transition active:scale-95 cursor-pointer"
                title="Đánh lại số thứ tự mã học sinh liên tục từ A1 đến A4 theo số lượng thực tế"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-600" /> Đánh Lại Mã HS
              </button>

              <button
                type="button"
                onClick={downloadStudentExcelTemplate}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition active:scale-95 cursor-pointer"
                title="Tải file Excel mẫu để nhập danh sách"
              >
                <Download className="w-3.5 h-3.5" /> Mẫu Excel
              </button>

              <label className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold cursor-pointer transition active:scale-95">
                <Upload className="w-3.5 h-3.5" /> Import Excel
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleImportStudentsExcel}
                  className="hidden"
                />
              </label>

              {/* Nút Xóa Cả Lớp (Gợi ý 1) */}
              <button
                type="button"
                onClick={handleDeleteAllInCurrentClass}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold transition active:scale-95 cursor-pointer"
                title={`Xóa sạch toàn bộ học sinh của ${currentClass.name}`}
              >
                <Trash2 className="w-3.5 h-3.5 text-red-600" /> Xóa Cả Lớp
              </button>

              {/* Nút Xóa Cả Khối */}
              <button
                type="button"
                onClick={handleDeleteAllInCurrentGrade}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition active:scale-95 cursor-pointer"
                title={`Xóa toàn bộ học sinh của tất cả các lớp thuộc Khối ${gradeFilter}`}
              >
                <Eraser className="w-3.5 h-3.5 text-rose-600" /> Xóa Khối {gradeFilter}
              </button>

              {/* Nút Đồng Bộ Đám Mây */}
              <button
                type="button"
                onClick={handleManualCloudSync}
                disabled={isSyncingCloud}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-xs font-bold transition active:scale-95 cursor-pointer disabled:opacity-50"
                title="Bấm để đồng bộ ngay toàn bộ danh sách học sinh lên Supabase Cloud cho điện thoại nhận diện"
              >
                <CloudUpload className={`w-3.5 h-3.5 ${isSyncingCloud ? 'animate-bounce text-sky-600' : 'text-sky-600'}`} />
                <span>{isSyncingCloud ? 'Đang đồng bộ...' : 'Đồng Bộ Đám Mây'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEditingStudent(null);
                  setStudentForm({
                    student_code: `HS0${gradeFilter}1`,
                    full_name: '',
                    username: '',
                  });
                  setIsStudentModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-ocean-600 hover:bg-ocean-500 active:scale-95 text-white text-xs font-bold shadow-xs transition cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" /> Thêm Học Sinh
              </button>
            </div>
          </div>

          {/* Thanh công cụ khi chọn nhiều học sinh qua Checkbox */}
          {selectedStudentIds.size > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-red-50/90 border border-red-200 rounded-2xl animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2 text-xs font-bold text-red-900">
                <CheckSquare className="w-4 h-4 text-red-600 shrink-0" />
                <span>
                  Đã chọn <strong className="text-red-700 text-sm underline">{selectedStudentIds.size}</strong> học sinh trong {currentClass.name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedStudentIds(new Set())}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold transition cursor-pointer"
                >
                  Bỏ chọn
                </button>
                <button
                  type="button"
                  onClick={handleDeleteSelectedStudents}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black shadow-xs transition active:scale-95 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa {selectedStudentIds.size} học sinh đã chọn</span>
                </button>
              </div>
            </div>
          )}

          {/* Thanh Tìm Kiếm Học Sinh */}
          <div className="relative">
            <input
              type="text"
              placeholder={`Tìm kiếm học sinh trong ${currentClass.name}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-ocean-500 focus:bg-white transition"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>

          {/* Bảng Danh Sách Học Sinh */}
          <div className="overflow-x-auto">
            {filteredStudents.length === 0 ? (
              <div className="p-8 text-center space-y-3 bg-slate-50 rounded-2xl border border-dashed border-slate-200 my-2">
                <Users className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-500 font-medium">
                  {currentClass.name} hiện chưa có học sinh nào.
                </p>
                <div className="flex items-center justify-center gap-2">
                  <label className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold cursor-pointer hover:bg-emerald-500 transition">
                    Import Danh Sách Từ Excel
                    <input
                      type="file"
                      accept=".xlsx, .xls"
                      onChange={handleImportStudentsExcel}
                      className="hidden"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingStudent(null);
                      setStudentForm({
                        student_code: `HS0${gradeFilter}0${students.length + 1}`,
                        full_name: '',
                        username: '',
                      });
                      setIsStudentModalOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-ocean-600 text-white text-xs font-bold hover:bg-ocean-500 transition"
                  >
                    + Thêm Thủ Công
                  </button>
                </div>
              </div>
            ) : (
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 text-slate-500 font-black uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={filteredStudents.length > 0 && selectedStudentIds.size === filteredStudents.length}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded text-ocean-600 focus:ring-ocean-500 border-slate-300 cursor-pointer"
                        title="Chọn tất cả học sinh"
                      />
                    </th>
                    <th className="py-3 px-3">STT</th>
                    <th className="py-3 px-3">Mã Học Sinh</th>
                    <th className="py-3 px-3">Họ và Tên</th>
                    <th className="py-3 px-3">Cấp Độ / XP</th>
                    <th className="py-3 px-3 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map((st, idx) => {
                    const isSelected = selectedStudentIds.has(st.id);
                    return (
                      <tr
                        key={st.id}
                        className={`transition ${
                          isSelected ? 'bg-red-50/70' : 'hover:bg-slate-50/80'
                        }`}
                      >
                        <td className="py-3 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectStudent(st.id)}
                            className="w-4 h-4 rounded text-ocean-600 focus:ring-ocean-500 border-slate-300 cursor-pointer"
                          />
                        </td>
                        <td className="py-3 px-3 text-slate-400 font-mono">{idx + 1}</td>
                        <td className="py-3 px-3 font-mono font-bold text-ocean-700">
                          {st.student_code || `HS0${gradeFilter}${idx + 1}`}
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-900">{st.full_name}</td>
                        <td className="py-3 px-3">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold">
                            <Zap className="w-3 h-3 fill-amber-500 text-amber-500" />
                            Cấp {st.level || 1} • {st.xp || 100} XP
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedStudentForBadge(st);
                                setIsBadgeModalOpen(true);
                              }}
                              title="Trao tặng Huy hiệu Danh dự cho học sinh"
                              className="p-1.5 text-amber-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                            >
                              <Award className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedStudentForXp(st);
                                setIsGrantXpOpen(true);
                              }}
                              title="Tặng XP thưởng cho học sinh"
                              className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                            >
                              <Zap className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingStudent(st);
                                setStudentForm({
                                  student_code: st.student_code || '',
                                  full_name: st.full_name,
                                  username: st.username,
                                });
                                setIsStudentModalOpen(true);
                              }}
                              title="Sửa thông tin học sinh"
                              className="p-1.5 text-slate-400 hover:text-ocean-600 hover:bg-ocean-50 rounded-lg transition cursor-pointer"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteStudent(st.id, st.full_name)}
                              title="Xóa học sinh này"
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
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
            )}
          </div>
        </div>
      </div>

      {/* MODAL THÊM LỚP MỚI */}
      {isAddClassModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="font-black text-slate-900 text-base">
              Thêm Lớp Mới Vào Khối {gradeFilter}
            </h3>
            <form onSubmit={handleAddClass} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tên Lớp (Ví dụ: 6A5, 7A5, 8A5...):
                </label>
                <input
                  type="text"
                  placeholder={`Ví dụ: Lớp ${gradeFilter}A5`}
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-ocean-500 focus:outline-none"
                  required
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddClassModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-black text-white bg-ocean-600 hover:bg-ocean-700 rounded-xl shadow-xs transition"
                >
                  Tạo Lớp
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL THÊM / SỬA HỌC SINH */}
      {isStudentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="font-black text-slate-900 text-base">
              {editingStudent ? `Sửa Thông Tin Học Sinh (${currentClass.name})` : `Thêm Học Sinh Mới Vào ${currentClass.name}`}
            </h3>
            <form onSubmit={handleSaveStudent} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Họ và Tên Học Sinh:
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Tẩn Thị Lan Anh"
                  value={studentForm.full_name}
                  onChange={(e) => setStudentForm({ ...studentForm, full_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-ocean-500 focus:outline-none"
                  required
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mã Học Sinh:
                </label>
                <input
                  type="text"
                  placeholder={`Ví dụ: HS0${gradeFilter}1`}
                  value={studentForm.student_code}
                  onChange={(e) => setStudentForm({ ...studentForm, student_code: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-ocean-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tên Đăng Nhập (Không dấu):
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: tanthilananh"
                  value={studentForm.username}
                  onChange={(e) => setStudentForm({ ...studentForm, username: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-ocean-500 focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsStudentModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-black text-white bg-ocean-600 hover:bg-ocean-700 rounded-xl shadow-xs transition"
                >
                  {editingStudent ? 'Lưu Thay Đổi' : 'Thêm Vào Lớp'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TẶNG THƯỞNG XP */}
      {isGrantXpOpen && selectedStudentForXp && (
        <GrantXpModal
          isOpen={isGrantXpOpen}
          onClose={() => {
            setIsGrantXpOpen(false);
            setSelectedStudentForXp(null);
          }}
          student={selectedStudentForXp}
          onSuccess={(stId: string, earnedXp: number) => {
            const updated = students.map((s) =>
              s.id === stId
                ? {
                    ...s,
                    xp: Number(s.xp || 0) + Number(earnedXp),
                    level: Math.floor((Number(s.xp || 0) + Number(earnedXp)) / 200) + 1,
                  }
                : s
            );
            saveStudents(updated);
          }}
        />
      )}

      {/* MODAL TRAO TẶNG HUY HIỆU DANH DỰ CHO HỌC SINH */}
      {isBadgeModalOpen && selectedStudentForBadge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Trao Tặng Huy Hiệu Cho Em {selectedStudentForBadge.full_name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Mã số: <strong className="text-ocean-700">{selectedStudentForBadge.student_code}</strong> • {selectedStudentForBadge.class_name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsBadgeModalOpen(false);
                  setSelectedStudentForBadge(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 leading-relaxed font-medium">
              💡 <strong>Hướng dẫn cô Hảo:</strong> Cô bấm trực tiếp vào từng ô huy hiệu bên dưới để Bật (Sáng vàng) hoặc Tắt. Khi cô bật, bên góc học tập của học sinh sẽ sáng bừng huy hiệu đó kèm thông báo khen thưởng ngay lập tức!
            </div>

            <BadgeList
              unlockedBadgeIds={getStudentBadges(
                selectedStudentForBadge.student_code || selectedStudentForBadge.id,
                selectedStudentForBadge.full_name
              )}
              onToggleBadge={(badgeId) => {
                toggleBadgeForStudent(
                  selectedStudentForBadge.student_code || selectedStudentForBadge.id,
                  badgeId,
                  selectedStudentForBadge.full_name
                );
                setBadgeRefresh((k) => k + 1);
              }}
              isTeacherMode={true}
            />

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setIsBadgeModalOpen(false);
                  setSelectedStudentForBadge(null);
                }}
                className="px-5 py-2 rounded-xl bg-ocean-600 hover:bg-ocean-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
              >
                Hoàn Tất & Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
