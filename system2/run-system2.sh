#!/bin/bash

# Kill background processes on exit
cleanup() {
    echo "Shutting down..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit
}

trap cleanup SIGINT SIGTERM EXIT

echo "Starting System 2 Backend..."
cd backend
node server.js &
BACKEND_PID=$!

echo "Starting System 2 Frontend..."
cd ..
# Use a specific port to avoid "Port in use" issues if possible
npm run dev -- --port 3001 --host &
FRONTEND_PID=$!

wait
