#!/bin/bash

# docker-compose.yml
cat << 'DC' > docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: certiflow-db
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
      POSTGRES_DB: certif_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend-admin:
    build: 
      context: ./Backend-Admin
    container_name: certiflow-backend-admin
    ports:
      - "8080:8080"
    environment:
      - SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/certif_db
      - SPRING_DATASOURCE_USERNAME=postgres
      - SPRING_DATASOURCE_PASSWORD=password
    depends_on:
      - postgres

  backend-formateur:
    build: 
      context: ./Backend-Formateur
    container_name: certiflow-backend-formateur
    ports:
      - "8081:8081"
    environment:
      - SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/certif_db
      - SPRING_DATASOURCE_USERNAME=postgres
      - SPRING_DATASOURCE_PASSWORD=password
    depends_on:
      - postgres

  backend-apprenant:
    build: 
      context: ./Backend-Apprenant
    container_name: certiflow-backend-apprenant
    ports:
      - "8082:8082"
    environment:
      - SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/certif_db
      - SPRING_DATASOURCE_USERNAME=postgres
      - SPRING_DATASOURCE_PASSWORD=password
    depends_on:
      - postgres

  ai-detection-service:
    build: 
      context: ./AI-Detection-Service
    container_name: certiflow-ai-service
    ports:
      - "8000:8000"

  service-admin:
    build: 
      context: ./Service Admin
    container_name: certiflow-frontend-admin
    ports:
      - "5173:5173"
    environment:
      - CHOKIDAR_USEPOLLING=true

  service-formateur:
    build: 
      context: ./Service Formateur
    container_name: certiflow-frontend-formateur
    ports:
      - "5174:5174"
    environment:
      - CHOKIDAR_USEPOLLING=true

  service-apprenant:
    build: 
      context: ./Service Apprenant
    container_name: certiflow-frontend-apprenant
    ports:
      - "5175:5175"
    environment:
      - CHOKIDAR_USEPOLLING=true

volumes:
  postgres_data:
DC

# Create Spring Boot Dockerfiles
for backend in "Backend-Admin" "Backend-Formateur" "Backend-Apprenant"; do
cat << 'JB' > "$backend/Dockerfile"
FROM eclipse-temurin:17-jdk-alpine AS builder
WORKDIR /app
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
# Make wrapper executable and fix Windows CRLF issues just in case
RUN dos2unix mvnw || true
RUN chmod +x mvnw
# Download dependencies silently
RUN ./mvnw dependency:go-offline -B
COPY src ./src
RUN ./mvnw package -DskipTests

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]
JB
done

# Create React/Vite Dockerfiles
for frontend in "Service Admin" "Service Formateur" "Service Apprenant"; do
cat << 'RB' > "$frontend/Dockerfile"
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Start the dev server exposed to 0.0.0.0
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
RB
done

# Create Python AI Service Dockerfile
cat << 'PY' > "AI-Detection-Service/Dockerfile"
FROM python:3.10-slim
WORKDIR /app
# Install system deps required by opencv
RUN apt-get update && apt-get install -y libgl1 libglib2.0-0 && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["python", "main.py"]
PY

echo "Docker files generated successfully!"
