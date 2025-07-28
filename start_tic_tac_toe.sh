#!/bin/bash

# Tic-Tac-Toe Startup Script
echo "Starting Tic-Tac-Toe application..."

# Function to cleanup background processes on exit
cleanup() {
    echo "Shutting down servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is required but not installed."
    exit 1
fi

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is required but not installed."
    exit 1
fi

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo "Error: npm is required but not installed."
    exit 1
fi

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate
pip install -r requirements.txt

# Start backend server
echo "Starting backend server on port 5000..."
python app.py &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 2

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd ../frontend
npm install

# Start frontend development server
echo "Starting frontend development server on port 5173..."
npm run dev &
FRONTEND_PID=$!

# Wait a moment for frontend to start
sleep 3

echo ""
echo "🎮 Tic-Tac-Toe application is now running!"
echo ""
echo "Frontend: http://localhost:5173"
echo "Backend:  http://127.0.0.1:5000"
echo ""
echo "Press Ctrl+C to stop both servers."
echo ""

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID