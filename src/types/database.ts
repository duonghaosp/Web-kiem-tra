export type UserRole = 'admin' | 'teacher' | 'student';

export type QuestionType =
  | 'single_choice'
  | 'multiple_choice'
  | 'true_false'
  | 'fill_blank'
  | 'drag_drop'
  | 'essay';

export type ExamCategory =
  | 'thuong_xuyen'
  | 'giua_ki_1'
  | 'hoc_ki_1'
  | 'giua_ki_2'
  | 'hoc_ki_2';

export type TargetType = 'class' | 'group' | 'individual';

export interface Profile {
  id: string;
  username: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string | null;
  student_code?: string | null;
  grade?: number | null;
  xp: number;
  level: number;
  created_at?: string;
  updated_at?: string;
  class_name?: string;
}

export interface ClassItem {
  id: string;
  grade: number; // 6, 7, 8, 9
  name: string; // Lớp 6A1, 6A2...
  academic_year?: string;
  teacher_name?: string;
  created_at?: string;
  student_count?: number;
}

export interface ClassMember {
  id: string;
  class_id: string;
  student_id: string;
  joined_at?: string;
  student?: Profile;
  class?: ClassItem;
}

// Cấu trúc nội dung 6 dạng câu hỏi:
// 1. Single Choice: { question: string, options: string[], raw_text?: string }
// 2. Multiple Choice: { question: string, options: string[], raw_text?: string }
// 3. True/False: { statements: Array<{ id: string; text: string; is_true: boolean }> }
// 4. Fill in the blank: { template: string, blanks: Array<{ id: string; placeholder: string; answer: string }> }
// 5. Drag and drop pairs: { pairs: Array<{ id: string; left: string; right: string }> }
// 6. Essay: { prompt: string, sample_answer?: string, criteria?: string }

export interface SingleChoiceContent {
  question: string;
  options: string[];
  image_url?: string;
  image_caption?: string;
  option_images?: (string | null | undefined)[];
}

export interface MultipleChoiceContent {
  question: string;
  options: string[];
  image_url?: string;
  image_caption?: string;
  option_images?: (string | null | undefined)[];
}

export interface TrueFalseContent {
  question?: string;
  statements: Array<{
    id: string;
    text: string;
  }>;
}

export interface FillBlankContent {
  template: string; // Văn bản có chỗ trống dạng [blank_1], [blank_2]...
  blanks: Array<{
    id: string;
    placeholder?: string;
    hint?: string;
  }>;
}

export interface DragDropContent {
  instruction?: string;
  pairs: Array<{
    id: string;
    left: string;  // Cột A (Ví dụ: Đồng bằng sông Hồng)
    right: string; // Cột B (Ví dụ: Phù sa sông Hồng bồi đắp)
  }>;
}

export interface EssayContent {
  prompt: string;
  word_limit?: number;
  sample_answer?: string;
  criteria?: string;
}

export type QuestionContentJson =
  | SingleChoiceContent
  | MultipleChoiceContent
  | TrueFalseContent
  | FillBlankContent
  | DragDropContent
  | EssayContent;

// Cấu trúc đáp án chuẩn:
// Single: { correct_index: number }
// Multiple: { correct_indices: number[] }
// True/False: { answers: Record<string, boolean> }
// Fill blank: { answers: Record<string, string[]> } (mảng các từ chấp nhận)
// Drag & drop: { pairs: Record<string, string> } (left_id -> right_id hoặc left -> right)
// Essay: { sample_text: string, keywords: string[] }

export interface CorrectAnswerJson {
  correct_index?: number;
  correct_indices?: number[];
  tf_answers?: Record<string, boolean>;
  blank_answers?: Record<string, string[]>;
  drag_pairs?: Record<string, string>;
  essay_sample?: string;
  essay_keywords?: string[];
}

export interface Question {
  id: string;
  created_by?: string;
  grade: number;
  type: QuestionType;
  category?: string;
  lesson_id?: string;
  title: string;
  content_json: any;
  correct_answer_json: any;
  explanation?: string | null;
  points: number;
  tags?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface Exam {
  id: string;
  created_by?: string;
  title: string;
  description?: string | null;
  category: ExamCategory;
  grade: number;
  duration_minutes: number;
  total_points: number;
  questions_list: Question[] | string[];
  is_published: boolean;
  created_at?: string;
  updated_at?: string;
  questions_count?: number;
}

export interface Assignment {
  id: string;
  exam_id: string;
  created_by?: string;
  title: string;
  target_type: TargetType;
  target_ids: string[]; // class_id hoặc student_id
  start_time: string;
  deadline?: string | null;
  allow_late: boolean;
  grade?: number;
  category?: string;
  duration_minutes?: number;
  questions?: Question[];
  questions_count?: number;
  total_points?: number;
  created_at?: string;
  exam?: Exam;
  classes?: ClassItem[];
  submissions_count?: number;
  total_students?: number;
  is_paused?: boolean;
  deleted_at?: string;
}

export interface StudentResult {
  id: string;
  assignment_id: string;
  student_id: string;
  exam_id?: string;
  score: number;
  max_score: number;
  answers_json: Record<string, any>;
  detailed_scores_json?: Record<string, { score: number; max_score: number; feedback?: string }>;
  is_late: boolean;
  time_spent_seconds: number;
  status: 'in_progress' | 'submitted' | 'graded';
  teacher_feedback_text?: string | null;
  teacher_feedback_voice_url?: string | null;
  graded_by?: string | null;
  graded_at?: string | null;
  submitted_at: string;
  student?: Profile;
  assignment?: Assignment;
  exam?: Exam;
}

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  xp_reward: number;
  category?: string;
}

export interface Badge {
  id: string;
  student_id: string;
  badge_id: string;
  badge_name: string;
  earned_at: string;
  definition?: BadgeDefinition;
}

export interface XpLog {
  id: string;
  student_id: string;
  amount: number;
  reason: string;
  granted_by?: string | null;
  created_at: string;
  granter?: Profile;
}

export interface HomepageBannerConfig {
  title: string;
  subtitle: string;
  image_url: string;
  announcement?: string;
}

export interface SystemSettings {
  key: string;
  value: any;
  updated_at?: string;
}
