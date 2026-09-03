import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import { Question, QuestionType } from '../types/database';

export interface ParsedQuestionItem extends Question {
  raw_number?: number;
  warnings?: string[];
  has_explicit_answer?: boolean;
}

export interface ParsedExamResult {
  title: string;
  grade: number;
  questions: ParsedQuestionItem[];
  errors: string[];
  total_warnings?: number;
}

/**
 * Tạo ID ngẫu nhiên cho câu hỏi
 */
export function generateQuestionId(): string {
  return 'q_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now();
}

/**
 * Đọc đề thi từ file Excel (.xlsx, .xls)
 */
export async function parseExcelExam(file: File, defaultGrade: number = 6): Promise<ParsedExamResult> {
  const errors: string[] = [];
  const questions: ParsedQuestionItem[] = [];

  try {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

    if (rows.length === 0) {
      return {
        title: file.name.replace(/\.[^/.]+$/, ''),
        grade: defaultGrade,
        questions: [],
        errors: ['File Excel trống hoặc không có dòng dữ liệu hợp lệ.'],
      };
    }

    rows.forEach((row, index) => {
      const rowNum = index + 2; // Dòng thực tế trong Excel (header là dòng 1)
      const rawType = (row['Dạng câu hỏi'] || row['Loại câu'] || row['type'] || 'single_choice').toString().toLowerCase().trim();
      const questionText = (row['Câu hỏi'] || row['Nội dung'] || row['question'] || '').toString().trim();
      const explanation = (row['Giải thích'] || row['Lời giải'] || row['explanation'] || '').toString().trim();
      const points = Number(row['Điểm'] || row['points'] || 1.0);

      if (!questionText) {
        return; // Bỏ qua dòng trống
      }

      let qType: QuestionType = 'single_choice';
      let contentJson: any = {};
      let correctAnswerJson: any = {};

      if (rawType.includes('nhiều') || rawType === 'multiple_choice') {
        qType = 'multiple_choice';
        const optA = (row['Phương án A'] || row['A'] || '').toString().trim();
        const optB = (row['Phương án B'] || row['B'] || '').toString().trim();
        const optC = (row['Phương án C'] || row['C'] || '').toString().trim();
        const optD = (row['Phương án D'] || row['D'] || '').toString().trim();
        const options = [optA, optB, optC, optD].filter(Boolean);

        const rawAns = (row['Đáp án'] || row['correct'] || '').toString().toUpperCase().trim();
        const correctIndices: number[] = [];
        if (rawAns.includes('A')) correctIndices.push(0);
        if (rawAns.includes('B')) correctIndices.push(1);
        if (rawAns.includes('C')) correctIndices.push(2);
        if (rawAns.includes('D')) correctIndices.push(3);

        contentJson = { question: questionText, options };
        correctAnswerJson = { correct_indices: correctIndices.length > 0 ? correctIndices : [0] };
      } else if (rawType.includes('đúng sai') || rawType === 'true_false') {
        qType = 'true_false';
        const st1 = (row['Mệnh đề 1'] || row['A'] || 'Nhận định 1').toString().trim();
        const st2 = (row['Mệnh đề 2'] || row['B'] || 'Nhận định 2').toString().trim();
        const rawAns = (row['Đáp án'] || row['correct'] || 'Đúng,Sai').toString().toLowerCase();

        const st1Id = 'tf_1';
        const st2Id = 'tf_2';
        contentJson = {
          question: questionText,
          statements: [
            { id: st1Id, text: st1 },
            { id: st2Id, text: st2 },
          ],
        };
        correctAnswerJson = {
          tf_answers: {
            [st1Id]: rawAns.includes('đúng') || rawAns.includes('true') || rawAns.includes('1'),
            [st2Id]: rawAns.includes('sai') || rawAns.includes('false') || rawAns.includes('0'),
          },
        };
      } else if (rawType.includes('điền') || rawType === 'fill_blank') {
        qType = 'fill_blank';
        const rawAns = (row['Đáp án'] || row['correct'] || '').toString().trim();
        const blankId = 'blank_1';
        contentJson = {
          template: questionText.includes('[blank_1]') ? questionText : `${questionText} [blank_1]`,
          blanks: [{ id: blankId, placeholder: 'Điền từ...' }],
        };
        correctAnswerJson = {
          blank_answers: {
            [blankId]: [rawAns],
          },
        };
      } else if (rawType.includes('kéo') || rawType.includes('nối') || rawType === 'drag_drop') {
        qType = 'drag_drop';
        const colA = (row['Cột A'] || row['A'] || 'Địa danh').toString().trim();
        const colB = (row['Cột B'] || row['B'] || 'Đặc điểm').toString().trim();
        const pairId = 'pair_1';
        contentJson = {
          instruction: questionText,
          pairs: [{ id: pairId, left: colA, right: colB }],
        };
        correctAnswerJson = {
          drag_pairs: { [pairId]: colB },
        };
      } else if (rawType.includes('tự luận') || rawType === 'essay') {
        qType = 'essay';
        const sampleAns = (row['Đáp án'] || row['correct'] || '').toString().trim();
        contentJson = {
          prompt: questionText,
          sample_answer: sampleAns,
        };
        correctAnswerJson = {
          essay_sample: sampleAns,
        };
      } else {
        // Mặc định: Trắc nghiệm 1 đáp án (Single Choice)
        qType = 'single_choice';
        const optA = (row['Phương án A'] || row['A'] || '').toString().trim();
        const optB = (row['Phương án B'] || row['B'] || '').toString().trim();
        const optC = (row['Phương án C'] || row['C'] || '').toString().trim();
        const optD = (row['Phương án D'] || row['D'] || '').toString().trim();
        const options = [optA, optB, optC, optD].filter(Boolean);

        const rawAns = (row['Đáp án'] || row['correct'] || 'A').toString().toUpperCase().trim();
        let correctIdx = 0;
        if (rawAns.startsWith('B') || rawAns === '1') correctIdx = 1;
        else if (rawAns.startsWith('C') || rawAns === '2') correctIdx = 2;
        else if (rawAns.startsWith('D') || rawAns === '3') correctIdx = 3;

        contentJson = { question: questionText, options: options.length > 0 ? options : ['Lựa chọn 1', 'Lựa chọn 2'] };
        correctAnswerJson = { correct_index: correctIdx };
      }

      questions.push({
        id: generateQuestionId(),
        grade: defaultGrade,
        type: qType,
        title: questionText.substring(0, 100),
        content_json: contentJson,
        correct_answer_json: correctAnswerJson,
        explanation: explanation || null,
        points: points > 0 ? points : 1.0,
        tags: ['Địa lí THCS', `Khối ${defaultGrade}`],
      });
    });

    return {
      title: file.name.replace(/\.[^/.]+$/, ''),
      grade: defaultGrade,
      questions,
      errors,
    };
  } catch (err: any) {
    return {
      title: file.name,
      grade: defaultGrade,
      questions: [],
      errors: [`Lỗi khi phân tích file Excel: ${err.message}`],
    };
  }
}

