package services

import (
	"errors"
	"fmt"
	"strconv"
	"strings"
	"sync"
	"time"

	"exam-helper/internal/models"

	"github.com/google/uuid"
)

// ExamService handles exam-related business logic
type ExamService struct {
	exams      map[string]*models.Exam
	mutex      sync.RWMutex
	pdfService *PDFService
}

// NewExamService creates a new exam service instance
func NewExamService(pdfService *PDFService) *ExamService {
	return &ExamService{
		exams:      make(map[string]*models.Exam),
		pdfService: pdfService,
	}
}

// CreateExam creates a new exam session
func (s *ExamService) CreateExam(req models.CreateExamRequest, examPDFPath, answerKeyPath string) (*models.Exam, error) {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	// Validate timer mode requirements
	if req.Mode == models.ModeTimer && req.Duration == nil {
		return nil, errors.New("duration is required for timer mode")
	}

	// Validate stopwatch mode requirements
	if req.Mode == models.ModeStopwatch && req.Duration != nil {
		return nil, errors.New("duration should not be provided for stopwatch mode")
	}

	exam := &models.Exam{
		ID:            uuid.New().String(),
		Mode:          req.Mode,
		Status:        models.StatusPending,
		ExamPDFPath:   examPDFPath,
		AnswerKeyPath: answerKeyPath,
		Duration:      req.Duration,
		Answers:       make(map[string]string),
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}

	s.exams[exam.ID] = exam

	return exam, nil
}

// StartExam starts an exam session
func (s *ExamService) StartExam(examID string) (*models.Exam, error) {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	exam, exists := s.exams[examID]
	if !exists {
		return nil, errors.New("exam not found")
	}

	if exam.Status != models.StatusPending {
		return nil, fmt.Errorf("exam is already %s", exam.Status)
	}

	now := time.Now()
	exam.StartTime = &now
	exam.Status = models.StatusActive
	exam.UpdatedAt = now

	// For timer mode, schedule automatic completion
	if exam.Mode == models.ModeTimer && exam.Duration != nil {
		go s.scheduleAutoComplete(examID, *exam.Duration)
	}

	return exam, nil
}

// SubmitAnswers submits answers for an exam
func (s *ExamService) SubmitAnswers(examID string, answers map[string]string) (*models.ExamResult, error) {
	s.mutex.Lock()
	defer s.mutex.Unlock()

	exam, exists := s.exams[examID]
	if !exists {
		return nil, errors.New("exam not found")
	}

	if exam.Status != models.StatusActive {
		return nil, fmt.Errorf("exam is %s and cannot accept answers", exam.Status)
	}

	// Update exam with answers
	exam.Answers = answers
	now := time.Now()
	exam.EndTime = &now
	exam.Status = models.StatusCompleted
	exam.UpdatedAt = now

	// Grade the exam
	result, err := s.gradeExam(exam)
	if err != nil {
		return nil, fmt.Errorf("failed to grade exam: %w", err)
	}

	return result, nil
}

// GetExam retrieves an exam by ID
func (s *ExamService) GetExam(examID string) (*models.Exam, error) {
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	exam, exists := s.exams[examID]
	if !exists {
		return nil, errors.New("exam not found")
	}

	return exam, nil
}

// GetExamStatus returns the current status and time information for an exam
func (s *ExamService) GetExamStatus(examID string) (map[string]interface{}, error) {
	s.mutex.RLock()
	defer s.mutex.RUnlock()

	exam, exists := s.exams[examID]
	if !exists {
		return nil, errors.New("exam not found")
	}

	status := map[string]interface{}{
		"id":     exam.ID,
		"mode":   exam.Mode,
		"status": exam.Status,
	}

	if exam.StartTime != nil {
		status["start_time"] = exam.StartTime
		status["elapsed_time"] = time.Since(*exam.StartTime)

		if exam.Mode == models.ModeTimer && exam.Duration != nil {
			remaining := *exam.Duration - time.Since(*exam.StartTime)
			if remaining < 0 {
				remaining = 0
			}
			status["remaining_time"] = remaining
		}
	}

	if exam.EndTime != nil {
		status["end_time"] = exam.EndTime
		if exam.StartTime != nil {
			status["total_time"] = exam.EndTime.Sub(*exam.StartTime)
		}
	}

	return status, nil
}

// scheduleAutoComplete automatically completes an exam after the specified duration
func (s *ExamService) scheduleAutoComplete(examID string, duration time.Duration) {
	time.Sleep(duration)

	s.mutex.Lock()
	defer s.mutex.Unlock()

	exam, exists := s.exams[examID]
	if !exists || exam.Status != models.StatusActive {
		return
	}

	// Auto-complete the exam
	now := time.Now()
	exam.EndTime = &now
	exam.Status = models.StatusExpired
	exam.UpdatedAt = now
}

// gradeExam compares user answers with the answer key and returns results
func (s *ExamService) gradeExam(exam *models.Exam) (*models.ExamResult, error) {
	// Parse answer key from PDF
	answerKey, err := s.pdfService.ParseAnswerKey(exam.AnswerKeyPath)
	if err != nil {
		return nil, fmt.Errorf("failed to parse answer key: %w", err)
	}

	var timeTaken time.Duration
	if exam.StartTime != nil && exam.EndTime != nil {
		timeTaken = exam.EndTime.Sub(*exam.StartTime)
	}

	result := &models.ExamResult{
		ExamID:         exam.ID,
		TotalQuestions: len(answerKey),
		TimeTaken:      timeTaken,
		Answers:        exam.Answers,
		CorrectKey:     answerKey,
		Details:        make([]models.QuestionResult, 0),
	}

	// Compare answers
	for questionNum, correctAnswer := range answerKey {
		userAnswer := exam.Answers[questionNum]
		isCorrect := strings.EqualFold(strings.TrimSpace(userAnswer), strings.TrimSpace(correctAnswer))

		if isCorrect {
			result.CorrectAnswers++
		} else {
			result.WrongAnswers++
		}

		result.Details = append(result.Details, models.QuestionResult{
			QuestionNumber: questionNum,
			UserAnswer:     userAnswer,
			CorrectAnswer:  correctAnswer,
			IsCorrect:      isCorrect,
		})
	}

	// Calculate score percentage
	if result.TotalQuestions > 0 {
		result.Score = float64(result.CorrectAnswers) / float64(result.TotalQuestions) * 100
	}

	return result, nil
}

// parseQuestionNumber extracts question number from various formats
func parseQuestionNumber(text string) string {
	// Remove common prefixes and clean up
	text = strings.TrimSpace(text)
	text = strings.TrimPrefix(text, "Q")
	text = strings.TrimPrefix(text, "q")
	text = strings.TrimPrefix(text, "Question")
	text = strings.TrimPrefix(text, "question")
	text = strings.TrimSpace(text)

	// Extract just the number part
	if num, err := strconv.Atoi(text); err == nil {
		return strconv.Itoa(num)
	}

	return text
}
