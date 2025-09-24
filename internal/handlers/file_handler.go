package handlers

import (
	"fmt"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// saveUploadedFile saves an uploaded file to the specified directory
func saveUploadedFile(c *gin.Context, file multipart.File, header *multipart.FileHeader, uploadDir, prefix string) (string, error) {
	// Create upload directory if it doesn't exist
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		return "", fmt.Errorf("failed to create upload directory: %w", err)
	}

	// Generate unique filename
	ext := filepath.Ext(header.Filename)
	filename := fmt.Sprintf("%s_%s_%d%s", prefix, uuid.New().String(), time.Now().Unix(), ext)
	filePath := filepath.Join(uploadDir, filename)

	// Create destination file
	dst, err := os.Create(filePath)
	if err != nil {
		return "", fmt.Errorf("failed to create destination file: %w", err)
	}
	defer dst.Close()

	// Copy file content
	if _, err := io.Copy(dst, file); err != nil {
		// Clean up on error
		os.Remove(filePath)
		return "", fmt.Errorf("failed to copy file content: %w", err)
	}

	return filePath, nil
}

// ServeFile serves uploaded files (for development/testing purposes)
func ServeFile(uploadDir string) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.File(filepath.Join(uploadDir, c.Param("filepath")))
	}
}