/**
 * Bóc tách bảng đáp án ở cuối đề thi (nếu giáo viên để bảng đáp án ở cuối file)
 * Ví dụ: "BẢNG ĐÁP ÁN: 1.A 2.B 3.C 4.D..." hoặc "Câu 1: A, Câu 2: B..."
 */
function extractAnswerKeyMap(fullText: string): Map<number, number> {
  const map = new Map<number, number>();
  const lower = fullText.toLowerCase();

  // Tìm vị trí bắt đầu của phần đáp án
  const keyHeaderMatch = fullText.match(/(?:BẢNG\s*ĐÁP\s*ÁN|HƯỚNG\s*DẪN\s*CHẤM|PHẦN\s*ĐÁP\s*ÁN|ĐÁP\s*ÁN\s*CHI\s*TIẾT|ĐÁP\s*ÁN\s*CÁC\s*CÂU)/i);
  if (!keyHeaderMatch || keyHeaderMatch.index === undefined) {
    return map;
  }

  const answerSection = fullText.substring(keyHeaderMatch.index);
  // Match các mẫu: "1.A", "1-A", "1: A", "Câu 1: A", "1A", "Câu 1. A"
  const pairRegex = /(?:Câu\s*)?(\d+)\s*[:.\-=/]?\s*([A-D])\b/gi;
  let match;
  while ((match = pairRegex.exec(answerSection)) !== null) {
    const qNum = parseInt(match[1], 10);
    const char = match[2].toUpperCase();
    let idx = 0;
    if (char === 'B') idx = 1;
    else if (char === 'C') idx = 2;
    else if (char === 'D') idx = 3;
    map.set(qNum, idx);
  }

  return map;
}

