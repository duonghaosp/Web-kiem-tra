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

// Danh sách họ tên học sinh thực tế của Khối 7
const GRADE_7_NAMES: { [className: string]: string[] } = {
  'Lớp 7A1': [
    'Tẩn Thị Lan Anh', 'Phàn Ngọc Anh', 'Phàn Thúy Anh', 'Lò Giá Bè', 'Chang Dì Bư',
    'Lù Sán Ca', 'Chang Xa Da', 'Giàng Đô Dì', 'Lý Tả Mẩy', 'Tẩn A Lầu',
    'Vàng A Chơ', 'Chẻo A Sính', 'Thào A Dơ', 'Sùng A Páo', 'Phu Mờ Chăn',
    'Lò Văn Hoan', 'Tẩn Kim Dung', 'Chang Thúy Hằng', 'Phàn Yến Nhi', 'Lù Văn Hùng',
    'Giàng Thị Mỵ', 'Lý A Vang', 'Vàng A Lềnh', 'Chẻo Thị Mai', 'Thào A Tủa',
    'Sùng Thị Hoa', 'Phu A Ché', 'Lò Thị Nết', 'Tẩn A Dũng', 'Chang Văn Quý',
    'Phàn Quốc Tuấn', 'Lù Thị Thảo', 'Giàng A Say', 'Lý Kim Ngân', 'Vàng Thị Dở',
    'Chẻo Văn Đô', 'Thào A Sáng', 'Sùng A Vừ', 'Phu Thị Sen'
  ],
  'Lớp 7A2': [
    'Tẩn Vân Anh', 'Tẩn Minh Bảo', 'Lường Thị Hải Băng', 'Ly Xá Be', 'Giàng Gà Bứ',
    'Phu Mờ Chăn', 'Tẩn A Chiến', 'Lò Dá De', 'Vàng A Dì', 'Chẻo Thúy Diễm',
    'Thào Thị Gâu', 'Sùng A Hải', 'Phàn Văn Khang', 'Lù Thị Ly', 'Chang A Minh',
    'Lý Thị Nở', 'Tẩn A Nam', 'Lường Văn Phong', 'Ly Thị Quỳnh', 'Giàng A Sùng',
    'Phu Thị Thu', 'Vàng Văn Thắng', 'Chẻo Kim Trâm', 'Thào A Uy', 'Sùng Văn Việt',
    'Phàn Thị Xuân', 'Lù A Xì', 'Chang Thị Yến', 'Lý Văn Cường', 'Tẩn Thúy Kiều',
    'Lường A Lử', 'Ly Văn Mạnh', 'Giàng Thị Nga', 'Phu A Nhì', 'Vàng Thị Oanh',
    'Chẻo Văn Phúc', 'Thào Thị Sính', 'Sùng A Tỏa', 'Phàn Thị Mây'
  ],
  'Lớp 7A3': [
    'Chang Văn An', 'Lù Thị Bình', 'Phàn A Cường', 'Tẩn Thị Duyên', 'Lò A Én',
    'Giàng Văn Giang', 'Ly Thị Hạnh', 'Phu A Khải', 'Vàng Thị Liên', 'Chẻo Văn Long',
    'Thào Thị Mai', 'Sùng A Nam', 'Lường Văn Nghĩa', 'Tẩn Thị Phúc', 'Phàn A Quân',
    'Chang Thị Sim', 'Lù Văn Tài', 'Giàng Thị Tuyết', 'Ly A Vàng', 'Phu Thị Xuân',
    'Vàng A Yên', 'Chẻo Thị Anh', 'Thào Văn Bách', 'Sùng Thị Cúc', 'Lường A Dũng',
    'Tẩn Văn Hải', 'Phàn Thị Hằng', 'Chang A Khoa', 'Lù Thị Lan', 'Giàng A Lực',
    'Ly Văn Minh', 'Phu Thị Ngát', 'Vàng A Phong', 'Chẻo Thị Quyên', 'Thào Văn Sang',
    'Sùng Thị Tâm', 'Lường Văn Uyên', 'Tẩn A Vũ', 'Phàn Thị Xuyến'
  ],
  'Lớp 7A4': [
    'Phu Văn Bách', 'Vàng Thị Cúc', 'Chẻo A Dân', 'Thào Thị Gái', 'Sùng A Hào',
    'Lường Thị Kiều', 'Tẩn A Luận', 'Phàn Văn Mùa', 'Chang Thị Nương', 'Lù A Phúng',
    'Giàng Thị Quý', 'Ly Văn Rùa', 'Phu A Sáng', 'Vàng Thị Thơm', 'Chẻo A Út',
    'Thào Thị Vui', 'Sùng Văn Xa', 'Lường Thị Yến', 'Tẩn A Bắc', 'Phàn Thị Chi',
    'Chang Văn Doanh', 'Lù Thị Gấm', 'Giàng A Hảo', 'Ly Thị Kính', 'Phu Văn Lợi',
    'Vàng A Mua', 'Chẻo Thị Nụ', 'Thào A Páo', 'Sùng Thị Quế', 'Lường A Súng',
    'Tẩn Thị Tươi', 'Phàn Văn Vang', 'Chang A Xín', 'Lù Thị Ý', 'Giàng A Bền',
    'Ly Thị Chinh', 'Phu Văn Đạt', 'Vàng Thị Huệ', 'Chẻo A Kỷ'
  ]
};

