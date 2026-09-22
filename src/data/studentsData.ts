import { Profile, ClassItem } from '../types/database';

export const INITIAL_CLASSES: ClassItem[] = [
  // Khối 6
  { id: 'c_6a1', grade: 6, name: 'Lớp 6A1', academic_year: '2026-2027', student_count: 0, teacher_name: 'Cô Dương Thu Hảo' },
  { id: 'c_6a2', grade: 6, name: 'Lớp 6A2', academic_year: '2026-2027', student_count: 0, teacher_name: 'Cô Dương Thu Hảo' },
  { id: 'c_6a3', grade: 6, name: 'Lớp 6A3', academic_year: '2026-2027', student_count: 0, teacher_name: 'Cô Dương Thu Hảo' },
  { id: 'c_6a4', grade: 6, name: 'Lớp 6A4', academic_year: '2026-2027', student_count: 0, teacher_name: 'Cô Dương Thu Hảo' },

  // Khối 7
  { id: 'c_7a1', grade: 7, name: 'Lớp 7A1', academic_year: '2026-2027', student_count: 3, teacher_name: 'Cô Dương Thu Hảo' },
  { id: 'c_7a2', grade: 7, name: 'Lớp 7A2', academic_year: '2026-2027', student_count: 18, teacher_name: 'Cô Dương Thu Hảo' },
  { id: 'c_7a3', grade: 7, name: 'Lớp 7A3', academic_year: '2026-2027', student_count: 0, teacher_name: 'Cô Dương Thu Hảo' },
  { id: 'c_7a4', grade: 7, name: 'Lớp 7A4', academic_year: '2026-2027', student_count: 0, teacher_name: 'Cô Dương Thu Hảo' },

  // Khối 8
  { id: 'c_8a1', grade: 8, name: 'Lớp 8A1', academic_year: '2026-2027', student_count: 0, teacher_name: 'Cô Dương Thu Hảo' },
  { id: 'c_8a2', grade: 8, name: 'Lớp 8A2', academic_year: '2026-2027', student_count: 0, teacher_name: 'Cô Dương Thu Hảo' },
  { id: 'c_8a3', grade: 8, name: 'Lớp 8A3', academic_year: '2026-2027', student_count: 0, teacher_name: 'Cô Dương Thu Hảo' },
  { id: 'c_8a4', grade: 8, name: 'Lớp 8A4', academic_year: '2026-2027', student_count: 0, teacher_name: 'Cô Dương Thu Hảo' },

  // Khối 9
  { id: 'c_9a1', grade: 9, name: 'Lớp 9A1', academic_year: '2026-2027', student_count: 9, teacher_name: 'Cô Dương Thu Hảo' },
  { id: 'c_9a2', grade: 9, name: 'Lớp 9A2', academic_year: '2026-2027', student_count: 15, teacher_name: 'Cô Dương Thu Hảo' },
  { id: 'c_9a3', grade: 9, name: 'Lớp 9A3', academic_year: '2026-2027', student_count: 0, teacher_name: 'Cô Dương Thu Hảo' },
  { id: 'c_9a4', grade: 9, name: 'Lớp 9A4', academic_year: '2026-2027', student_count: 0, teacher_name: 'Cô Dương Thu Hảo' },
];

// Danh sách họ tên học sinh thực tế của Khối 7 (Từ dữ liệu thực tế tại trường của Cô Hảo)
const GRADE_7_NAMES: { [className: string]: string[] } = {
  'Lớp 7A1': [
    'Phàn Thúy Anh',
    'Phu Mờ Chăn',
    'Lù Hờ Số'
  ],
  'Lớp 7A2': [
    'Tẩn Vân Anh',
    'Lường Thị Hải Băng',
    'Ly Xá Be',
    'Phu Mờ Chăn',
    'Lò Dá De',
    'Ly Che Dừ',
    'Nhù Tre Gà',
    'Phàn Ngọc Hà',
    'Phàn Thúy Ngọc Hà',
    'Lý Thị Hạnh',
    'Tẩn Mai Hiền',
    'Tẩn Xoang Liều',
    'Tẩn Tiến Minh',
    'Chẻo Ngọc Nhi',
    'Giàng Xá Nông',
    'Giàng Đô Sô',
    'Tẩn Tiến Toàn',
    'Chang Dừ Xô'
  ],
  'Lớp 7A3': [],
  'Lớp 7A4': []
};

