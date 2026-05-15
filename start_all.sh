#!/bin/bash

# Configuration
PROJECT_ROOT="$(pwd)"
LOG_DIR="$PROJECT_ROOT/logs"
mkdir -p "$LOG_DIR"

echo "🚀 Starting CertiFlow Full Stack..."

# 1. Start Nginx
echo "  [1/5] Reloading Nginx..."
/opt/homebrew/bin/nginx -s reload 2>/dev/null || /opt/homebrew/bin/nginx
if [ $? -eq 0 ]; then
    echo "    ✅ Nginx is running (Ports 5173-5176)"
else
    echo "    ❌ Failed to start Nginx. Please check your config."
fi

# 2. Start AI Detection Service
echo "  [2/5] Starting AI Detection Service..."
nohup ./AI-Detection-Service/start_ai_service.sh > "$LOG_DIR/ai-service.log" 2>&1 &
echo "    ✅ AI Service started in background (Log: logs/ai-service.log)"

# 3. Start Backend Admin
echo "  [3/5] Starting Backend Admin..."
nohup java -jar Backend-Admin/target/backend-admin.jar > "$LOG_DIR/backend-admin.log" 2>&1 &
echo "    ✅ Backend Admin started (Port 9091)"

# 4. Start Backend Formateur
echo "  [4/5] Starting Backend Formateur..."
nohup java -jar Backend-Formateur/target/backend-formateur.jar > "$LOG_DIR/backend-formateur.log" 2>&1 &
echo "    ✅ Backend Formateur started (Port 9092)"

# 5. Start Backend Apprenant
echo "  [5/5] Starting Backend Apprenant..."
nohup java -jar Backend-Apprenant/target/backend-apprenant.jar > "$LOG_DIR/backend-apprenant.log" 2>&1 &
echo "    ✅ Backend Apprenant started (Port 9093)"

echo ""
echo "✨ All services have been launched in the background."
echo "   Use './stop_all.sh' to shut everything down."
echo "   Check the 'logs/' directory if anything fails to load."
