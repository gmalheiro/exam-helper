export type ExamMode = 'timer' | 'stopwatch';

export type StatusExam = 'pending' | 'active' | 'completed' | 'expired';

export interface Exam {
  id: string;
  mode: ExamMode;
  status: StatusExam;
  exam_pdf_path: string;
  answer_key_path: string;
  duration?: number; // in milliseconds
  start_time?: string;
  end_time?: string;
  answers: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export interface CreateExamRequest {
  mode: ExamMode;
  duration?: number; // in minutes
}

export interface SubmitAnswersRequest {
  answers: Record<string, string>;
}

export interface ExamResult {
  exam_id: string;
  total_questions: number;
  correct_answers: number;
  wrong_answers: number;
  score: number;
  time_taken: number; // in milliseconds
  answers: Record<string, string>;
  correct_key: Record<string, string>;
  details: QuestionResult[];
}

export interface QuestionResult {
  question_number: string;
  user_answer: string;
  correct_answer: string;
  is_correct: boolean;
}

export interface ExamStatus {
  id: string;
  mode: ExamMode;
  status: StatusExam;
  start_time?: string;
  end_time?: string;
  elapsed_time?: number; // in milliseconds
  remaining_time?: number; // in milliseconds for timer mode
  total_time?: number; // in milliseconds
}
