import { Profile, ClassItem } from '../types/database';

export const INITIAL_CLASSES: ClassItem[] = [
  // Khối 6
  { id: 'c_6a1', grade: 6, name: 'Lớp 6A1', academic_year: '2026-2027', student_count: 0, teacher_name: 'Cô Dương Thu Hảo' },
  { id: 'c_6a2', grade: 6, name: 'Lớp 6A2', academic_year: '2026-2027', student_count: 0, teacher_name: 'Cô Dương Thu Hảo' },
  { id: 'c_6a3', grade: 6, name: 'Lớp 6A3', academic_year: '2026-2027', student_count: 0, teacher_name: 'Cô Dương Thu Hảo' },
  { id: 'c_6a4', grade: 6, name: 'Lớp 6A4', academic_year: '2026-2027', student_count: 0, teacher_name: 'Cô Dương Thu Hảo' },

  // Khối 7
  { id: 'c_7a1', grade: 7, name: 'Lớp 7A1', academic_year: '2026-2027', student_count: 39, teacher_name: 'Cô Dương Thu Hảo' },
  { id: 'c_7a2', grade: 7, name: 'Lớp 7A2', academic_year: '2026-2027', student_count: 39, teacher_name: 'Cô Dương Thu Hảo' },
  { id: 'c_7a3', grade: 7, name: 'Lớp 7A3', academic_year: '2026-2027', student_count: 39, teacher_name: 'Cô Dương Thu Hảo' },
  { id: 'c_7a4', grade: 7, name: 'Lớp 7A4', academic_year: '2026-2027', student_count: 39, teacher_name: 'Cô Dương Thu Hảo' },

  // Khối 8
  { id: 'c_8a1', grade: 8, name: 'Lớp 8A1', academic_year: '2026-2027', student_count: 0, teacher_name: 'Cô Dương Thu Hảo' },
  { id: 'c_8a2', grade: 8, name: 'Lớp 8A2', academic_year: '2026-2027', student_count: 0, teacher_name: 'Cô Dương Thu Hảo' },
  { id: 'c_8a3', grade: 8, name: 'Lớp 8A3', academic_year: '2026-2027', student_count: 0, teacher_name: 'Cô Dương Thu Hảo' },
  { id: 'c_8a4', grade: 8, name: 'Lớp 8A4', academic_year: '2026-2027', student_count: 0, teacher_name: 'Cô Dương Thu Hảo' },

  // Khối 9
  { id: 'c_9a1', grade: 9, name: 'Lớp 9A1', academic_year: '2026-2027', student_count: 39, teacher_name: 'Cô Dương Thu Hảo' },
  { id: 'c_9a2', grade: 9, name: 'Lớp 9A2', academic_year: '2026-2027', student_count: 39, teacher_name: 'Cô Dương Thu Hảo' },
  { id: 'c_9a3', grade: 9, name: 'Lớp 9A3', academic_year: '2026-2027', student_count: 39, teacher_name: 'Cô Dương Thu Hảo' },
  { id: 'c_9a4', grade: 9, name: 'Lớp 9A4', academic_year: '2026-2027', student_count: 39, teacher_name: 'Cô Dương Thu Hảo' },
];

