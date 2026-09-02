export interface LessonItem {
  id: string;
  grade: number;
  lesson_number: number;
  title: string;
  chapter?: string;
}

export const DEFAULT_LESSONS: LessonItem[] = [
  // KHỐI 6 - SÁCH GIÁO KHOA THỐNG NHẤT TOÀN QUỐC NĂM HỌC 2026-2027 (31 BÀI HỌC)
  { id: 'g6_b0', grade: 6, lesson_number: 0, title: 'Mở đầu: Môn Địa lí và những điều lí thú', chapter: 'Mở Đầu' },
  { id: 'g6_b1', grade: 6, lesson_number: 1, title: 'Bài 1: Hệ thống kinh, vĩ tuyến. Toạ độ địa lí', chapter: 'Chương 1: Bản Đồ' },
  { id: 'g6_b2', grade: 6, lesson_number: 2, title: 'Bài 2: Bản đồ. Một số lưới kinh, vĩ tuyến. Phương hướng trên bản đồ', chapter: 'Chương 1: Bản Đồ' },
  { id: 'g6_b3', grade: 6, lesson_number: 3, title: 'Bài 3: Tỉ lệ bản đồ. Tính khoảng cách thực tế dựa vào tỉ lệ bản đồ', chapter: 'Chương 1: Bản Đồ' },
  { id: 'g6_b4', grade: 6, lesson_number: 4, title: 'Bài 4: Kí hiệu và bảng chú giải bản đồ. Tìm đường đi trên bản đồ', chapter: 'Chương 1: Bản Đồ' },
  { id: 'g6_b5', grade: 6, lesson_number: 5, title: 'Bài 5: Lược đồ trí nhớ', chapter: 'Chương 1: Bản Đồ' },
  { id: 'g6_b6', grade: 6, lesson_number: 6, title: 'Bài 6: Trái Đất trong hệ Mặt Trời', chapter: 'Chương 2: Trái Đất' },
  { id: 'g6_b7', grade: 6, lesson_number: 7, title: 'Bài 7: Chuyển động tự quay quanh trục của Trái Đất và hệ quả', chapter: 'Chương 2: Trái Đất' },
  { id: 'g6_b8', grade: 6, lesson_number: 8, title: 'Bài 8: Chuyển động quanh Mặt Trời của Trái Đất và hệ quả', chapter: 'Chương 2: Trái Đất' },
  { id: 'g6_b9', grade: 6, lesson_number: 9, title: 'Bài 9: Xác định phương hướng ngoài thực tế', chapter: 'Chương 2: Trái Đất' },
  { id: 'g6_b10', grade: 6, lesson_number: 10, title: 'Bài 10: Cấu tạo của Trái Đất. Các mảng kiến tạo', chapter: 'Chương 3: Cấu Tạo Trái Đất' },
  { id: 'g6_b11', grade: 6, lesson_number: 11, title: 'Bài 11: Quá trình nội sinh và quá trình ngoại sinh. Hiện tượng tạo núi', chapter: 'Chương 3: Cấu Tạo Trái Đất' },
  { id: 'g6_b12', grade: 6, lesson_number: 12, title: 'Bài 12: Núi lửa và động đất', chapter: 'Chương 3: Cấu Tạo Trái Đất' },
  { id: 'g6_b13', grade: 6, lesson_number: 13, title: 'Bài 13: Các dạng địa hình chính trên Trái Đất. Khoáng sản', chapter: 'Chương 3: Cấu Tạo Trái Đất' },
  { id: 'g6_b14', grade: 6, lesson_number: 14, title: 'Bài 14: Thực hành: Đọc lược đồ địa hình tỉ lệ lớn và lát cắt địa hình đơn giản', chapter: 'Chương 3: Cấu Tạo Trái Đất' },
  { id: 'g6_b15', grade: 6, lesson_number: 15, title: 'Bài 15: Lớp vỏ khí của Trái Đất. Khí áp và gió', chapter: 'Chương 4: Khí Hậu' },
  { id: 'g6_b16', grade: 6, lesson_number: 16, title: 'Bài 16: Nhiệt độ không khí. Mây và mưa', chapter: 'Chương 4: Khí Hậu' },
  { id: 'g6_b17', grade: 6, lesson_number: 17, title: 'Bài 17: Thời tiết và khí hậu. Biến đổi khí hậu', chapter: 'Chương 4: Khí Hậu' },
  { id: 'g6_b18', grade: 6, lesson_number: 18, title: 'Bài 18: Thực hành: Phân tích biểu đồ nhiệt độ, lượng mưa', chapter: 'Chương 4: Khí Hậu' },
  { id: 'g6_b19', grade: 6, lesson_number: 19, title: 'Bài 19: Thuỷ quyển và vòng tuần hoàn lớn của nước', chapter: 'Chương 5: Thủy Quyển' },
  { id: 'g6_b20', grade: 6, lesson_number: 20, title: 'Bài 20: Sông và hồ. Nước ngầm và băng hà', chapter: 'Chương 5: Thủy Quyển' },
  { id: 'g6_b21', grade: 6, lesson_number: 21, title: 'Bài 21: Biển và đại dương', chapter: 'Chương 5: Thủy Quyển' },
  { id: 'g6_b22', grade: 6, lesson_number: 22, title: 'Bài 22: Lớp đất trên Trái Đất', chapter: 'Chương 6: Thổ Nhưỡng & Sinh Quyển' },
  { id: 'g6_b23', grade: 6, lesson_number: 23, title: 'Bài 23: Sự sống trên Trái Đất', chapter: 'Chương 6: Thổ Nhưỡng & Sinh Quyển' },
  { id: 'g6_b24', grade: 6, lesson_number: 24, title: 'Bài 24: Rừng nhiệt đới', chapter: 'Chương 6: Thổ Nhưỡng & Sinh Quyển' },
  { id: 'g6_b25', grade: 6, lesson_number: 25, title: 'Bài 25: Sự phân bố các đới thiên nhiên trên Trái Đất', chapter: 'Chương 6: Thổ Nhưỡng & Sinh Quyển' },
  { id: 'g6_b26', grade: 6, lesson_number: 26, title: 'Bài 26: Thực hành: Tìm hiểu môi trường tự nhiên địa phương', chapter: 'Chương 6: Thổ Nhưỡng & Sinh Quyển' },
  { id: 'g6_b27', grade: 6, lesson_number: 27, title: 'Bài 27: Dân số và sự phân bố dân cư trên thế giới', chapter: 'Chương 7: Con Người & Thiên Nhiên' },
  { id: 'g6_b28', grade: 6, lesson_number: 28, title: 'Bài 28: Mối quan hệ giữa con người và thiên nhiên', chapter: 'Chương 7: Con Người & Thiên Nhiên' },
  { id: 'g6_b29', grade: 6, lesson_number: 29, title: 'Bài 29: Bảo vệ tự nhiên và khai thác thông minh các tài nguyên thiên nhiên', chapter: 'Chương 7: Con Người & Thiên Nhiên' },
  { id: 'g6_b30', grade: 6, lesson_number: 30, title: 'Bài 30: Thực hành: Tìm hiểu mối quan hệ giữa con người và thiên nhiên', chapter: 'Chương 7: Con Người & Thiên Nhiên' },

  // KHỐI 7 - SÁCH GIÁO KHOA THỐNG NHẤT TOÀN QUỐC NĂM HỌC 2026-2027 (19 BÀI + 2 CHỦ ĐỀ CHUNG)
  { id: 'g7_b1', grade: 7, lesson_number: 1, title: 'Bài 1: Vị trí địa lí, đặc điểm tự nhiên châu Âu', chapter: 'Chương 1: Châu Âu' },
  { id: 'g7_b2', grade: 7, lesson_number: 2, title: 'Bài 2: Đặc điểm dân cư, xã hội châu Âu', chapter: 'Chương 1: Châu Âu' },
  { id: 'g7_b3', grade: 7, lesson_number: 3, title: 'Bài 3: Khai thác, sử dụng và bảo vệ thiên nhiên ở châu Âu', chapter: 'Chương 1: Châu Âu' },
  { id: 'g7_b4', grade: 7, lesson_number: 4, title: 'Bài 4: Liên minh châu Âu', chapter: 'Chương 1: Châu Âu' },
  { id: 'g7_b5', grade: 7, lesson_number: 5, title: 'Bài 5: Vị trí địa lí, đặc điểm tự nhiên châu Á', chapter: 'Chương 2: Châu Á' },
  { id: 'g7_b6', grade: 7, lesson_number: 6, title: 'Bài 6: Đặc điểm dân cư, xã hội châu Á', chapter: 'Chương 2: Châu Á' },
  { id: 'g7_b7', grade: 7, lesson_number: 7, title: 'Bài 7: Bản đồ chính trị châu Á, các khu vực của châu Á', chapter: 'Chương 2: Châu Á' },
  { id: 'g7_b8', grade: 7, lesson_number: 8, title: 'Bài 8: Thực hành: Tìm hiểu về các nền kinh tế lớn và kinh tế mới nổi của châu Á', chapter: 'Chương 2: Châu Á' },
  { id: 'g7_b9', grade: 7, lesson_number: 9, title: 'Bài 9: Vị trí địa lí, đặc điểm tự nhiên châu Phi', chapter: 'Chương 3: Châu Phi' },
  { id: 'g7_b10', grade: 7, lesson_number: 10, title: 'Bài 10: Đặc điểm dân cư, xã hội châu Phi', chapter: 'Chương 3: Châu Phi' },
  { id: 'g7_b11', grade: 7, lesson_number: 11, title: 'Bài 11: Phương thức con người khai thác, sử dụng và bảo vệ thiên nhiên ở châu Phi', chapter: 'Chương 3: Châu Phi' },
  { id: 'g7_b12', grade: 7, lesson_number: 12, title: 'Bài 12: Thực hành: Tìm hiểu khái quát Cộng hoà Nam Phi', chapter: 'Chương 3: Châu Phi' },
  { id: 'g7_b13', grade: 7, lesson_number: 13, title: 'Bài 13: Vị trí địa lí, phạm vi châu Mỹ. Sự phát kiến ra châu Mỹ', chapter: 'Chương 4: Châu Mỹ' },
  { id: 'g7_b14', grade: 7, lesson_number: 14, title: 'Bài 14: Đặc điểm tự nhiên Bắc Mỹ', chapter: 'Chương 4: Châu Mỹ' },
  { id: 'g7_b15', grade: 7, lesson_number: 15, title: 'Bài 15: Đặc điểm dân cư, xã hội, phương thức khai thác tự nhiên bền vững ở Bắc Mỹ', chapter: 'Chương 4: Châu Mỹ' },
  { id: 'g7_b16', grade: 7, lesson_number: 16, title: 'Bài 16: Đặc điểm tự nhiên Trung và Nam Mỹ', chapter: 'Chương 4: Châu Mỹ' },
  { id: 'g7_b17', grade: 7, lesson_number: 17, title: 'Bài 17: Đặc điểm dân cư, xã hội Trung và Nam Mỹ, khai thác, sử dụng và bảo vệ rừng A-ma-dôn', chapter: 'Chương 4: Châu Mỹ' },
  { id: 'g7_b18', grade: 7, lesson_number: 18, title: 'Bài 18: Châu Đại Dương', chapter: 'Chương 5: Châu Đại Dương' },
  { id: 'g7_b19', grade: 7, lesson_number: 19, title: 'Bài 19: Châu Nam Cực', chapter: 'Chương 6: Châu Nam Cực' },
  { id: 'g7_cd1', grade: 7, lesson_number: 20, title: 'Chủ đề 1: Các cuộc đại phát kiến địa lí', chapter: 'Chủ Đề Chung' },
  { id: 'g7_cd2', grade: 7, lesson_number: 21, title: 'Chủ đề 2: Đô thị: Lịch sử và hiện tại', chapter: 'Chủ Đề Chung' },

  // KHỐI 8 - SÁCH GIÁO KHOA THỐNG NHẤT TOÀN QUỐC NĂM HỌC 2026-2027 (12 BÀI + 2 CHỦ ĐỀ CHUNG)
  { id: 'g8_b1', grade: 8, lesson_number: 1, title: 'Bài 1: Vị trí địa lí và phạm vi lãnh thổ Việt Nam', chapter: 'Chương 1: Vị Trí & Lãnh Thổ' },
  { id: 'g8_b2', grade: 8, lesson_number: 2, title: 'Bài 2: Địa hình Việt Nam', chapter: 'Chương 2: Địa Hình & Khoáng Sản' },
  { id: 'g8_b3', grade: 8, lesson_number: 3, title: 'Bài 3: Khoáng sản Việt Nam', chapter: 'Chương 2: Địa Hình & Khoáng Sản' },
  { id: 'g8_b4', grade: 8, lesson_number: 4, title: 'Bài 4: Khí hậu Việt Nam', chapter: 'Chương 3: Khí Hậu & Thủy Văn' },
  { id: 'g8_b5', grade: 8, lesson_number: 5, title: 'Bài 5: Thực hành: Đọc biểu đồ khí hậu', chapter: 'Chương 3: Khí Hậu & Thủy Văn' },
  { id: 'g8_b6', grade: 8, lesson_number: 6, title: 'Bài 6: Thuỷ văn Việt Nam', chapter: 'Chương 3: Khí Hậu & Thủy Văn' },
  { id: 'g8_b7', grade: 8, lesson_number: 7, title: 'Bài 7: Vai trò của tài nguyên khí hậu và tài nguyên nước', chapter: 'Chương 3: Khí Hậu & Thủy Văn' },
  { id: 'g8_b8', grade: 8, lesson_number: 8, title: 'Bài 8: Tác động của biến đổi khí hậu đối với tự nhiên Việt Nam', chapter: 'Chương 3: Khí Hậu & Thủy Văn' },
  { id: 'g8_b9', grade: 8, lesson_number: 9, title: 'Bài 9: Thổ nhưỡng Việt Nam', chapter: 'Chương 4: Thổ Nhưỡng & Sinh Vật' },
  { id: 'g8_b10', grade: 8, lesson_number: 10, title: 'Bài 10: Sinh vật Việt Nam', chapter: 'Chương 4: Thổ Nhưỡng & Sinh Vật' },
  { id: 'g8_b11', grade: 8, lesson_number: 11, title: 'Bài 11: Phạm vi Biển Đông. Vùng biển đảo và đặc điểm tự nhiên vùng biển đảo Việt Nam', chapter: 'Chương 5: Biển Đảo Việt Nam' },
  { id: 'g8_b12', grade: 8, lesson_number: 12, title: 'Bài 12: Môi trường và tài nguyên biển đảo Việt Nam', chapter: 'Chương 5: Biển Đảo Việt Nam' },
  { id: 'g8_cd1', grade: 8, lesson_number: 13, title: 'Chủ đề 1: Văn minh châu thổ sông Hồng và sông Cửu Long', chapter: 'Chủ Đề Chung' },
  { id: 'g8_cd2', grade: 8, lesson_number: 14, title: 'Chủ đề 2: Bảo vệ chủ quyền, các quyền và lợi ích hợp pháp của Việt Nam ở Biển Đông', chapter: 'Chủ Đề Chung' },

  // KHỐI 9 - SÁCH GIÁO KHOA THỐNG NHẤT TOÀN QUỐC NĂM HỌC 2026-2027 (21 BÀI + 3 CHỦ ĐỀ CHUNG)
  { id: 'g9_b1', grade: 9, lesson_number: 1, title: 'Bài 1: Dân tộc và dân số', chapter: 'Chương 1: Địa Lí Dân Cư' },
  { id: 'g9_b2', grade: 9, lesson_number: 2, title: 'Bài 2: Phân bố dân cư và các loại hình quần cư', chapter: 'Chương 1: Địa Lí Dân Cư' },
  { id: 'g9_b3', grade: 9, lesson_number: 3, title: 'Bài 3: Lao động và việc làm', chapter: 'Chương 1: Địa Lí Dân Cư' },
  { id: 'g9_b4', grade: 9, lesson_number: 4, title: 'Bài 4: Thực hành: Tìm hiểu vấn đề việc làm ở địa phương và phân hoá thu nhập theo vùng', chapter: 'Chương 1: Địa Lí Dân Cư' },
  { id: 'g9_b5', grade: 9, lesson_number: 5, title: 'Bài 5: Nông nghiệp', chapter: 'Chương 2: Các Ngành Kinh Tế' },
  { id: 'g9_b6', grade: 9, lesson_number: 6, title: 'Bài 6: Lâm nghiệp và thuỷ sản', chapter: 'Chương 2: Các Ngành Kinh Tế' },
  { id: 'g9_b7', grade: 9, lesson_number: 7, title: 'Bài 7: Thực hành: Viết báo cáo về một mô hình sản xuất nông nghiệp có hiệu quả', chapter: 'Chương 2: Các Ngành Kinh Tế' },
  { id: 'g9_b8', grade: 9, lesson_number: 8, title: 'Bài 8: Công nghiệp', chapter: 'Chương 2: Các Ngành Kinh Tế' },
  { id: 'g9_b9', grade: 9, lesson_number: 9, title: 'Bài 9: Thực hành: Xác định một số hình thức tổ chức lãnh thổ công nghiệp ở nước ta', chapter: 'Chương 2: Các Ngành Kinh Tế' },
  { id: 'g9_b10', grade: 9, lesson_number: 10, title: 'Bài 10: Dịch vụ', chapter: 'Chương 2: Các Ngành Kinh Tế' },
  { id: 'g9_b11', grade: 9, lesson_number: 11, title: 'Bài 11: Thực hành: Tìm hiểu xu hướng phát triển ngành thương mại, du lịch', chapter: 'Chương 2: Các Ngành Kinh Tế' },
  { id: 'g9_b12', grade: 9, lesson_number: 12, title: 'Bài 12: Vùng Trung du và miền núi phía Bắc', chapter: 'Chương 3: Sự Phân Hóa Lãnh Thổ' },
  { id: 'g9_b13', grade: 9, lesson_number: 13, title: 'Bài 13: Vùng Đồng bằng sông Hồng', chapter: 'Chương 3: Sự Phân Hóa Lãnh Thổ' },
  { id: 'g9_b14', grade: 9, lesson_number: 14, title: 'Bài 14: Vùng Bắc Trung Bộ', chapter: 'Chương 3: Sự Phân Hóa Lãnh Thổ' },
  { id: 'g9_b15', grade: 9, lesson_number: 15, title: 'Bài 15: Thực hành: Tìm hiểu vấn đề phòng, chống thiên tai và ứng phó với biến đổi khí hậu ở vùng Bắc Trung Bộ', chapter: 'Chương 3: Sự Phân Hóa Lãnh Thổ' },
  { id: 'g9_b16', grade: 9, lesson_number: 16, title: 'Bài 16: Vùng Duyên hải Nam Trung Bộ và Tây Nguyên', chapter: 'Chương 3: Sự Phân Hóa Lãnh Thổ' },
  { id: 'g9_b17', grade: 9, lesson_number: 17, title: 'Bài 17: Vùng Đông Nam Bộ', chapter: 'Chương 3: Sự Phân Hóa Lãnh Thổ' },
  { id: 'g9_b18', grade: 9, lesson_number: 18, title: 'Bài 18: Thực hành: Phân tích ý nghĩa của việc tăng cường kết nối liên vùng đối với sự phát triển của vùng Đông Nam Bộ', chapter: 'Chương 3: Sự Phân Hóa Lãnh Thổ' },
  { id: 'g9_b19', grade: 9, lesson_number: 19, title: 'Bài 19: Vùng Đồng bằng sông Cửu Long', chapter: 'Chương 3: Sự Phân Hóa Lãnh Thổ' },
  { id: 'g9_b20', grade: 9, lesson_number: 20, title: 'Bài 20: Thực hành: Tìm hiểu về tác động của biến đổi khí hậu đối với vùng Đồng bằng sông Cửu Long', chapter: 'Chương 3: Sự Phân Hóa Lãnh Thổ' },
  { id: 'g9_b21', grade: 9, lesson_number: 21, title: 'Bài 21: Phát triển tổng hợp kinh tế và bảo vệ tài nguyên, môi trường biển, đảo', chapter: 'Chương 4: Phát Triển Biển Đảo' },
  { id: 'g9_cd1', grade: 9, lesson_number: 22, title: 'Chủ đề 1: Đô thị: Lịch sử và hiện tại', chapter: 'Chủ Đề Chung' },
  { id: 'g9_cd2', grade: 9, lesson_number: 23, title: 'Chủ đề 2: Văn minh châu thổ sông Hồng và sông Cửu Long', chapter: 'Chủ Đề Chung' },
  { id: 'g9_cd3', grade: 9, lesson_number: 24, title: 'Chủ đề 3: Bảo vệ chủ quyền, các quyền và lợi ích hợp pháp của Việt Nam ở Biển Đông', chapter: 'Chủ Đề Chung' },
];