/**
 * Tách nội dung file Word thành từng khối câu hỏi riêng biệt
 */
function splitIntoQuestionBlocks(fullText: string): Array<{ questionNumber: number | null; text: string }> {
  // Chuẩn hóa dòng
  const cleanText = fullText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Cắt bỏ phần Bảng đáp án ở cuối nếu có để không bị lẫn thành câu hỏi
  let bodyText = cleanText;
  const keyHeaderMatch = cleanText.match(/\n\s*(?:BẢNG\s*ĐÁP\s*ÁN|HƯỚNG\s*DẪN\s*CHẤM|PHẦN\s*ĐÁP\s*ÁN)\s*[:\n]/i);
  if (keyHeaderMatch && keyHeaderMatch.index !== undefined) {
    bodyText = cleanText.substring(0, keyHeaderMatch.index);
  }

  // Mẫu nhận diện bắt đầu câu hỏi: "Câu 1:", "Câu 1.", "Câu 1-", "Bài 1:", "CÂU 1:", "Câu 01:"
  const questionRegex = /(?:^|\n)\s*(?:Câu|Bài|CÂU|BÀI|Question)\s*(\d+)[\s:.\-–—)]+/gi;
  const matches: Array<{ qNum: number; index: number; headerLength: number }> = [];

  let match;
  while ((match = questionRegex.exec(bodyText)) !== null) {
    matches.push({
      qNum: parseInt(match[1], 10),
      index: match.index,
      headerLength: match[0].length,
    });
  }

  // Nếu không tìm thấy chữ "Câu X:", thử tìm dạng số đầu dòng "1.", "2.", "3."
  if (matches.length === 0) {
    const numRegex = /(?:^|\n)\s*(\d+)[\s:.\-–—)]+\s*(?=[A-ZÀ-Ỹ])/g;
    while ((match = numRegex.exec(bodyText)) !== null) {
      matches.push({
        qNum: parseInt(match[1], 10),
        index: match.index,
        headerLength: match[0].length,
      });
    }
  }

  if (matches.length === 0) {
    // Không nhận diện được cấu trúc, trả về toàn bộ văn bản
    return [{ questionNumber: null, text: bodyText }];
  }

  const blocks: Array<{ questionNumber: number | null; text: string }> = [];
  for (let i = 0; i < matches.length; i++) {
    const curr = matches[i];
    const next = matches[i + 1];
    const rawBlock = next ? bodyText.substring(curr.index, next.index) : bodyText.substring(curr.index);

    blocks.push({
      questionNumber: curr.qNum,
      text: rawBlock.trim(),
    });
  }

  return blocks;
}

/**
 * Bóc tách nội dung câu hỏi và các phương án A, B, C, D một cách chính xác tuyệt đối
 */
