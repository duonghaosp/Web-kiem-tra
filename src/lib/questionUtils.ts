import { Question } from '../types/database';

/**
 * Kiểm tra xem câu hỏi có bản chất là "Điền vào chỗ trống" hay không,
 * kể cả khi đang bị lưu nhầm thành 'single_choice'.
 */
export function isFillBlankQuestion(q: Question): boolean {
  if (!q) return false;
  if (q.type === 'fill_blank') return true;

  const rawText = (
    (q.content_json?.question || '') + ' ' +
    (q.content_json?.template || '') + ' ' +
    (q.title || '')
  ).toLowerCase();

  // 1. Kiểm tra mẫu có các số ngoặc đơn đánh dấu chỗ trống: (1)... (2)...
  const parenMatches = rawText.match(/\(\s*\d+\s*\)[\s._\-–—]*/g) || [];
  if (parenMatches.length >= 2) return true;

  // 2. Chứa tag [blank_1] hoặc tương đương
  if (/\[blank_\w+\]/i.test(rawText)) return true;

  // 3. Chứa từ khóa chỉ dẫn dạng điền từ kết hợp với số thứ tự
  const hasFillKeywords =
    rawText.includes('hoàn thành đoạn') ||
    rawText.includes('sử dụng những cụm từ') ||
    rawText.includes('sử dụng các từ') ||
    rawText.includes('điền vào chỗ trống') ||
    rawText.includes('chọn từ thích hợp') ||
    rawText.includes('chọn cụm từ thích hợp') ||
    rawText.includes('điền từ');

  if (hasFillKeywords && (rawText.includes('(1)') || rawText.includes('(2)') || rawText.includes('...'))) {
    return true;
  }

  return false;
}

/**
 * Chuẩn hóa câu hỏi: Tự động chuyển đổi và khôi phục dạng Điền vào chỗ trống nếu câu hỏi thỏa mãn
 */
export function normalizeQuestion(q: Question): Question {
  if (!q) return q;

  if (isFillBlankQuestion(q)) {
    const content = q.content_json || {};
    const text = content.template || content.question || q.title || '';
    const options: string[] = Array.isArray(content.options) ? content.options : [];

    // Tìm các vị trí số (1), (2), (3)... trong văn bản
    const parenMatches = text.match(/\(\s*\d+\s*\)/g) || [];
    const detectedBlankCount = Math.max(parenMatches.length, options.length, 1);

    const existingBlankAnswers = q.correct_answer_json?.blank_answers || {};
    const blankAnswersObj: Record<string, string[]> = { ...existingBlankAnswers };

    // Nếu chưa có blank_answers nhưng có danh sách options A, B, C, D...
    // Mặc định liên kết vị trí 1 -> A, 2 -> B, 3 -> C, 4 -> D
    if (Object.keys(blankAnswersObj).length === 0 && options.length >= 2) {
      options.forEach((opt, idx) => {
        const cleanOpt = String(opt).replace(/^[A-D][.\s:–—)]+/, '').trim();
        blankAnswersObj[`blank_${idx + 1}`] = [cleanOpt || opt];
      });
    }

    // Tạo danh sách blanks
    const blanksList = Array.from({ length: detectedBlankCount }, (_, i) => {
      const bKey = `blank_${i + 1}`;
      return {
        id: bKey,
        placeholder: `Chọn đáp án (${i + 1})...`,
      };
    });

    return {
      ...q,
      type: 'fill_blank',
      content_json: {
        ...content,
        template: text,
        blanks: blanksList,
        options: options,
      },
      correct_answer_json: {
        ...q.correct_answer_json,
        blank_answers: blankAnswersObj,
      },
    };
  }

  return q;
}

export function normalizeQuestionList(questions: Question[]): Question[] {
  if (!Array.isArray(questions)) return [];
  return questions.map(normalizeQuestion);
}
