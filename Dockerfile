# Multi-stage build for Library Management System
# Stage 1: Build Frontend (Next.js)
FROM node:18-alpine AS frontend-builder

WORKDIR /frontend

# Copy frontend package files
COPY frontend/package*.json ./

# Install dependencies
RUN npm ci

# Copy frontend source
COPY frontend/ ./

# Build Next.js static export
RUN npm run build

# Stage 2: Build Backend (Python/FastAPI)
FROM python:3.11-slim AS backend

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy Python requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY app/ ./app/
COPY alembic/ ./alembic/
COPY alembic.ini ./

# Copy built frontend from previous stage
COPY --from=frontend-builder /frontend/out ./frontend/out

# Expose port
EXPOSE 8000

# Run migrations and start server
CMD echo "========================================" && \
    echo "Starting Library Management System" && \
    echo "PORT: ${PORT:-8000}" && \
    echo "========================================" && \
    alembic upgrade head && \
    echo "Migrations complete" && \
    echo "Starting hypercorn server on 0.0.0.0:${PORT:-8000}" && \
    hypercorn app.main:app --bind 0.0.0.0:${PORT:-8000} --access-log -
