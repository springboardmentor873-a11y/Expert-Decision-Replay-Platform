@echo off
echo =================================================================
echo   STARTING EXPERT DECISION REPLAY PLATFORM (BACKEND + FRONTEND)
echo =================================================================

start "Backend Server (FastAPI :8000)" cmd /k "cd /d %~dp0backend && python -m uvicorn app.main:app --reload --port 8000"
timeout /t 2 /nobreak >nul

start "Frontend Server (React Vite :5173)" cmd /k "cd /d %~dp0frontend && call npm.cmd run dev"
timeout /t 3 /nobreak >nul

echo Opening browser at http://localhost:5173 ...
start http://localhost:5173

echo =================================================================
echo   Both servers are starting in separate terminal windows!
echo   - Backend API Docs: http://localhost:8000/docs
echo   - Frontend React App: http://localhost:5173
echo =================================================================
pause