// Danh sách họ tên học sinh thực tế của Khối 9 (Từ dữ liệu thực tế tại trường của Cô Hảo)
const GRADE_9_NAMES: { [className: string]: string[] } = {
  'Lớp 9A1': [
    'Tẩn Tả Mẩy Chiều',
    'Lù Dừ Gơ',
    'Phàn Thị Hà',
    'Tẩn Long Hồi',
    'Giàng Dế Hờ',
    'Hoàng Gia Thành Long',
    'Phùng Thị Ngân',
    'Giàng Mè Sô',
    'Cồ Thu Thảo'
  ],
  'Lớp 9A2': [
    'Phàn Lở Mẩy (16/6)',
    'Phàn Lở Mẩy (9/8)',
    'Chang Thồ Bư',
    'Chẻo Mai Hà',
    'Tẩn Văn Khánh',
    'Phàn Mai Lâm',
    'Tẩn Diệu Linh',
    'Chẻo Lở Mẩy',
    'Lý Tả Mẩy',
    'Tẩn Lở Mẩy',
    'Tẩn San Mẩy',
    'Tẩn Tả Mẩy',
    'Phàn Thủy Ngọc Minh',
    'Tẩn Hạo Nam',
    'Tẩn Chỉn Thanh'
  ],
  'Lớp 9A3': [],
  'Lớp 9A4': []
};

export const removeVietnameseTones = (str: string): string => {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
};

/**
 * HÀM SO SÁNH HỌ VÀ TÊN THEO CHUẨN TIẾNG VIỆT:
 * 1. So sánh TÊN gọi (từ cuối cùng trong họ và tên) theo bảng chữ cái A-Z
 * 2. Nếu cùng Tên -> So sánh Họ và Tên đệm
 */
export const compareVietnameseNames = (nameA: string, nameB: string): number => {
  if (!nameA) return -1;
  if (!nameB) return 1;

  const partsA = nameA.trim().split(/\s+/);
  const partsB = nameB.trim().split(/\s+/);

  const firstNameA = partsA[partsA.length - 1] || '';
  const firstNameB = partsB[partsB.length - 1] || '';

  const cmpFirst = firstNameA.localeCompare(firstNameB, 'vi', { sensitivity: 'base' });
  if (cmpFirst !== 0) return cmpFirst;

  const restA = partsA.slice(0, partsA.length - 1).join(' ');
  const restB = partsB.slice(0, partsB.length - 1).join(' ');
  return restA.localeCompare(restB, 'vi', { sensitivity: 'base' });
};

/**
 * HÀM ĐÁNH LẠI MÃ HỌC SINH TỰ ĐỘNG THEO SỐ LƯỢNG THỰC TẾ CỦA TỪNG LỚP:
 * - Tự động sắp xếp học sinh trong từng lớp theo chuẩn Tiếng Việt (A - Z theo Tên).
 * - Đánh số liên tục từ 1 đến N trong khối (Khối 6: HS06..., Khối 7: HS07..., Khối 8: HS08..., Khối 9: HS09...).
 * - Đảm bảo thứ tự hiển thị trong Sổ Điểm, Dropdown làm bài và Bảng Báo Cáo trùng khớp 100%.
 */