// Danh sách họ tên học sinh thực tế của Khối 7 (Đã sắp xếp chuẩn A-Z theo Tên)
const GRADE_7_NAMES: { [className: string]: string[] } = {
  'Lớp 7A1': [
    'Phàn Ngọc Anh', 'Phàn Thúy Anh', 'Tẩn Thị Lan Anh', 'Lò Giá Bè', 'Chang Dì Bư',
    'Lù Sán Ca', 'Phu Mờ Chăn', 'Phu A Ché', 'Vàng A Chơ', 'Chang Xa Da',
    'Giàng Đô Dì', 'Thào A Dơ', 'Vàng Thị Dở', 'Tẩn A Dũng', 'Tẩn Kim Dung',
    'Chẻo Văn Đô', 'Chang Thúy Hằng', 'Sùng Thị Hoa', 'Lò Văn Hoan', 'Lù Văn Hùng',
    'Tẩn A Lầu', 'Vàng A Lềnh', 'Chẻo Thị Mai', 'Lý Tả Mẩy', 'Giàng Thị Mỵ',
    'Lò Thị Nết', 'Lý Kim Ngân', 'Phàn Yến Nhi', 'Sùng A Páo', 'Chang Văn Quý',
    'Thào A Sáng', 'Giàng A Say', 'Phu Thị Sen', 'Chẻo A Sính', 'Lù Thị Thảo',
    'Thào A Tủa', 'Phàn Quốc Tuấn', 'Lý A Vang', 'Sùng A Vừ'
  ],
  'Lớp 7A2': [
    'Tẩn Vân Anh', 'Tẩn Minh Bảo', 'Lường Thị Hải Băng', 'Ly Xá Be', 'Giàng Gà Bứ',
    'Phu Mờ Chăn', 'Tẩn A Chiến', 'Lý Văn Cường', 'Lò Dá De', 'Vàng A Dì',
    'Chẻo Thúy Diễm', 'Thào Thị Gâu', 'Sùng A Hải', 'Phàn Văn Khang', 'Tẩn Thúy Kiều',
    'Lường A Lử', 'Lù Thị Ly', 'Ly Văn Mạnh', 'Phàn Thị Mây', 'Chang A Minh',
    'Tẩn A Nam', 'Giàng Thị Nga', 'Phu A Nhì', 'Lý Thị Nở', 'Vàng Thị Oanh',
    'Lường Văn Phong', 'Chẻo Văn Phúc', 'Ly Thị Quỳnh', 'Thào Thị Sính', 'Giàng A Sùng',
    'Vàng Văn Thắng', 'Phu Thị Thu', 'Sùng A Tỏa', 'Chẻo Kim Trâm', 'Thào A Uy',
    'Sùng Văn Việt', 'Lù A Xì', 'Phàn Thị Xuân', 'Chang Thị Yến'
  ],
  'Lớp 7A3': [
    'Chang Văn An', 'Chẻo Thị Anh', 'Thào Văn Bách', 'Lù Thị Bình', 'Sùng Thị Cúc',
    'Phàn A Cường', 'Lường A Dũng', 'Tẩn Thị Duyên', 'Lò A Én', 'Giàng Văn Giang',
    'Tẩn Văn Hải', 'Ly Thị Hạnh', 'Phàn Thị Hằng', 'Phu A Khải', 'Chang A Khoa',
    'Lù Thị Lan', 'Vàng Thị Liên', 'Chẻo Văn Long', 'Giàng A Lực', 'Thào Thị Mai',
    'Ly Văn Minh', 'Sùng A Nam', 'Phu Thị Ngát', 'Lường Văn Nghĩa', 'Vàng A Phong',
    'Tẩn Thị Phúc', 'Phàn A Quân', 'Chẻo Thị Quyên', 'Thào Văn Sang', 'Chang Thị Sim',
    'Lù Văn Tài', 'Sùng Thị Tâm', 'Giàng Thị Tuyết', 'Lường Văn Uyên', 'Ly A Vàng',
    'Tẩn A Vũ', 'Phu Thị Xuân', 'Phàn Thị Xuyến', 'Vàng A Yên'
  ],
  'Lớp 7A4': [
    'Phu Văn Bách', 'Tẩn A Bắc', 'Giàng A Bền', 'Phàn Thị Chi', 'Ly Thị Chinh',
    'Vàng Thị Cúc', 'Chẻo A Dân', 'Chang Văn Doanh', 'Phu Văn Đạt', 'Thào Thị Gái',
    'Lù Thị Gấm', 'Giàng A Hảo', 'Sùng A Hào', 'Vàng Thị Huệ', 'Lường Thị Kiều',
    'Ly Thị Kính', 'Chẻo A Kỷ', 'Phu Văn Lợi', 'Tẩn A Luận', 'Phàn Văn Mùa',
    'Vàng A Mua', 'Chẻo Thị Nụ', 'Chang Thị Nương', 'Thào A Páo', 'Lù A Phúng',
    'Sùng Thị Quế', 'Giàng Thị Quý', 'Ly Văn Rùa', 'Phu A Sáng', 'Lường A Súng',
    'Vàng Thị Thơm', 'Tẩn Thị Tươi', 'Chẻo A Út', 'Phàn Văn Vang', 'Thào Thị Vui',
    'Sùng Văn Xa', 'Chang A Xín', 'Lù Thị Ý', 'Lường Thị Yến'
  ]
};

