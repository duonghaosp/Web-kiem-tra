import { Question, CorrectAnswerJson } from '../types/database';
import { normalizeQuestion } from './questionUtils';

export interface QuestionGradeResult {
  questionId: string;
  type: string;
  score: number;
  maxScore: number;
  isCorrect: boolean;
  partialRatio: number; // 0.0 -> 1.0
  feedback?: string;
}

export interface ExamGradeResult {
  totalScore: number;
  maxScore: number;
  percentage: number;
  isPassed: boolean;
  hasEssay: boolean;
  objectiveScore: number; // Điểm đạt được phần trắc nghiệm
  objectiveMaxScore: number; // Điểm tối đa phần trắc nghiệm
  essayMaxScore: number; // Điểm tối đa phần tự luận
  detailedResults: Record<string, QuestionGradeResult>;
}

/**
 * Tự động chấm điểm từng câu hỏi Địa lí dựa trên số điểm thực tế của câu hỏi đó
 */
export function gradeSingleQuestion(
  rawQuestion: Question,
  studentAnswer: any,
  maxPoints: number = 1.0
): QuestionGradeResult {
  const question = normalizeQuestion(rawQuestion);
  const qType = question.type;
  const correctAns: CorrectAnswerJson = question.correct_answer_json || {};

  // Mặc định kết quả
  let score = 0;
  let partialRatio = 0;
  let isCorrect = false;
  let feedback = '';

  switch (qType) {
    case 'single_choice': {
      const correctIdx = correctAns.correct_index;
      if (typeof studentAnswer === 'number' && studentAnswer === correctIdx) {
        score = maxPoints;
        partialRatio = 1.0;
        isCorrect = true;
        feedback = 'Chính xác 100%';
      } else {
        score = 0;
        partialRatio = 0;
        isCorrect = false;
        feedback = 'Chưa chính xác';
      }
      break;
    }

    case 'multiple_choice': {
      const correctIndices = (correctAns.correct_indices || []).map(Number);
      const studentIndices = Array.isArray(studentAnswer) ? studentAnswer.map(Number) : [];

      if (correctIndices.length === 0) {
        score = maxPoints;
        isCorrect = true;
        feedback = 'Chính xác';
        break;
      }

      // Đếm số đáp án chọn đúng và chọn sai
      let correctSelected = 0;
      let wrongSelected = 0;

      studentIndices.forEach((idx) => {
        if (correctIndices.includes(idx)) {
          correctSelected++;
        } else {
          wrongSelected++;
        }
      });

      // Điểm trừ cho lựa chọn sai
      const netCorrect = Math.max(0, correctSelected - wrongSelected);
      partialRatio = Number((netCorrect / correctIndices.length).toFixed(2));
      score = Number((maxPoints * partialRatio).toFixed(2));
      isCorrect = partialRatio === 1.0;

      if (isCorrect) {
        feedback = 'Chọn đủ tất cả các đáp án đúng';
      } else if (partialRatio > 0) {
        feedback = `Đúng một phần (${correctSelected}/${correctIndices.length} ý)`;
      } else {
        feedback = 'Chưa chính xác';
      }
      break;
    }

    case 'true_false': {
      const tfAnswers = correctAns.tf_answers || {};
      const studentTf = studentAnswer || {};
      const statementKeys = Object.keys(tfAnswers);

      if (statementKeys.length === 0) {
        score = maxPoints;
        isCorrect = true;
        feedback = 'Chính xác';
        break;
      }

      let correctCount = 0;
      statementKeys.forEach((key) => {
        if (studentTf[key] === tfAnswers[key]) {
          correctCount++;
        }
      });

      partialRatio = Number((correctCount / statementKeys.length).toFixed(2));
      score = Number((maxPoints * partialRatio).toFixed(2));
      isCorrect = correctCount === statementKeys.length;
      feedback = `Đúng ${correctCount}/${statementKeys.length} mệnh đề`;
      break;
    }

    case 'fill_blank': {
      let blankAnswers = correctAns.blank_answers || {};
      const studentBlanks = studentAnswer || {};
      let blankKeys = Object.keys(blankAnswers);

      if (blankKeys.length === 0 && Array.isArray(question.content_json?.options) && question.content_json.options.length > 0) {
        const autoObj: Record<string, string[]> = {};
        question.content_json.options.forEach((opt: any, idx: number) => {
          autoObj[`blank_${idx + 1}`] = [String(opt)];
        });
        blankAnswers = autoObj;
        blankKeys = Object.keys(autoObj);
      }

      if (blankKeys.length === 0) {
        score = maxPoints;
        isCorrect = true;
        feedback = 'Chính xác';
        break;
      }

      let correctCount = 0;
      blankKeys.forEach((key, idx) => {
        const rawAllowed = blankAnswers[key] || [];
        const allowedList: string[] = Array.isArray(rawAllowed) ? rawAllowed : [String(rawAllowed)];
        const numKey = key.replace(/\D/g, '') || String(idx + 1);

        // Lấy câu trả lời của học sinh theo cả dạng 'blank_1', '1', index...
        const rawStudentText =
          studentBlanks[key] ??
          studentBlanks[`blank_${numKey}`] ??
          studentBlanks[numKey] ??
          '';

        const cleanAnswerText = (txt: any) =>
          String(txt || '')
            .replace(/<[^>]+>/g, '')
            .replace(/^\s*\(\s*\d+\s*\)\s*/, '')
            .replace(/^\s*\[\s*\d+\s*\]\s*/, '')
            .replace(/^\s*\d+[\s:.\-–—)]+/, '')
            .trim()
            .toLowerCase()
            .replace(/^[.,;:'"]+|[.,;:'"]+$/g, '');

        const cleanStudentText = cleanAnswerText(rawStudentText);

        const match = allowedList.some((ans) => {
          const cleanAns = cleanAnswerText(ans);
          return cleanStudentText === cleanAns;
        });

        if (match && cleanStudentText.length > 0) {
          correctCount++;
        }
      });

      partialRatio = Number((correctCount / blankKeys.length).toFixed(2));
      score = Number((maxPoints * partialRatio).toFixed(2));
      isCorrect = correctCount === blankKeys.length;
      feedback = `Điền đúng ${correctCount}/${blankKeys.length} vị trí`;
      break;
    }

    case 'drag_drop': {
      const dragPairs = correctAns.drag_pairs || {};
      const studentPairs = studentAnswer || {};
      const pairKeys = Object.keys(dragPairs);

      if (pairKeys.length === 0) {
        score = maxPoints;
        isCorrect = true;
        feedback = 'Chính xác';
        break;
      }

      let correctCount = 0;
      pairKeys.forEach((key) => {
        if (studentPairs[key] && studentPairs[key] === dragPairs[key]) {
          correctCount++;
        }
      });

      partialRatio = Number((correctCount / pairKeys.length).toFixed(2));
      score = Number((maxPoints * partialRatio).toFixed(2));
      isCorrect = correctCount === pairKeys.length;
      feedback = `Ghép nối đúng ${correctCount}/${pairKeys.length} cặp`;
      break;
    }

    case 'essay': {
      // Câu hỏi tự luận: Không chấm tự động, đưa sang cho giáo viên chấm và nhận xét
      score = 0;
      partialRatio = 0;
      isCorrect = false;
      feedback = 'Chờ cô Hảo chấm điểm và nhận xét';
      break;
    }

    default:
      score = 0;
      partialRatio = 0;
      isCorrect = false;
      feedback = 'Dạng câu hỏi chưa được hỗ trợ';
  }

  return {
    questionId: question.id,
    type: qType,
    score,
    maxScore: maxPoints,
    isCorrect,
    partialRatio,
    feedback,
  };
}

/**
 * Chấm điểm toàn bộ bài kiểm tra linh hoạt:
 * - Điểm số của từng câu phụ thuộc 100% vào số điểm Giáo viên thiết lập cho câu hỏi đó
 * - Không cố định tỷ lệ 70/30, hoạt động hoàn hảo cho đề 100% trắc nghiệm hoặc có tự luận
 */
export function gradeEntireExam(
  questions: Question[],
  studentAnswers: Record<string, any>,
  targetTotalPoints?: number
): ExamGradeResult {
  if (!questions || questions.length === 0) {
    const fallbackMax = targetTotalPoints || 10.0;
    return {
      totalScore: 0,
      maxScore: fallbackMax,
      percentage: 0,
      isPassed: false,
      hasEssay: false,
      objectiveScore: 0,
      objectiveMaxScore: 0,
      essayMaxScore: 0,
      detailedResults: {},
    };
  }

  const essayQuestions = questions.filter((q) => q.type === 'essay');
  const objectiveQuestions = questions.filter((q) => q.type !== 'essay');
  const hasEssay = essayQuestions.length > 0;

  // Tính tổng điểm tối đa dựa trên điểm số thực tế của các câu hỏi được chọn
  const objectiveMaxScore = Number(
    objectiveQuestions.reduce((sum, q) => sum + (Number(q.points) || 1.0), 0).toFixed(2)
  );
  const essayMaxScore = Number(
    essayQuestions.reduce((sum, q) => sum + (Number(q.points) || 1.0), 0).toFixed(2)
  );
  const totalMaxScore = Number((objectiveMaxScore + essayMaxScore).toFixed(2));

  const detailedResults: Record<string, QuestionGradeResult> = {};
  let objectiveScore = 0;

  // 1. Chấm phần trắc nghiệm khách quan theo đúng điểm số của từng câu
  objectiveQuestions.forEach((q) => {
    const qPoint = Number(q.points) || 1.0;
    const ans = studentAnswers[q.id];
    const result = gradeSingleQuestion(q, ans, qPoint);
    detailedResults[q.id] = result;
    objectiveScore += result.score;
  });

  // 2. Xử lý câu tự luận theo đúng điểm số thiết lập
  essayQuestions.forEach((q) => {
    const qPoint = Number(q.points) || 1.0;
    detailedResults[q.id] = {
      questionId: q.id,
      type: 'essay',
      score: 0,
      maxScore: qPoint,
      isCorrect: false,
      partialRatio: 0,
      feedback: 'Chờ cô Hảo chấm điểm và nhận xét',
    };
  });

  objectiveScore = Number(Math.min(objectiveMaxScore, Math.max(0, objectiveScore)).toFixed(2));
  const totalScore = objectiveScore; // Điểm hiện tại trước khi cô chấm tự luận
  const percentage = totalMaxScore > 0 ? Math.round((totalScore / totalMaxScore) * 100) : 0;
  const isPassed = totalMaxScore > 0 ? totalScore >= totalMaxScore / 2 : true;

  return {
    totalScore,
    maxScore: totalMaxScore,
    percentage,
    isPassed,
    hasEssay,
    objectiveScore,
    objectiveMaxScore,
    essayMaxScore,
    detailedResults,
  };
}
