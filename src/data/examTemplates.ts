import { Question } from '../types/database';
import { INITIAL_QUESTIONS } from './questionBank';

export interface ExamTemplate {
  id: string;
  title: string;
  grade: number;
  category: string;
  duration_minutes: number;
  description: string;
  structure: {
    objective_points: number; // 7.0 điểm
    essay_points: number;     // 3.0 điểm
    total_points: number;     // 10.0 điểm
  };
  questions: Question[];
  created_at?: string;
}

// Danh sách đề thi mẫu chuẩn hóa 70% Trắc nghiệm (7đ) + 30% Tự luận (3đ)
export const DEFAULT_EXAM_TEMPLATES: ExamTemplate[] = [
  {
    id: 'tpl_g6_15p',
    title: 'Đề Mẫu 15 Phút: Tọa Độ & Bản Đồ Địa Lí (Khối 6)',
    grade: 6,
    category: 'Kiểm tra 15 phút',
    duration_minutes: 15,
    description: 'Cấu trúc chuẩn 70% Trắc nghiệm (7.0đ) + 30% Tự luận (3.0đ) về Hệ thống kinh vĩ tuyến và Bản đồ.',
    structure: {
      objective_points: 7.0,
      essay_points: 3.0,
      total_points: 10.0,
    },
    questions: [
      {
        id: 'tpl_q1',
        grade: 6,
        type: 'single_choice',
        title: 'Tọa độ địa lí của một điểm',
        content_json: {
          question: 'Tọa độ địa lí của một điểm trên bản đồ là:',
          options: [
            'Kinh độ và vĩ độ của điểm đó',
            'Khoảng cách từ điểm đó đến xích đạo',
            'Độ cao tuyệt đối của điểm đó',
            'Khoảng cách từ điểm đó đến kinh tuyến gốc',
          ],
        },
        correct_answer_json: { correct_index: 0 },
        explanation: 'Tọa độ địa lí gồm kinh độ và vĩ độ của điểm đó.',
        points: 1.75,
      },
      {
        id: 'tpl_q2',
        grade: 6,
        type: 'single_choice',
        title: 'Ý nghĩa của tỉ lệ bản đồ',
        content_json: {
          question: 'Tỉ lệ bản đồ $1 : 100.000$ có ý nghĩa là $1\\text{ cm}$ trên bản đồ tương ứng ngoài thực địa là:',
          options: ['1 km', '10 km', '100 m', '100 km'],
        },
        correct_answer_json: { correct_index: 0 },
        explanation: '1 cm trên bản đồ ứng với 100.000 cm = 1 km ngoài thực tế.',
        points: 1.75,
      },
      {
        id: 'tpl_q3',
        grade: 6,
        type: 'true_false',
        title: 'Xét tính đúng sai về kinh vĩ tuyến',
        content_json: {
          question: 'Xét tính Đúng / Sai của các nhận định về hệ thống kinh tuyến và vĩ tuyến sau:',
          statements: [
            { id: 'st1', text: 'Kinh tuyến gốc là đường kinh tuyến 0 độ đi qua Luân Đôn.' },
            { id: 'st2', text: 'Vĩ tuyến lớn nhất trên Trái Đất là đường Xích đạo (0 độ).' },
          ],
        },
        correct_answer_json: { tf_answers: { st1: true, st2: true } },
        explanation: 'Kinh tuyến gốc là 0 độ, vĩ tuyến lớn nhất là xích đạo 0 độ.',
        points: 1.75,
      },
      {
        id: 'tpl_q4',
        grade: 6,
        type: 'fill_blank',
        title: 'Điền từ định nghĩa bản đồ',
        content_json: {
          template: 'Bản đồ là hình vẽ thu nhỏ tương đối chính xác của bề mặt [blank_1] lên một mặt phẳng.',
          blanks: [{ id: 'blank_1', placeholder: 'Điền từ...' }],
        },
        correct_answer_json: { blank_answers: { blank_1: ['Trái Đất', 'trái đất'] } },
        explanation: 'Bản đồ biểu thị bề mặt Trái Đất theo quy ước toán học.',
        points: 1.75,
      },
      {
        id: 'tpl_q5_essay',
        grade: 6,
        type: 'essay',
        title: 'Câu hỏi tự luận: Ý nghĩa của bản đồ',
        content_json: {
          prompt: 'Em hãy nêu 2 vai trò quan trọng của bản đồ trong học tập Địa lí và trong đời sống hàng ngày.',
          sample_answer: '1. Trong học tập: Giúp xác định vị trí các đối tượng địa lí, rèn luyện tư duy không gian;\n2. Trong đời sống: Phục vụ tìm đường đi, quy hoạch giao thông và du lịch.',
        },
        correct_answer_json: { essay_sample: 'Học sinh nêu đủ vai trò trong học tập và trong đời sống.' },
        explanation: 'Bản đồ có ý nghĩa thiết thực cả trong học tập lẫn thực tiễn đời sống.',
        points: 3.0,
      },
    ],
  },
  {
    id: 'tpl_g8_giuaki',
    title: 'Đề Mẫu Giữa Kì I: Tự Nhiên & Biển Đảo Việt Nam (Khối 8)',
    grade: 8,
    category: 'Kiểm tra giữa kì I',
    duration_minutes: 45,
    description: 'Cấu trúc chuẩn 70% Trắc nghiệm (7.0đ) + 30% Tự luận (3.0đ) đánh giá giữa học kì I.',
    structure: {
      objective_points: 7.0,
      essay_points: 3.0,
      total_points: 10.0,
    },
    questions: [
      {
        id: 'tpl_q8_1',
        grade: 8,
        type: 'single_choice',
        title: 'Phạm vi lãnh thổ Việt Nam',
        content_json: {
          question: 'Lãnh thổ nước ta là một khối thống nhất và toàn vẹn, bao gồm những bộ phận nào?',
          options: [
            'Vùng đất, vùng biển và vùng trời',
            'Vùng đất liền và hải đảo',
            'Vùng đồng bằng và miền núi',
            'Vùng biển và thềm lục địa',
          ],
        },
        correct_answer_json: { correct_index: 0 },
        explanation: 'Lãnh thổ nước ta bao gồm vùng đất, vùng biển và vùng trời.',
        points: 2.0,
      },
      {
        id: 'tpl_q8_2',
        grade: 8,
        type: 'multiple_choice',
        title: 'Các khoáng sản năng lượng nước ta',
        content_json: {
          question: 'Những khoáng sản năng lượng quan trọng nhất của nước ta gồm: (Chọn các ý đúng)',
          options: ['Than đá', 'Dầu mỏ', 'Khí tự nhiên', 'Quặng Bô-xít'],
        },
        correct_answer_json: { correct_indices: [0, 1, 2] },
        explanation: 'Than đá, dầu mỏ và khí đốt là khoáng sản năng lượng.',
        points: 2.5,
      },
      {
        id: 'tpl_q8_3',
        grade: 8,
        type: 'drag_drop',
        title: 'Nối đặc điểm đồng bằng Việt Nam',
        content_json: {
          instruction: 'Ghép nối vùng đồng bằng với đặc điểm tương ứng:',
          pairs: [
            { id: 'p1', left: 'Đồng bằng sông Hồng', right: 'Hệ thống đê ngăn lũ dài trên 2.700 km' },
            { id: 'p2', left: 'Đồng bằng sông Cửu Long', right: 'Kênh rạch chằng chịt, diện tích trũng ngập nước lớn' },
          ],
        },
        correct_answer_json: {
          drag_pairs: {
            p1: 'Hệ thống đê ngăn lũ dài trên 2.700 km',
            p2: 'Kênh rạch chằng chịt, diện tích trũng ngập nước lớn',
          },
        },
        explanation: 'Đặc điểm tự nhiên hai đồng bằng lớn nhất nước ta.',
        points: 2.5,
      },
      {
        id: 'tpl_q8_essay',
        grade: 8,
        type: 'essay',
        title: 'Câu hỏi tự luận: Ý nghĩa biển đảo Việt Nam',
        content_json: {
          prompt: 'Em hãy phân tích ý nghĩa của biển đảo đối với việc phát triển kinh tế và bảo vệ an ninh quốc phòng của nước ta.',
          sample_answer: '1. Về kinh tế: Cung cấp nguồn lợi thủy hải sản, khoáng sản dầu khí, phát triển du lịch và giao thông hàng hải quốc tế.\n2. Về quốc phòng: Là tuyến phòng thủ bảo vệ vững chắc chủ quyền lãnh thổ quốc gia.',
        },
        correct_answer_json: { essay_sample: 'Học sinh nêu đủ 2 khía cạnh: Phát triển kinh tế biển và An ninh quốc phòng.' },
        explanation: 'Biển đảo có vị trí chiến lược đặc biệt quan trọng đối với nước ta.',
        points: 3.0,
      },
    ],
  },
];

export const getStoredExamTemplates = (): ExamTemplate[] => {
  try {
    const saved = localStorage.getItem('geo_exam_templates');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Lỗi đọc đề thi mẫu:', e);
  }
  return DEFAULT_EXAM_TEMPLATES;
};

export const saveStoredExamTemplates = (templates: ExamTemplate[]) => {
  localStorage.setItem('geo_exam_templates', JSON.stringify(templates));
};