function extractOptions(blockText: string): {
  questionText: string;
  options: string[];
  detectedCorrectIdx: number | null;
} {
  // Loại bỏ tiền tố "Câu X:" ở đầu câu hỏi
  let cleanBlock = blockText.replace(/^(?:Câu|Bài|CÂU|BÀI|Question)?\s*\d+[\s:.\-–—)]+/i, '').trim();

  // Tìm vị trí các phương án A, B, C, D
  // Hỗ trợ: "A.", "A)", "A:", "A/", "A -", "*A." (tích sao là đáp án đúng)
  const optionRegex = /(?:^|\n|(?<=\s{2,})|(?<=\t)|(?<=\s))\s*(\*?)\s*([A-D])[\s.\)\/:\-–—]\s*(\*?)/gi;
  
  interface OptionToken {
    letter: string;
    index: number;
    matchLength: number;
    isMarkedCorrect: boolean;
  }

  const tokens: OptionToken[] = [];
  let match;
  while ((match = optionRegex.exec(cleanBlock)) !== null) {
    const isMarked = Boolean(match[1] === '*' || match[3] === '*');
    tokens.push({
      letter: match[2].toUpperCase(),
      index: match.index,
      matchLength: match[0].length,
      isMarkedCorrect: isMarked,
    });
  }

  // Lọc lấy chuỗi thứ tự chuẩn A -> B -> C -> D
  const orderedTokens: OptionToken[] = [];
  const targetLetters = ['A', 'B', 'C', 'D'];
  let currentTargetIdx = 0;

  for (const t of tokens) {
    if (t.letter === targetLetters[currentTargetIdx]) {
      orderedTokens.push(t);
      currentTargetIdx++;
      if (currentTargetIdx >= targetLetters.length) break;
    }
  }

  // Nếu không đủ A và B thì không phải câu trắc nghiệm
  if (orderedTokens.length < 2) {
    return {
      questionText: cleanBlock,
      options: [],
      detectedCorrectIdx: null,
    };
  }

  // Câu hỏi là phần văn bản từ đầu đến trước phương án A
  const tokenA = orderedTokens[0];
  const questionText = cleanBlock.substring(0, tokenA.index).trim();

  const options: string[] = [];
  let detectedCorrectIdx: number | null = null;

  for (let i = 0; i < orderedTokens.length; i++) {
    const curr = orderedTokens[i];
    const next = orderedTokens[i + 1];
    const startIdx = curr.index + curr.matchLength;
    const endIdx = next ? next.index : cleanBlock.length;

    let optContent = cleanBlock.substring(startIdx, endIdx).trim();

    // Dọn dẹp dấu chấm phẩy, dấu chấm ở cuối nếu có
    optContent = optContent.replace(/^[.\s:–—-]+/, '').trim();

    // Kiểm tra nếu có dấu sao đánh dấu đáp án đúng
    if (curr.isMarkedCorrect || optContent.startsWith('*') || optContent.endsWith('*')) {
      detectedCorrectIdx = i;
      optContent = optContent.replace(/^\*+|\*+$/g, '').trim();
    }

    if (optContent) {
      options.push(optContent);
    }
  }

  return {
    questionText: questionText || 'Câu hỏi trắc nghiệm',
    options,
    detectedCorrectIdx,
  };
}

/**
 * Đọc đề thi từ file Word (.docx) sử dụng Mammoth với thuật toán bóc tách Tiếng Việt nâng cao
 */
