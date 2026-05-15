#!/bin/bash

echo "🛑 Stopping all CertiFlow services..."

# 1. Kill Java processes
echo "  - Stopping Java Backends..."
pkill -f "backend-admin.jar"
pkill -f "backend-formateur.jar"
pkill -f "backend-apprenant.jar"

# 2. Kill AI Service (Uvicorn/Python)
echo "  - Stopping AI Detection Service..."
# Kill the uvicorn process running on port 8000
AI_PID=$(lsof -t -i:8000)
if [ ! -z "$AI_PID" ]; then
    kill -9 $AI_PID
fi
# Also kill by name just in case
pkill -f "main.py"

# 3. Stop Nginx
echo "  - Stopping Nginx (Proxy)..."
NGINX_BIN=$(which nginx)
if [ -z "$NGINX_BIN" ]; then
    if [ -f "/opt/homebrew/bin/nginx" ]; then NGINX_BIN="/opt/homebrew/bin/nginx";
    elif [ -f "/usr/local/bin/nginx" ]; then NGINX_BIN="/usr/local/bin/nginx";
    elif [ -f "/usr/sbin/nginx" ]; then NGINX_BIN="/usr/sbin/nginx";
    fi
fi
if [ -n "$NGINX_BIN" ]; then
    $NGINX_BIN -s stop 2>/dev/null
fi

echo "✅ All services stopped."
