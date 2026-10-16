@echo off
setlocal
cd /d "%~dp0"
title EDRP - Push to GitHub

echo ========================================================
echo   EDRP Milestone 4 - GitHub Repository Push
echo ========================================================
echo.

set "PYTHON=C:\Users\stefi\AppData\Local\Programs\Python\Python311\python.exe"
if not exist "%PYTHON%" (
    where python >nul 2>nul
    if %errorlevel% equ 0 (
        set "PYTHON=python"
    ) else (
        echo [ERROR] Python not found. Please ensure Python is installed.
        pause
        exit /b 1
    )
)

"%PYTHON%" push_to_github.py %*

echo.
pause