export const reindexAllStudentCodes = (
  studentsList: Profile[],
  classesList: ClassItem[] = INITIAL_CLASSES
): Profile[] => {
  const result: Profile[] = [];
  const grades = [6, 7, 8, 9];

  grades.forEach((g) => {
    const prefix = `HS0${g}`;
    let gradeCounter = 1; // Số thứ tự liên tục trong khối

    // Lấy các lớp của khối này và sắp xếp theo tên lớp (A1, A2, A3, A4...)
    const gradeClasses = classesList
      .filter((c) => Number(c.grade) === Number(g))
      .sort((a, b) => a.name.localeCompare(b.name, 'vi'));

    gradeClasses.forEach((cls) => {
      // Lấy danh sách học sinh THỰC TẾ thuộc lớp này VÀ sắp xếp chuẩn Tiếng Việt A-Z
      const classStudents = studentsList
        .filter((s) => s.class_name === cls.name)
        .sort((a, b) => compareVietnameseNames(a.full_name, b.full_name));

      classStudents.forEach((st) => {
        const studentCode = `${prefix}${gradeCounter}`;
        result.push({
          ...st,
          student_code: studentCode,
          grade: g,
          class_name: cls.name,
        });
        gradeCounter++;
      });
    });

    // Gom cả các học sinh cùng khối nhưng không khớp tên lớp chuẩn (nếu có)
    const otherGradeStudents = studentsList
      .filter(
        (s) =>
          Number(s.grade) === Number(g) &&
          !gradeClasses.some((c) => c.name === s.class_name)
      )
      .sort((a, b) => compareVietnameseNames(a.full_name, b.full_name));

    otherGradeStudents.forEach((st) => {
      const studentCode = `${prefix}${gradeCounter}`;
      result.push({
        ...st,
        student_code: studentCode,
        grade: g,
      });
      gradeCounter++;
    });
  });

  return result;
};

// Khởi tạo danh sách học sinh ban đầu (CHỈ CÓ KHỐI 7 VÀ KHỐI 9 THỰC TẾ, KHÔNG CÓ TÊN GIẢ Ở KHỐI 6 & 8)
export const generateInitialRealStudents = (): Profile[] => {
  const rawStudents: Profile[] = [];

  // Khối 7
  let g7Index = 1;
  Object.entries(GRADE_7_NAMES).forEach(([className, names]) => {
    names.forEach((name) => {
      const code = `HS07${g7Index}`;
      const uname = `${removeVietnameseTones(name)}7${g7Index}`;
      rawStudents.push({
        id: `s_7_${g7Index}`,
        student_code: code,
        username: uname,
        full_name: name,
        role: 'student',
        grade: 7,
        class_name: className,
        xp: 100 + (g7Index * 5) % 300,
        level: 2,
        avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${code}`,
      });
      g7Index++;
    });
  });

  // Khối 9
  let g9Index = 1;
  Object.entries(GRADE_9_NAMES).forEach(([className, names]) => {
    names.forEach((name) => {
      const code = `HS09${g9Index}`;
      const uname = `${removeVietnameseTones(name)}9${g9Index}`;
      rawStudents.push({
        id: `s_9_${g9Index}`,
        student_code: code,
        username: uname,
        full_name: name,
        role: 'student',
        grade: 9,
        class_name: className,
        xp: 120 + (g9Index * 5) % 350,
        level: 2,
        avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${code}`,
      });
      g9Index++;
    });
  });

  // Khối 6 và Khối 8: ĐỂ TRỐNG ĐỂ CÔ HẢO TỰ NHẬP / IMPORT EXCEL, TUYỆT ĐỐI KHÔNG CHÈN TÊN GIẢ
  return rawStudents;
};

export const INITIAL_STUDENTS: Profile[] = generateInitialRealStudents();

// Lấy danh sách học sinh từ LocalStorage và đánh số lại mã HS liên tục dựa trên học sinh hiện có
export const getStoredStudents = (): Profile[] => {
  try {
    const saved = localStorage.getItem('geo_classes_students');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Lọc bỏ bất kỳ học sinh giả nào bị chèn nhầm ở Khối 6 và Khối 8 nếu có tiền tố s_6_ hoặc s_8_
        const cleaned = parsed.filter((s: Profile) => {
          // Giữ lại tất cả học sinh Khối 7 & 9, và bất kỳ học sinh nào do cô tự thêm (id không phải dạng s_6_ tự tạo)
          if (s.grade === 6 || s.grade === 8) {
            return !s.id.startsWith('s_6_') && !s.id.startsWith('s_8_');
          }
          return true;
        });

        const reindexed = reindexAllStudentCodes(cleaned, INITIAL_CLASSES);
        localStorage.setItem('geo_classes_students', JSON.stringify(reindexed));
        return reindexed;
      }
    }
  } catch (e) {
    console.warn('Lỗi đọc students từ LocalStorage:', e);
  }

  localStorage.setItem('geo_classes_students', JSON.stringify(INITIAL_STUDENTS));
  return INITIAL_STUDENTS;
};

export const saveStoredStudents = (students: Profile[]) => {
  localStorage.setItem('geo_classes_students', JSON.stringify(students));
};