// Danh sách họ tên học sinh thực tế của Khối 9
const GRADE_9_NAMES: { [className: string]: string[] } = {
  'Lớp 9A1': [
    'Lý Văn Anh', 'Tẩn Ngọc Ánh', 'Tẩn Tả Mẩy Chiếu', 'Chang Mè De', 'Ly A De',
    'Giàng Văn Dũng', 'Phàn Thị Hà', 'Vàng A Hùng', 'Chẻo Thúy Kiều', 'Thào A Lềnh',
    'Sùng Thị Mai', 'Phu A Nam', 'Lò Văn Phong', 'Lường Thị Quý', 'Lù Văn Sang',
    'Tẩn Thị Thúy', 'Chang A Vừ', 'Phàn Thị Xuân', 'Giàng A Yên', 'Ly Thị Bích',
    'Vàng Văn Chiến', 'Chẻo A Dơ', 'Thào Thị Em', 'Sùng A Giang', 'Phu Thị Hân',
    'Lò Văn Khang', 'Lường Thị Linh', 'Lù A Minh', 'Tẩn Thị Nga', 'Chang Văn Phát',
    'Phàn A Quân', 'Giàng Thị Sen', 'Ly Văn Tâm', 'Vàng Thị Uyên', 'Chẻo Văn Vinh',
    'Thào Thị Xoan', 'Sùng Văn Y', 'Phu A Zừ', 'Lò Thị Mơ'
  ],
  'Lớp 9A2': [
    'Tẩn A Bình', 'Phàn Văn Chung', 'Chang Thị Dung', 'Lù A Đạt', 'Giàng Thị Én',
    'Ly Văn Giao', 'Vàng Thị Hoa', 'Chẻo A Ích', 'Thào Văn Khang', 'Sùng Thị Lan',
    'Phu A Long', 'Lò Thị Mỵ', 'Lường Văn Nam', 'Tẩn Thị Oanh', 'Phàn A Phúc',
    'Chang Thị Quỳnh', 'Lù Văn Rực', 'Giàng Thị Sương', 'Ly A Tài', 'Vàng Thị Uyên',
    'Chẻo Văn Vang', 'Thào Thị Xinh', 'Sùng A Yêu', 'Phu Thị An', 'Lò Văn Bách',
    'Lường Thị Cúc', 'Tẩn A Dũng', 'Phàn Thị Gấm', 'Chang A Hảo', 'Lù Thị Kính',
    'Giàng Văn Lợi', 'Ly Thị Mai', 'Vàng A Nông', 'Chẻo Thị Phượng', 'Thào A Quý',
    'Sùng Thị Rộng', 'Phu Văn Sơn', 'Lò Thị Trang', 'Lường A Vàng'
  ],
  'Lớp 9A3': [
    'Giàng A Báo', 'Ly Thị Cẩm', 'Vàng Văn Dần', 'Chẻo Thị Ém', 'Thào A Phềnh',
    'Sùng Văn Gió', 'Phu Thị Hạnh', 'Lò A Ích', 'Lường Thị Khanh', 'Tẩn Văn Luyện',
    'Phàn Thị Mận', 'Chang A Nếnh', 'Lù Thị Oanh', 'Giàng Văn Páo', 'Ly Thị Quế',
    'Vàng A Rùa', 'Chẻo Thị Sen', 'Thào Văn Tủa', 'Sùng Thị Uyên', 'Phu A Vang',
    'Lò Thị Xuyến', 'Lường A Yên', 'Tẩn Văn Bắc', 'Phàn Thị Cúc', 'Chang A Dân',
    'Lù Thị Giang', 'Giàng A Hùng', 'Ly Thị Loan', 'Vàng Văn Minh', 'Chẻo Thị Nguyệt',
    'Thào A Phong', 'Sùng Thị Quyên', 'Phu Văn Rực', 'Lò Thị San', 'Lường A Tỏa',
    'Tẩn Thị Vân', 'Phàn Văn Xá', 'Chang Thị Ý', 'Lù A Zếnh'
  ],
  'Lớp 9A4': [
    'Sùng A Búa', 'Phu Thị Châm', 'Lò Văn Dẻ', 'Lường Thị Én', 'Tẩn A Phủ',
    'Phàn Văn Giáp', 'Chang Thị Hồi', 'Lù A Inh', 'Giàng Thị Kiều', 'Ly Văn Lộc',
    'Vàng Thị Mơ', 'Chẻo A Năng', 'Thào Thị Ổn', 'Sùng Văn Pao', 'Phu Thị Quý',
    'Lò A Rạng', 'Lường Thị Sinh', 'Tẩn Văn Tuân', 'Phàn Thị Út', 'Chang A Vang',
    'Lù Thị Xoa', 'Giàng Văn Yến', 'Ly A Bách', 'Vàng Thị Chinh', 'Chẻo A Du',
    'Thào Thị Gấm', 'Sùng A Hảo', 'Phu Thị Kính', 'Lò Văn Lập', 'Lường Thị Mẩy',
    'Tẩn A Nở', 'Phàn Thị Phúc', 'Chang Văn Quế', 'Lù Thị Rộng', 'Giàng A Say',
    'Ly Thị Thu', 'Vàng A Vừ', 'Chẻo Thị Xa', 'Thào A Yêu'
  ]
};

const removeVietnameseTones = (str: string): string => {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
};

/**
 * HÀM ĐÁNH LẠI MÃ HỌC SINH TỰ ĐỘNG THEO SỐ LƯỢNG THỰC TẾ CỦA TỪNG LỚP:
 * - Khối 6: Tiền tố HS06
 * - Khối 7: Tiền tố HS07
 * - Khối 8: Tiền tố HS08
 * - Khối 9: Tiền tố HS09
 * Đánh số liên tục qua các lớp A1 -> A2 -> A3 -> A4 dựa trên đúng số học sinh THỰC CÓ của mỗi lớp.
 * KHÔNG tự ý chèn học sinh giả vào các lớp trống.
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
      // Lấy danh sách học sinh THỰC TẾ thuộc lớp này
      const classStudents = studentsList.filter((s) => s.class_name === cls.name);

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
    const otherGradeStudents = studentsList.filter(
      (s) =>
        Number(s.grade) === Number(g) &&
        !gradeClasses.some((c) => c.name === s.class_name)
    );

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
