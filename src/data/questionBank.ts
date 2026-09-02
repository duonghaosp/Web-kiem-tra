import { Question } from '../types/database';
import { idbGet, idbSet } from '../lib/idbStorage';

// Bộ nhớ đệm tạm thời (In-memory Cache)
let cachedQuestions: Question[] | null = null;

// Tự động nạp đồng bộ từ IndexedDB khi ứng dụng khởi chạy
if (typeof window !== 'undefined') {
  idbGet<Question[]>('geo_question_bank')
    .then((idbQuestions) => {
      if (Array.isArray(idbQuestions) && idbQuestions.length > 0) {
        cachedQuestions = idbQuestions;
        try {
          localStorage.setItem('geo_question_bank', JSON.stringify(idbQuestions));
        } catch {
          // Bỏ qua nếu LocalStorage đầy
        }
        window.dispatchEvent(new Event('geo_question_bank_updated'));
      }
    })
    .catch(() => {});
}

export const INITIAL_QUESTIONS: Question[] = [
  // KHỐI 6
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
    id: 'q_g6_b1_3',
    grade: 6,
    lesson_id: 'g6_b1',
    category: 'Bài 1: Hệ thống kinh, vĩ tuyến và tọa độ địa lí',
    type: 'true_false',
    title: 'Xét tính đúng sai về kinh tuyến và vĩ tuyến',
    content_json: {
      question: 'Xét tính Đúng / Sai của các nhận định về hệ thống kinh tuyến và vĩ tuyến sau:',
      statements: [
        { id: 'st1', text: 'Kinh tuyến gốc là đường kinh tuyến đi qua đài thiên văn Grin-uýt (Luân Đôn).' },
        { id: 'st2', text: 'Tất cả các đường vĩ tuyến đều có độ dài bằng nhau.' },
        { id: 'st3', text: 'Vĩ tuyến lớn nhất trên quả Địa Cầu là đường Xích đạo (0 độ).' },
      ],
    },
    correct_answer_json: {
      tf_answers: { st1: true, st2: false, st3: true },
    },
    explanation: 'Các đường vĩ tuyến càng về hai cực thì chiều dài càng thu nhỏ dần.',
    points: 1.5,
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
    id: 'q_g6_b2_2',
    grade: 6,
    lesson_id: 'g6_b2',
    category: 'Bài 2: Bản đồ. Một số lưới kinh, vĩ tuyến. Tỉ lệ bản đồ',
    type: 'fill_blank',
    title: 'Điền khái niệm bản đồ',
    content_json: {
      template: 'Bản đồ là hình vẽ thu nhỏ tương đối chính xác của một khu vực hay toàn bộ bề mặt [blank_1] lên một mặt phẳng.',
      blanks: [{ id: 'blank_1', placeholder: 'Điền từ...' }],
    },
    correct_answer_json: {
      blank_answers: { blank_1: ['Trái Đất', 'trái đất'] },
    },
    explanation: 'Bản đồ biểu thị bề mặt Trái Đất trên mặt phẳng theo các quy ước toán học.',
    points: 1.0,
    tags: ['Bản đồ', 'Khối 6'],
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
    id: 'q_g6_b6_1',
    grade: 6,
    lesson_id: 'g6_b6',
    category: 'Bài 6: Chuyển động tự quay quanh trục của Trái Đất và hệ quả',
    type: 'single_choice',
    title: 'Hướng chuyển động tự quay của Trái Đất',
    content_json: {
      question: 'Trái Đất tự quay quanh trục tưởng tượng của mình theo hướng nào?',
      options: ['Từ Tây sang Đông', 'Từ Đông sang Tây', 'Từ Bắc xuống Nam', 'Từ Nam lên Bắc'],
    },
    correct_answer_json: { correct_index: 0 },
    explanation: 'Trái Đất tự quay từ Tây sang Đông, tạo nên hiện tượng ngày và đêm luân phiên nhau.',
    points: 1.0,
    tags: ['Chuyển động Trái Đất', 'Khối 6'],
  },
  {
    id: 'q_g6_b8_1',
    grade: 6,
    lesson_id: 'g6_b8',
    category: 'Bài 8: Cấu tạo của Trái Đất. Động đất và núi lửa',
    type: 'multiple_choice',
    title: 'Các lớp cấu tạo của Trái Đất',
    content_json: {
      question: 'Cấu tạo bên trong của Trái Đất gồm những lớp nào sau đây? (Chọn các phương án đúng)',
      options: ['Lớp vỏ Trái Đất', 'Lớp Manti (bao Manti)', 'Lớp nhân (lõi)', 'Lớp khí quyển'],
    },
    correct_answer_json: { correct_indices: [0, 1, 2] },
    explanation: 'Cấu tạo bên trong gồm 3 lớp: Vỏ Trái Đất, Manti và Nhân (Lõi).',
    points: 1.5,
    tags: ['Cấu tạo Trái Đất', 'Khối 6'],
  },

  // KHỐI 7
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
    explanation: 'Châu Á có đầy đủ các đới khí hậu từ cực, ôn đới đến nhiệt đới và xích đạo do lãnh thổ trải dài từ cực Bắc đến xích đạo.',
    points: 1.5,
    tags: ['Châu Á', 'Khối 7'],
  },

  // KHỐI 8
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

  // KHỐI 9
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

export const getStoredQuestions = (): Question[] => {
  if (cachedQuestions && cachedQuestions.length > 0) {
    return cachedQuestions;
  }

  try {
    const saved = localStorage.getItem('geo_question_bank');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        cachedQuestions = parsed;
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Lỗi đọc ngân hàng câu hỏi từ LocalStorage:', e);
  }

  return INITIAL_QUESTIONS;
};

export const saveStoredQuestions = (questions: Question[]) => {
  cachedQuestions = questions;

  // 1. Lưu vào IndexedDB bền vững (dung lượng hàng trăm MB, không bao giờ bị tràn quota)
  idbSet('geo_question_bank', questions).catch((err) => {
    console.warn('Lỗi lưu vào IndexedDB:', err);
  });

  // 2. Lưu vào LocalStorage có try-catch chống sập ứng dụng khi vượt hạn mức 5MB
  try {
    localStorage.setItem('geo_question_bank', JSON.stringify(questions));
  } catch (e) {
    console.warn('LocalStorage đã vượt hạn mức 5MB. Dữ liệu câu hỏi được lưu trữ an toàn trong IndexedDB!', e);
  }

  // 3. Kích hoạt sự kiện để tất cả các trang lập tức đồng bộ dữ liệu
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('geo_question_bank_updated'));
    window.dispatchEvent(new Event('storage'));
  }
};