export async function parseWordExam(file: File, defaultGrade: number = 7): Promise<ParsedExamResult> {
  const errors: string[] = [];
  const questions: ParsedQuestionItem[] = [];

  try {
    const arrayBuffer = await file.arrayBuffer();

    // Đọc đồng thời Raw Text và HTML để trích xuất đầy đủ định dạng
    const [rawResult, htmlResult] = await Promise.all([
      mammoth.extractRawText({ arrayBuffer }),
      mammoth.convertToHtml({ arrayBuffer }),
    ]);

    let fullText = (rawResult.value || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const htmlText = htmlResult.value || '';

    // Xử lý các khoảng trắng đặc biệt (NBSP, non-breaking spaces)
    fullText = fullText.replace(/[\u00A0\u1680\u180e\u2000-\u200b\u202f\u205f\u3000\ufeff]/g, ' ');

    if (!fullText.trim()) {
      return {
        title: file.name.replace(/\.[^/.]+$/, ''),
        grade: defaultGrade,
        questions: [],
        errors: ['File Word trống hoặc không đọc được văn bản.'],
      };
    }

    // 1. Trích xuất bảng đáp án ở cuối văn bản (nếu có)
    const answerKeyMap = extractAnswerKeyMap(fullText);

    // 2. Tách văn bản thành từng câu hỏi
    const questionBlocks = splitIntoQuestionBlocks(fullText);

    questionBlocks.forEach((block, index) => {
      const qNum = block.questionNumber || (index + 1);
      let rawBlock = block.text.trim();
      if (!rawBlock) return;

      // 3. Trích xuất Lời giải / Giải thích (nếu có)
      let explanation = '';
      const expMatch = rawBlock.match(/\n\s*(?:Lời\s*giải|Giải\s*thích|Hướng\s*dẫn\s*giải|HDG|Hướng\s*dẫn|Giải\s*thích\s*chi\s*tiết)\s*[:=.\-–—]\s*([\s\S]+?)$/i);
      if (expMatch && expMatch.index !== undefined) {
        explanation = expMatch[1].trim();
        rawBlock = rawBlock.substring(0, expMatch.index).trim();
      }

      // 4. Trích xuất dòng Đáp án trực tiếp trong câu (nếu có)
      // Ví dụ: "Đáp án: A", "Đ/a: B", "Chọn C", "Key: D"
      let directAnswerChar = '';
      const ansMatch = rawBlock.match(/\n\s*(?:Đáp\s*án\s*đúng|Đáp\s*án|Đ\/a|Đ\/A|ĐA|Chọn|Key)\s*[:=.\-–—]\s*([A-D])/i);
      if (ansMatch && ansMatch.index !== undefined) {
        directAnswerChar = ansMatch[1].toUpperCase();
        rawBlock = rawBlock.substring(0, ansMatch.index).trim();
      }

      // 5. Bóc tách câu hỏi và các phương án A, B, C, D
      const parsed = extractOptions(rawBlock);

      if (parsed.options.length >= 2) {
        // Kiểm tra xem đây có phải là câu Điền vào chỗ trống hay không
        const textLower = parsed.questionText.toLowerCase();
        const isFill =
          (textLower.match(/\(\s*\d+\s*\)[\s._\-–—]*/g) || []).length >= 2 ||
          textLower.includes('hoàn thành đoạn') ||
          textLower.includes('sử dụng những cụm từ') ||
          textLower.includes('sử dụng các từ') ||
          textLower.includes('điền vào chỗ trống');

        if (isFill) {
          const parenMatches = parsed.questionText.match(/\(\s*\d+\s*\)/g) || [];
          const blankCount = Math.max(parenMatches.length, parsed.options.length, 1);
          const blankAnswersObj: Record<string, string[]> = {};
          parsed.options.forEach((opt, idx) => {
            const cleanOpt = String(opt).replace(/^[A-D][.\s:–—)]+/, '').trim();
            blankAnswersObj[`blank_${idx + 1}`] = [cleanOpt || opt];
          });

          questions.push({
            id: generateQuestionId(),
            grade: defaultGrade,
            type: 'fill_blank',
            raw_number: qNum,
            warnings: [],
            has_explicit_answer: true,
            title: parsed.questionText.substring(0, 120),
            content_json: {
              template: parsed.questionText,
              question: parsed.questionText,
              options: parsed.options,
              blanks: Array.from({ length: blankCount }, (_, i) => ({
                id: `blank_${i + 1}`,
                placeholder: `Chọn đáp án (${i + 1})...`,
              })),
            },
            correct_answer_json: {
              blank_answers: blankAnswersObj,
            },
            explanation: explanation || null,
            points: 1.0,
            tags: ['Điền từ', 'Word Import', `Khối ${defaultGrade}`],
          });
          return;
        }

        // Câu hỏi trắc nghiệm hợp lệ
        let correctIdx = 0; // Mặc định là A
        let hasExplicitAnswer = false;
        const qWarnings: string[] = [];

        if (directAnswerChar) {
          hasExplicitAnswer = true;
          if (directAnswerChar === 'B') correctIdx = 1;
          else if (directAnswerChar === 'C') correctIdx = 2;
          else if (directAnswerChar === 'D') correctIdx = 3;
        } else if (answerKeyMap.has(qNum)) {
          hasExplicitAnswer = true;
          correctIdx = answerKeyMap.get(qNum)!;
        } else if (parsed.detectedCorrectIdx !== null) {
          hasExplicitAnswer = true;
          correctIdx = parsed.detectedCorrectIdx;
        } else {
          qWarnings.push('Chưa tìm thấy dòng đáp án (hệ thống tạm chọn A).');
        }

        if (parsed.options.length < 4) {
          qWarnings.push(`Chỉ có ${parsed.options.length} lựa chọn (thiếu phương án D).`);
        }

        // Đảm bảo correct_index không vượt quá số lượng options
        if (correctIdx >= parsed.options.length) {
          correctIdx = 0;
        }

        questions.push({
          id: generateQuestionId(),
          grade: defaultGrade,
          type: 'single_choice',
          raw_number: qNum,
          warnings: qWarnings,
          has_explicit_answer: hasExplicitAnswer,
          title: parsed.questionText.substring(0, 120),
          content_json: {
            question: parsed.questionText,
            options: parsed.options,
          },
          correct_answer_json: {
            correct_index: correctIdx,
          },
          explanation: explanation || null,
          points: 1.0,
          tags: ['Word Import', `Khối ${defaultGrade}`],
        });
      } else {
        // Dạng Tự Luận hoặc nội dung mở
        const cleanPrompt = rawBlock.replace(/^(?:Câu|Bài|CÂU|BÀI)?\s*\d+[\s:.\-–—)]+/i, '').trim();
        if (cleanPrompt && cleanPrompt.length > 5) {
          questions.push({
            id: generateQuestionId(),
            grade: defaultGrade,
            type: 'essay',
            title: cleanPrompt.substring(0, 120),
            content_json: {
              prompt: cleanPrompt,
              sample_answer: explanation,
            },
            correct_answer_json: {
              essay_sample: explanation,
            },
            explanation: explanation || null,
            points: 2.0,
            tags: ['Tự luận', `Khối ${defaultGrade}`],
          });
        }
      }
    });

    return {
      title: file.name.replace(/\.[^/.]+$/, ''),
      grade: defaultGrade,
      questions: questions.length > 0 ? questions : [],
      errors: questions.length === 0 ? ['Không nhận diện được câu hỏi trong file Word. Cô hãy kiểm tra lại định dạng câu hỏi (Ví dụ: "Câu 1: ... A. ... B. ... C. ... D. ...").'] : [],
    };
  } catch (err: any) {
    return {
      title: file.name,
      grade: defaultGrade,
      questions: [],
      errors: [`Lỗi khi phân tích file Word: ${err.message}`],
    };
  }
}

