package services

import (
	"bufio"
	"errors"
	"fmt"
	"os"
	"regexp"
	"strconv"
	"strings"
)

// PDFService handles PDF processing operations
type PDFService struct{}

// NewPDFService creates a new PDF service instance
func NewPDFService() *PDFService {
	return &PDFService{}
}

// ParseAnswerKey extracts answer key from a PDF file
// For now, this is a simplified implementation that expects a text file format
// In a production environment, you would use a PDF parsing library
func (s *PDFService) ParseAnswerKey(filePath string) (map[string]string, error) {
	if filePath == "" {
		return nil, errors.New("file path is required")
	}

	// Check if file exists
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		return nil, fmt.Errorf("file does not exist: %s", filePath)
	}

	file, err := os.Open(filePath)
	if err != nil {
		return nil, fmt.Errorf("failed to open file: %w", err)
	}
	defer file.Close()

	answerKey := make(map[string]string)
	scanner := bufio.NewScanner(file)

	// Regular expressions to match different answer key formats
	patterns := []*regexp.Regexp{
		regexp.MustCompile(`(?i)^\s*(\d+)\s*[.)\-:]\s*([A-Ea-e])\s*$`),                    // "1. A" or "1) A" or "1: A"
		regexp.MustCompile(`(?i)^\s*[Qq](?:uestion)?\s*(\d+)\s*[.)\-:]\s*([A-Ea-e])\s*$`), // "Q1. A" or "Question 1: A"
		regexp.MustCompile(`(?i)^\s*(\d+)\s+([A-Ea-e])\s*$`),                              // "1 A"
	}

	lineNumber := 0
	for scanner.Scan() {
		lineNumber++
		line := strings.TrimSpace(scanner.Text())

		// Skip empty lines and comments
		if line == "" || strings.HasPrefix(line, "#") || strings.HasPrefix(line, "//") {
			continue
		}

		// Try to match against different patterns
		var questionNum, answer string
		matched := false

		for _, pattern := range patterns {
			matches := pattern.FindStringSubmatch(line)
			if len(matches) >= 3 {
				questionNum = matches[1]
				answer = strings.ToUpper(matches[2])
				matched = true
				break
			}
		}

		if matched {
			answerKey[questionNum] = answer
		} else {
			// Log warning but continue processing
			fmt.Printf("Warning: Could not parse line %d: '%s'\n", lineNumber, line)
		}
	}

	if err := scanner.Err(); err != nil {
		return nil, fmt.Errorf("error reading file: %w", err)
	}

	if len(answerKey) == 0 {
		return nil, errors.New("no valid answers found in the answer key file")
	}

	return answerKey, nil
}

// ValidateAnswerKeyFormat checks if the answer key has a valid format
func (s *PDFService) ValidateAnswerKeyFormat(filePath string) error {
	answerKey, err := s.ParseAnswerKey(filePath)
	if err != nil {
		return err
	}

	if len(answerKey) == 0 {
		return errors.New("answer key is empty")
	}

	// Validate that all answers are valid multiple choice options (A-E)
	validAnswers := map[string]bool{"A": true, "B": true, "C": true, "D": true, "E": true}

	for questionNum, answer := range answerKey {
		if !validAnswers[answer] {
			return fmt.Errorf("invalid answer '%s' for question %s. Expected A, B, C, D, or E", answer, questionNum)
		}

		// Validate question number is numeric
		if _, err := strconv.Atoi(questionNum); err != nil {
			return fmt.Errorf("invalid question number '%s'. Expected numeric value", questionNum)
		}
	}

	return nil
}

// GetAnswerKeyPreview returns a preview of the parsed answer key for validation
func (s *PDFService) GetAnswerKeyPreview(filePath string) (map[string]string, error) {
	answerKey, err := s.ParseAnswerKey(filePath)
	if err != nil {
		return nil, err
	}

	// Return first 10 questions for preview
	preview := make(map[string]string)
	count := 0
	maxPreview := 10

	// Sort question numbers and show first few
	for i := 1; i <= maxPreview && count < len(answerKey); i++ {
		questionNum := strconv.Itoa(i)
		if answer, exists := answerKey[questionNum]; exists {
			preview[questionNum] = answer
			count++
		}
	}

	return preview, nil
}
