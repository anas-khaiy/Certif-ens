@echo off
echo 🛑 Stopping all CertiFlow services (Windows)...

:: 1. Stop Java Backends
echo  - Stopping Java Backends...
taskkill /F /FI "IMAGENAME eq java.exe" /FI "WINDOWTITLE eq CertiFlow*" 2>nul
:: Alternatively, kill all java processes if they were started with start /b
taskkill /F /IM java.exe /T 2>nul

:: 2. Stop AI Service
echo  - Stopping AI Detection Service...
taskkill /F /FI "IMAGENAME eq python.exe" /FI "MODULES eq main.py" 2>nul
:: Hard kill python if needed (caution: kills all python)
taskkill /F /IM python.exe /T 2>nul

:: 3. Stop Nginx
echo  - Stopping Nginx...
taskkill /F /IM nginx.exe /T 2>nul

echo ✅ All services stopped.
pause
