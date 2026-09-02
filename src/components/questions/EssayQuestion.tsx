import React from 'react';
import { Question } from '../../types/database';
import { LatexRenderer } from '../common/LatexRenderer';
import { FileText, Lightbulb, CheckCircle2 } from 'lucide-react';

interface EssayQuestionProps {
  question: Question;
  studentAnswer: string | undefined;
  onAnswerChange: (answer: string) => void;
  disabled?: boolean;
  showCorrect?: boolean;
}

export const EssayQuestion: React.FC<EssayQuestionProps> = ({
  question,
  studentAnswer = '',
  onAnswerChange,
  disabled = false,
  showCorrect = false,
}) => {
  const content = question.content_json || {};
  const prompt: string = content.prompt || question.title || '';
  const sampleAnswer = question.correct_answer_json?.essay_sample || content.sample_answer;
  const wordCount = studentAnswer.trim() ? studentAnswer.trim().split(/\s+/).length : 0;

  return (
    <div className="space-y-3">
      {prompt && (
        <div className="text-sm sm:text-base font-semibold text-slate-800 leading-relaxed bg-slate-50/70 p-4 rounded-xl border border-slate-200">
          <LatexRenderer content={prompt} />
        </div>
      )}

      <div>
        <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5 font-medium">
          <span className="flex items-center gap-1">
            <FileText className="w-3.5 h-3.5 text-ocean-600" />
            Khung bài làm tự luận của học sinh:
          </span>
          <span className="font-mono text-slate-400">
            {wordCount} từ
          </span>
        </div>

        <textarea
          disabled={disabled}
          rows={6}
          value={studentAnswer}
          onChange={(e) => onAnswerChange(e.target.value)}
          placeholder="Nhập phần phân tích, giải thích hoặc bài làm tự luận của em vào đây..."
          className={`w-full p-4 rounded-xl border text-sm focus:outline-none focus:ring-2 resize-y font-normal leading-relaxed ${
            disabled ? 'bg-slate-50 text-slate-700' : 'bg-white border-slate-200 focus:ring-ocean-500 focus:border-ocean-500'
          }`}
        />
      </div>

      {showCorrect && sampleAnswer && (
        <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 text-xs sm:text-sm text-amber-950 space-y-1.5">
          <div className="font-bold flex items-center gap-1.5 text-amber-900">
            <Lightbulb className="w-4 h-4 text-amber-600" />
            Gợi ý đáp án chuẩn & Thang điểm của Cô:
          </div>
          <div className="text-amber-800 leading-relaxed pl-5">
            <LatexRenderer content={sampleAnswer} />
          </div>
        </div>
      )}
    </div>
  );
};