/**
 * Tạo và tải xuống file Excel mẫu đề thi Địa lí THCS chuẩn hóa
 */
export function downloadSampleExcelTemplate() {
  const sampleData = [
    {
      'Dạng câu hỏi': 'single_choice',
      'Câu hỏi': 'Nước ta nằm ở vị trí nào trong khu vực Đông Nam Á?',
      'Phương án A': 'Rìa phía đông của bán đảo Trung Ấn',
      'Phương án B': 'Trung tâm bán đảo Mã Lai',
      'Phương án C': 'Phía tây của quần đảo Mã Lai',
      'Phương án D': 'Phía bắc của bán đảo Đông Dương',
      'Đáp án': 'A',
      'Giải thích': 'Việt Nam nằm ở rìa phía đông của bán đảo Trung Ấn, tiếp giáp Biển Đông.',
      'Điểm': 1.0,
    },
    {
      'Dạng câu hỏi': 'single_choice',
      'Câu hỏi': 'Câu thơ đố vui Địa lí: "Bình Định có núi Vọng Phu / Có đầm Thị Nại, có cù lao Xanh". Đầm Thị Nại thuộc tỉnh nào?',
      'Phương án A': 'Bình Định',
      'Phương án B': 'Phú Yên',
      'Phương án C': 'Khánh Hòa',
      'Phương án D': 'Quảng Ngãi',
      'Đáp án': 'A',
      'Giải thích': 'Đầm Thị Nại là đầm lớn nhất tỉnh Bình Định.',
      'Điểm': 1.0,
    },
    {
      'Dạng câu hỏi': 'multiple_choice',
      'Câu hỏi': 'Những khoáng sản năng lượng quan trọng của Việt Nam là gì? (Chọn các đáp án đúng)',
      'Phương án A': 'Than đá',
      'Phương án B': 'Dầu mỏ',
      'Phương án C': 'Khí đốt',
      'Phương án D': 'Bô-xít',
      'Đáp án': 'A, B, C',
      'Giải thích': 'Than đá, dầu mỏ, khí đốt là khoáng sản năng lượng; Bô-xít là khoáng sản kim loại.',
      'Điểm': 1.5,
    },
    {
      'Dạng câu hỏi': 'true_false',
      'Câu hỏi': 'Xét tính đúng/sai của các nhận định về khí hậu nước ta:',
      'Mệnh đề 1': 'Khí hậu Việt Nam mang tính chất nhiệt đới ẩm gió mùa.',
      'Mệnh đề 2': 'Gió mùa Đông Bắc làm cho miền Nam nước ta có mùa đông lạnh.',
      'Đáp án': 'Đúng,Sai',
      'Giải thích': 'Gió mùa Đông Bắc chỉ tác động chủ yếu từ dãy Bạch Mã trở ra Bắc.',
      'Điểm': 1.5,
    },
    {
      'Dạng câu hỏi': 'fill_blank',
      'Câu hỏi': 'Đỉnh núi cao nhất Việt Nam là đỉnh [blank_1], được mệnh danh là nóc nhà Đông Dương.',
      'Đáp án': 'Phan-xi-păng',
      'Giải thích': 'Đỉnh Fansipan (Phan-xi-păng) cao 3.143m thuộc dãy Hoàng Liên Sơn.',
      'Điểm': 1.0,
    },
    {
      'Dạng câu hỏi': 'drag_drop',
      'Câu hỏi': 'Ghép nối các dạng địa hình với vùng phân bố tương ứng:',
      'Cột A': 'Đồng bằng sông Cửu Long',
      'Cột B': 'Vùng đất trũng ngập nước và mạng lưới kênh rạch chằng chịt',
      'Đáp án': '',
      'Giải thích': 'Đặc điểm nổi bật của ĐBSCL.',
      'Điểm': 1.5,
    },
    {
      'Dạng câu hỏi': 'essay',
      'Câu hỏi': 'Em hãy trình bày ý nghĩa của vị trí địa lí đối với tự nhiên và kinh tế nước ta.',
      'Đáp án': 'Gợi ý: Thuận lợi phát triển kinh tế biển, giao thương quốc tế, khí hậu nhiệt đới ẩm dồi dào tài nguyên sinh vật.',
      'Giải thích': 'Học sinh phân tích theo 2 khía cạnh: Tự nhiên và Kinh tế - xã hội.',
      'Điểm': 2.5,
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'De_Thi_Mau_Dia_Li');

  XLSX.writeFile(workbook, 'Mau_De_Thi_Dia_Li_THCS.xlsx');
}
