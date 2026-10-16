@echo off
title Starting EDRP Milestone 4
echo ========================================================
echo Starting EDRP Platform (Backend + Frontend)
echo ========================================================

set "PATH=C:\Users\stefi\AppData\Local\Programs\Python\Python311;C:\Users\stefi\AppData\Local\Programs\Python\Python311\Scripts;C:\Users\stefi\AppData\Local\Programs\NodeJS;%PATH%"

echo Starting FastAPI Backend on http://127.0.0.1:8000 ...
start "EDRP Backend" cmd /k "cd /d "%~dp0Backend" && python -m uvicorn main:app --host 127.0.0.1 --port 8000"

timeout /t 2 /nobreak >nul

echo Starting Vite Frontend on http://127.0.0.1:5173 ...
start "EDRP Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev -- --host 127.0.0.1 --port 5173"

timeout /t 3 /nobreak >nul

echo Opening browser at http://localhost:5173 ...
start http://localhost:5173

echo.
echo Both servers are running!
echo Backend Docs: http://127.0.0.1:8000/docs
echo Frontend App: http://localhost:5173
echo.
pause
