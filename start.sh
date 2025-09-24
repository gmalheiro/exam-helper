#!/bin/bash

# Exam Helper - Startup Script
# This script starts both the Go backend and React frontend

echo "🚀 Starting Exam Helper Application..."

# Function to kill background processes on exit
cleanup() {
    echo "🛑 Stopping services..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

# Set trap to cleanup on exit
trap cleanup SIGINT SIGTERM

# Create uploads directory if it doesn't exist
mkdir -p uploads

# Start Go backend in background
echo "📡 Starting Go backend server..."
PORT=8082 DEBUG=true go run main.go &
BACKEND_PID=$!

# Wait a bit for backend to start
sleep 3

# Start React frontend in background
echo "🌐 Starting React frontend..."
cd web
npm start &
FRONTEND_PID=$!

# Wait for both processes
echo "✅ Both services started!"
echo "🔗 Backend: http://localhost:8082"
echo "🔗 Frontend: http://localhost:3000"
echo ""
echo "📝 To test the application:"
echo "   1. Open http://localhost:3000 in your browser"
echo "   2. Upload a PDF exam and a TXT answer key"
echo "   3. Choose timer or stopwatch mode"
echo "   4. Take the exam!"
echo ""
echo "Press Ctrl+C to stop both services"

# Wait for background processes
wait $BACKEND_PID $FRONTEND_PID
