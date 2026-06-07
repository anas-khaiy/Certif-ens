FROM python:3.10-slim
WORKDIR /app
# Set environment variables
ENV PYTHONUNBUFFERED=1
# Install system deps required by opencv and pyzbar
RUN apt-get update && apt-get install -y libgl1 libglib2.0-0 tesseract-ocr libzbar0 && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["python", "main.py"]
