package handlers

import (
	"fmt"
	"net/http"
	"path/filepath"
	"strconv"
	"time"

	"exam-helper/internal/models"
	"exam-helper/internal/services"

	"github.com/gin-gonic/gin"
)

// ExamHandler handles exam-related HTTP requests
type ExamHandler struct {
	examService *services.ExamService
	pdfService  *services.PDFService
	uploadDir   string
}

// NewExamHandler creates a new exam handler instance
func NewExamHandler(examService *services.ExamService, pdfService *services.PDFService, uploadDir string) *ExamHandler {
	return &ExamHandler{
		examService: examService,
		pdfService:  pdfService,
		uploadDir:   uploadDir,
	}
}

// CreateExam handles the creation of a new exam
func (h *ExamHandler) CreateExam(c *gin.Context) {
	// Parse multipart form
	err := c.Request.ParseMultipartForm(10 << 20) // 10 MB max
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to parse form data"})
		return
	}

	// Get form values
	mode := c.PostForm("mode")
	durationStr := c.PostForm("duration")

	// Validate mode
	if mode != string(models.ModeTimer) && mode != string(models.ModeStopwatch) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid mode. Must be 'timer' or 'stopwatch'"})
		return
	}

	// Parse duration for timer mode
	var duration *time.Duration
	if mode == string(models.ModeTimer) {
		if durationStr == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Duration is required for timer mode"})
			return
		}

		minutes, err := strconv.Atoi(durationStr)
		if err != nil || minutes <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Duration must be a positive number of minutes"})
			return
		}

		d := time.Duration(minutes) * time.Minute
		duration = &d
	}

	// Handle file uploads
	examFile, examHeader, err := c.Request.FormFile("exam_pdf")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Exam PDF file is required"})
		return
	}
	defer examFile.Close()

	answerKeyFile, answerKeyHeader, err := c.Request.FormFile("answer_key")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Answer key file is required"})
		return
	}
	defer answerKeyFile.Close()

	// Validate file types
	if !isValidFileType(examHeader.Filename, []string{".pdf"}) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Exam file must be a PDF"})
		return
	}

	if !isValidFileType(answerKeyHeader.Filename, []string{".txt", ".pdf"}) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Answer key file must be a TXT or PDF file"})
		return
	}

	// Save files
	examPath, err := saveUploadedFile(c, examFile, examHeader, h.uploadDir, "exam")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to save exam file: %v", err)})
		return
	}

	answerKeyPath, err := saveUploadedFile(c, answerKeyFile, answerKeyHeader, h.uploadDir, "answer_key")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to save answer key file: %v", err)})
		return
	}

	// Validate answer key format
	if err := h.pdfService.ValidateAnswerKeyFormat(answerKeyPath); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Invalid answer key format: %v", err)})
		return
	}

	// Create exam
	req := models.CreateExamRequest{
		Mode:     models.ExamMode(mode),
		Duration: duration,
	}

	exam, err := h.examService.CreateExam(req, examPath, answerKeyPath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to create exam: %v", err)})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"exam":    exam,
		"message": "Exam created successfully",
	})
}

// StartExam handles starting an exam session
func (h *ExamHandler) StartExam(c *gin.Context) {
	examID := c.Param("id")
	if examID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Exam ID is required"})
		return
	}

	exam, err := h.examService.StartExam(examID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"exam":    exam,
		"message": "Exam started successfully",
	})
}

// SubmitAnswers handles answer submission
func (h *ExamHandler) SubmitAnswers(c *gin.Context) {
	examID := c.Param("id")
	if examID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Exam ID is required"})
		return
	}

	var req models.SubmitAnswersRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Invalid request body: %v", err)})
		return
	}

	result, err := h.examService.SubmitAnswers(examID, req.Answers)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"result":  result,
		"message": "Answers submitted successfully",
	})
}

// GetExam retrieves exam information
func (h *ExamHandler) GetExam(c *gin.Context) {
	examID := c.Param("id")
	if examID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Exam ID is required"})
		return
	}

	exam, err := h.examService.GetExam(examID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"exam": exam})
}

// GetExamStatus retrieves exam status and timing information
func (h *ExamHandler) GetExamStatus(c *gin.Context) {
	examID := c.Param("id")
	if examID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Exam ID is required"})
		return
	}

	status, err := h.examService.GetExamStatus(examID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, status)
}

// GetAnswerKeyPreview returns a preview of the answer key for validation
func (h *ExamHandler) GetAnswerKeyPreview(c *gin.Context) {
	examID := c.Param("id")
	if examID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Exam ID is required"})
		return
	}

	exam, err := h.examService.GetExam(examID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	preview, err := h.pdfService.GetAnswerKeyPreview(exam.AnswerKeyPath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to get answer key preview: %v", err)})
		return
	}

	c.JSON(http.StatusOK, gin.H{"preview": preview})
}

// isValidFileType checks if the file has a valid extension
func isValidFileType(filename string, allowedExtensions []string) bool {
	ext := filepath.Ext(filename)
	for _, allowedExt := range allowedExtensions {
		if ext == allowedExt {
			return true
		}
	}

	return false
}
