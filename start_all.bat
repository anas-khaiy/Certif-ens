@echo off
setlocal enabledelayedexpansion

:: --- CONFIGURATION ---
:: UPDATE THIS TO YOUR WINDOWS NGINX FOLDER
set NGINX_DIR=C:\nginx
set PROJECT_ROOT=%~dp0
set LOG_DIR=%PROJECT_ROOT%logs

if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"

echo 🚀 Starting CertiFlow Full Stack (Windows)...

:: 1. Start Nginx
echo [1/5] Starting Nginx...
cd /d "%NGINX_DIR%"
start "" nginx.exe
if %ERRORLEVEL% EQU 0 (
    echo    ✅ Nginx started
) else (
    echo    ❌ Failed to start Nginx. Check path: %NGINX_DIR%
)
cd /d "%PROJECT_ROOT%"

:: 2. Start AI Detection Service
echo [2/5] Starting AI Detection Service...
:: AI Service usually has a different venv structure on Windows
start /b "" "AI-Detection-Service\ai-detection-venv\Scripts\python.exe" "AI-Detection-Service\main.py" > "logs\ai-service.log" 2>&1
echo    ✅ AI Service started (Log: logs\ai-service.log)

:: 3. Start Backend Admin
echo [3/5] Starting Backend Admin...
start /b "" java -jar "Backend-Admin\target\backend-admin.jar" > "logs\backend-admin.log" 2>&1
echo    ✅ Backend Admin started (Port 9091)

:: 4. Start Backend Formateur
echo [4/5] Starting Backend Formateur...
start /b "" java -jar "Backend-Formateur\target\backend-formateur.jar" > "logs\backend-formateur.log" 2>&1
echo    ✅ Backend Formateur started (Port 9092)

:: 5. Start Backend Apprenant
echo [5/5] Starting Backend Apprenant...
start /b "" java -jar "Backend-Apprenant\target\backend-apprenant.jar" > "logs\backend-apprenant.log" 2>&1
echo    ✅ Backend Apprenant started (Port 9093)

echo.
echo ✨ All services launched in background.
echo    Use 'stop_all.bat' to shut everything down.
pause