export const getStoredLessons = (): LessonItem[] => {
  try {
    const saved = localStorage.getItem('geo_curriculum_lessons');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Kiểm tra đủ cả 4 khối (Khối 6: 31, Khối 7: 21, Khối 8: 14, Khối 9: 24)
        const g6Lessons = parsed.filter((l: LessonItem) => l.grade === 6);
        const g7Lessons = parsed.filter((l: LessonItem) => l.grade === 7);
        const g8Lessons = parsed.filter((l: LessonItem) => l.grade === 8);
        const g9Lessons = parsed.filter((l: LessonItem) => l.grade === 9);

        const hasG6Updated = g6Lessons.length >= 30 && g6Lessons.some((l: LessonItem) => l.lesson_number === 30);
        const hasG7Updated = g7Lessons.length >= 20 && g7Lessons.some((l: LessonItem) => l.title.includes('Chủ đề 2') || l.lesson_number === 19);
        const hasG8Updated = g8Lessons.length >= 13 && g8Lessons.some((l: LessonItem) => l.title.includes('Biển Đông') || l.lesson_number === 12);
        const hasG9Updated = g9Lessons.length >= 23 && g9Lessons.some((l: LessonItem) => l.title.includes('Chủ đề 3') || l.lesson_number === 21);

        if (hasG6Updated && hasG7Updated && hasG8Updated && hasG9Updated) {
          return parsed;
        }

        // Tự động đồng bộ bộ sách mới 2026-2027 cho cả 4 Khối
        const otherGradeLessons = parsed.filter((l: LessonItem) => ![6, 7, 8, 9].includes(l.grade));
        const g6Official = DEFAULT_LESSONS.filter((l) => l.grade === 6);
        const g7Official = DEFAULT_LESSONS.filter((l) => l.grade === 7);
        const g8Official = DEFAULT_LESSONS.filter((l) => l.grade === 8);
        const g9Official = DEFAULT_LESSONS.filter((l) => l.grade === 9);
        const merged = [...g6Official, ...g7Official, ...g8Official, ...g9Official, ...otherGradeLessons];
        localStorage.setItem('geo_curriculum_lessons', JSON.stringify(merged));
        return merged;
      }
    }
  } catch (e) {
    console.warn('Lỗi đọc danh sách bài học:', e);
  }
  localStorage.setItem('geo_curriculum_lessons', JSON.stringify(DEFAULT_LESSONS));
  return DEFAULT_LESSONS;
};

export const saveStoredLessons = (lessons: LessonItem[]) => {
  localStorage.setItem('geo_curriculum_lessons', JSON.stringify(lessons));
};