// Danh sách họ tên học sinh thực tế của Khối 9 (Đã sắp xếp chuẩn A-Z theo Tên)
const GRADE_9_NAMES: { [className: string]: string[] } = {
  'Lớp 9A1': [
    'Lý Văn Anh', 'Tẩn Ngọc Ánh', 'Ly Thị Bích', 'Vàng Văn Chiến', 'Tẩn Tả Mẩy Chiếu',
    'Chang Mè De', 'Ly A De', 'Chẻo A Dơ', 'Giàng Văn Dũng', 'Thào Thị Em',
    'Sùng A Giang', 'Phàn Thị Hà', 'Phu Thị Hân', 'Vàng A Hùng', 'Lò Văn Khang',
    'Chẻo Thúy Kiều', 'Thào A Lềnh', 'Lường Thị Linh', 'Sùng Thị Mai', 'Lù A Minh',
    'Lò Thị Mơ', 'Phu A Nam', 'Tẩn Thị Nga', 'Chang Văn Phát', 'Lò Văn Phong',
    'Phàn A Quân', 'Lường Thị Quý', 'Lù Văn Sang', 'Giàng Thị Sen', 'Ly Văn Tâm',
    'Tẩn Thị Thúy', 'Vàng Thị Uyên', 'Chẻo Văn Vinh', 'Chang A Vừ', 'Thào Thị Xoan',
    'Phàn Thị Xuân', 'Sùng Văn Y', 'Giàng A Yên', 'Phu A Zừ'
  ],
  'Lớp 9A2': [
    'Phu Thị An', 'Lò Văn Bách', 'Tẩn A Bình', 'Phàn Văn Chung', 'Lường Thị Cúc',
    'Chang Thị Dung', 'Tẩn A Dũng', 'Lù A Đạt', 'Giàng Thị Én', 'Phàn Thị Gấm',
    'Ly Văn Giao', 'Chang A Hảo', 'Vàng Thị Hoa', 'Chẻo A Ích', 'Thào Văn Khang',
    'Lù Thị Kính', 'Sùng Thị Lan', 'Phu A Long', 'Giàng Văn Lợi', 'Ly Thị Mai',
    'Lò Thị Mỵ', 'Lường Văn Nam', 'Vàng A Nông', 'Tẩn Thị Oanh', 'Phàn A Phúc',
    'Chẻo Thị Phượng', 'Thào A Quý', 'Chang Thị Quỳnh', 'Sùng Thị Rộng', 'Lù Văn Rực',
    'Phu Văn Sơn', 'Giàng Thị Sương', 'Ly A Tài', 'Lò Thị Trang', 'Vàng Thị Uyên',
    'Chẻo Văn Vang', 'Lường A Vàng', 'Thào Thị Xinh', 'Sùng A Yêu'
  ],
  'Lớp 9A3': [
    'Giàng A Báo', 'Tẩn Văn Bắc', 'Ly Thị Cẩm', 'Phàn Thị Cúc', 'Chang A Dân',
    'Vàng Văn Dần', 'Chẻo Thị Ém', 'Lù Thị Giang', 'Sùng Văn Gió', 'Phu Thị Hạnh',
    'Giàng A Hùng', 'Lò A Ích', 'Lường Thị Khanh', 'Ly Thị Loan', 'Tẩn Văn Luyện',
    'Phàn Thị Mận', 'Vàng Văn Minh', 'Chang A Nếnh', 'Chẻo Thị Nguyệt', 'Lù Thị Oanh',
    'Giàng Văn Páo', 'Thào A Phềnh', 'Thào A Phong', 'Ly Thị Quế', 'Sùng Thị Quyên',
    'Vàng A Rùa', 'Phu Văn Rực', 'Lò Thị San', 'Chẻo Thị Sen', 'Lường A Tỏa',
    'Thào Văn Tủa', 'Sùng Thị Uyên', 'Phu A Vang', 'Tẩn Thị Vân', 'Phàn Văn Xá',
    'Lò Thị Xuyến', 'Chang Thị Ý', 'Lường A Yên', 'Lù A Zếnh'
  ],
  'Lớp 9A4': [
    'Ly A Bách', 'Sùng A Búa', 'Phu Thị Châm', 'Vàng Thị Chinh', 'Lò Văn Dẻ',
    'Chẻo A Du', 'Lường Thị Én', 'Thào Thị Gấm', 'Phàn Văn Giáp', 'Sùng A Hảo',
    'Chang Thị Hồi', 'Lù A Inh', 'Giàng Thị Kiều', 'Phu Thị Kính', 'Lò Văn Lập',
    'Ly Văn Lộc', 'Lường Thị Mẩy', 'Vàng Thị Mơ', 'Chẻo A Năng', 'Tẩn A Nở',
    'Thào Thị Ổn', 'Sùng Văn Pao', 'Tẩn A Phủ', 'Phàn Thị Phúc', 'Chang Văn Quế',
    'Phu Thị Quý', 'Lò A Rạng', 'Lù Thị Rộng', 'Giàng A Say', 'Lường Thị Sinh',
    'Ly Thị Thu', 'Tẩn Văn Tuân', 'Phàn Thị Út', 'Chang A Vang', 'Vàng A Vừ',
    'Chẻo Thị Xa', 'Lù Thị Xoa', 'Giàng Văn Yến', 'Thào A Yêu'
  ]
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
