package main

import (
	"log"
	"os"

	"exam-helper/internal/api"
	"exam-helper/internal/config"
)

const version = "1.0.0"

func main() {
	cfg := config.Load()

	server := api.NewServer(cfg)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Starting exam-helper server v%s on port %s", version, port)
	if err := server.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
