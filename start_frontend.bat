@echo off
title Frontend Server (React + Vite)
echo Starting React Vite Frontend Server on http://localhost:5173 ...
cd /d "%~dp0frontend"
call npm.cmd run dev
pause
