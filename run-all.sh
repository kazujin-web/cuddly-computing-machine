#!/bin/bash

# Kill background processes on exit
cleanup() {
    echo "Stopping all systems..."
    kill $S1_BACKEND_PID $S1_FRONTEND_PID $S2_BACKEND_PID $S2_FRONTEND_PID 2>/dev/null
    exit
}

trap cleanup SIGINT SIGTERM EXIT

echo "--- 🚀 STARTING STO. NIÑO PORTAL MULTI-SYSTEM ---"

# --- SYSTEM 1 (Main Portal) ---
echo "[S1] Starting Backend (Port 3001)..."
cd system/backend
node server.js > ../backend.log 2>&1 &
S1_BACKEND_PID=$!
cd ../..

echo "[S1] Starting Frontend (Port 3000)..."
cd system
npm run dev -- --port 3000 --host > frontend.log 2>&1 &
S1_FRONTEND_PID=$!
cd ..

# --- SYSTEM 2 (Excel Evolution) ---
echo "[S2] Starting Backend (Port 5001)..."
cd system2/backend
node server.js > backend.log 2>&1 &
S2_BACKEND_PID=$!
cd ../..

echo "[S2] Starting Frontend (Port 3002)..."
cd system2
npm run dev -- --port 3002 --host > frontend.log 2>&1 &
S2_FRONTEND_PID=$!
cd ..

echo "--- ✅ ALL SYSTEMS RUNNING ---"
echo "System 1 (Main): http://localhost:3000"
echo "System 2 (Excel): http://localhost:3002"
echo "Press Ctrl+C to stop everything."

wait
