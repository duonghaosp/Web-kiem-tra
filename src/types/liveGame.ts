import { Question } from './database';

export type LiveGameStatus =
  | 'lobby'
  | 'countdown'
  | 'question'
  | 'result'
  | 'leaderboard'
  | 'podium';

export interface LiveGameParticipant {
  id: string;
  room_id: string;
  student_id?: string | null;
  student_name: string;
  avatar_url?: string | null;
  score: number;
  streak: number;
  rank?: number;
  last_answer_correct?: boolean | null;
  last_points_earned?: number;
  joined_at?: string;
}

export interface LiveGameRoom {
  id: string;
  room_code: string; // 6 chữ số: VD "849203"
  title: string;
  exam_id?: string;
  teacher_id?: string;
  teacher_name?: string;
  status: LiveGameStatus;
  current_question_index: number;
  time_per_question: number; // Mặc định 20 giây
  questions: Question[];
  participants_count?: number;
  created_at: string;
}

export interface LiveGameAnswerSubmission {
  room_id: string;
  participant_id: string;
  question_id: string;
  chosen_option: number; // 0: Đỏ ▲, 1: Lam ◆, 2: Vàng ●, 3: Lục ■
  response_time_ms: number;
}
