package api

import (
	"os"
	"strings"

	"exam-helper/internal/config"
	"exam-helper/internal/handlers"
	"exam-helper/internal/services"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

// Server represents the HTTP server
type Server struct {
	router *gin.Engine
	config *config.Config
}

// NewServer creates a new server instance
func NewServer(cfg *config.Config) *Server {
	// Set gin mode based on debug setting
	if !cfg.Debug {
		gin.SetMode(gin.ReleaseMode)
	}

	router := gin.Default()

	// Configure CORS
	corsConfig := cors.DefaultConfig()
	corsConfig.AllowOrigins = cfg.AllowedOrigins
	corsConfig.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}
	corsConfig.AllowHeaders = []string{"Origin", "Content-Type", "Accept", "Authorization"}
	corsConfig.AllowCredentials = true
	router.Use(cors.New(corsConfig))

	// Create upload directory if it doesn't exist
	if err := os.MkdirAll(cfg.UploadDir, 0755); err != nil {
		panic("Failed to create upload directory: " + err.Error())
	}

	// Initialize services
	pdfService := services.NewPDFService()
	examService := services.NewExamService(pdfService)

	// Initialize handlers
	examHandler := handlers.NewExamHandler(examService, pdfService, cfg.UploadDir)

	// Setup routes
	setupRoutes(router, examHandler, cfg)

	return &Server{
		router: router,
		config: cfg,
	}
}

// Run starts the HTTP server
func (s *Server) Run(addr string) error {
	return s.router.Run(addr)
}

// setupRoutes configures all API routes
func setupRoutes(router *gin.Engine, examHandler *handlers.ExamHandler, cfg *config.Config) {
	// Health check endpoint
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "healthy",
			"service": "exam-helper",
		})
	})

	// API routes
	api := router.Group("/api/v1")
	{
		// Exam endpoints
		exams := api.Group("/exams")
		{
			exams.POST("", examHandler.CreateExam)
			exams.GET("/:id", examHandler.GetExam)
			exams.POST("/:id/start", examHandler.StartExam)
			exams.POST("/:id/submit", examHandler.SubmitAnswers)
			exams.GET("/:id/status", examHandler.GetExamStatus)
			exams.GET("/:id/answer-key-preview", examHandler.GetAnswerKeyPreview)
		}
	}

	// Serve uploaded files (for development)
	if cfg.Debug {
		router.Static("/uploads", cfg.UploadDir)
	}

	// Serve frontend static files in production (only if build directory exists)
	if _, err := os.Stat("./web/build"); err == nil {
		router.Static("/static", "./web/build/static")
		router.StaticFile("/favicon.ico", "./web/build/favicon.ico")

		// Catch-all route for SPA (only for non-API routes)
		router.NoRoute(func(c *gin.Context) {
			// Don't serve SPA for API routes
			if strings.HasPrefix(c.Request.URL.Path, "/api/") || strings.HasPrefix(c.Request.URL.Path, "/health") {
				c.JSON(404, gin.H{"error": "Not found"})
				return
			}
			c.File("./web/build/index.html")
		})
	} else {
		// Development mode - serve a simple message
		router.GET("/", func(c *gin.Context) {
			c.JSON(200, gin.H{
				"message": "Exam Helper API is running",
				"version": "1.0.0",
				"endpoints": gin.H{
					"health": "/health",
					"api":    "/api/v1/",
				},
			})
		})
	}
}
