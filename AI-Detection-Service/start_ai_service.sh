#!/bin/bash

# Navigate to the service directory
cd "$(dirname "$0")"

# Check if virtual environment exists
if [ ! -d "ai-detection-venv" ]; then
    echo "Error: ai-detection-venv not found. Please run the installation steps first."
    exit 1
fi

# Activate the virtual environment and start the service
echo "Starting CertiFlow AI Detection Service on port 8000..."
echo "Access it via Nginx at http://localhost:5176"

# Run with 2 workers for production stability
./ai-detection-venv/bin/python3 main.py
