@echo off
echo Starting FastAPI Backend Server...
cd /d "%~dp0backend"
python -m uvicorn app.main:app --reload --port 8000
pause
