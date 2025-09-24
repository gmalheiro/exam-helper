package models

import (
	"time"
)

// ExamMode represents the mode of the exam (timer or stopwatch)
type ExamMode string

const (
	ModeTimer     ExamMode = "timer"
	ModeStopwatch ExamMode = "stopwatch"
)

// ExamStatus represents the current status of an exam session
type ExamStatus string

const (
	StatusPending   ExamStatus = "pending"
	StatusActive    ExamStatus = "active"
	StatusCompleted ExamStatus = "completed"
	StatusExpired   ExamStatus = "expired"
)

// Exam represents an exam session
type Exam struct {
	ID           string            `json:"id"`
	Mode         ExamMode          `json:"mode"`
	Status       ExamStatus        `json:"status"`
	ExamPDFPath  string            `json:"exam_pdf_path"`
	AnswerKeyPath string           `json:"answer_key_path"`
	Duration     *time.Duration    `json:"duration,omitempty"` // Only for timer mode
	StartTime    *time.Time        `json:"start_time,omitempty"`
	EndTime      *time.Time        `json:"end_time,omitempty"`
	Answers      map[string]string `json:"answers"`
	CreatedAt    time.Time         `json:"created_at"`
	UpdatedAt    time.Time         `json:"updated_at"`
}

// CreateExamRequest represents the request to create a new exam
type CreateExamRequest struct {
	Mode     ExamMode       `json:"mode" binding:"required,oneof=timer stopwatch"`
	Duration *time.Duration `json:"duration,omitempty"` // Required for timer mode
}

// SubmitAnswersRequest represents the request to submit answers
type SubmitAnswersRequest struct {
	Answers map[string]string `json:"answers" binding:"required"`
}

// ExamResult represents the result of an exam
type ExamResult struct {
	ExamID        string            `json:"exam_id"`
	TotalQuestions int              `json:"total_questions"`
	CorrectAnswers int              `json:"correct_answers"`
	WrongAnswers   int              `json:"wrong_answers"`
	Score          float64          `json:"score"`
	TimeTaken      time.Duration    `json:"time_taken"`
	Answers        map[string]string `json:"answers"`
	CorrectKey     map[string]string `json:"correct_key"`
	Details        []QuestionResult  `json:"details"`
}

// QuestionResult represents the result for a single question
type QuestionResult struct {
	QuestionNumber string `json:"question_number"`
	UserAnswer     string `json:"user_answer"`
	CorrectAnswer  string `json:"correct_answer"`
	IsCorrect      bool   `json:"is_correct"`
}
