package config

import (
	"os"
	"strconv"
)

// Config holds all application configuration
type Config struct {
	Port           string
	UploadDir      string
	MaxFileSize    int64
	AllowedOrigins []string
	Debug          bool
}

// Load creates a new configuration instance with default values and environment overrides
func Load() *Config {
	cfg := &Config{
		Port:           getEnv("PORT", "8080"),
		UploadDir:      getEnv("UPLOAD_DIR", "./uploads"),
		MaxFileSize:    getEnvInt64("MAX_FILE_SIZE", 10*1024*1024), // 10MB default
		AllowedOrigins: []string{getEnv("FRONTEND_URL", "http://localhost:3000")},
		Debug:          getEnvBool("DEBUG", true),
	}

	return cfg
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}

	return defaultValue
}

func getEnvInt64(key string, defaultValue int64) int64 {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.ParseInt(value, 10, 64); err == nil {
			return intValue
		}
	}

	return defaultValue
}

func getEnvBool(key string, defaultValue bool) bool {
	if value := os.Getenv(key); value != "" {
		if boolValue, err := strconv.ParseBool(value); err == nil {
			return boolValue
		}
	}

	return defaultValue
}
