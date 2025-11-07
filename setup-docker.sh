#!/bin/bash

echo "Library Management System - Setup Script"
echo "=========================================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "Creating .env file from .env.example..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your actual configuration values!"
    echo ""
else
    echo "✓ .env file already exists"
    echo ""
fi

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
    echo "✓ Virtual environment created"
    echo ""
else
    echo "✓ Virtual environment already exists"
    echo ""
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt
echo "✓ Dependencies installed"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "⚠️  Docker is not running. Please start Docker and run this script again."
    exit 1
fi

# Start PostgreSQL
echo "Starting PostgreSQL with Docker Compose..."
docker-compose up -d
echo "✓ PostgreSQL started"
echo ""

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
sleep 5
echo "✓ PostgreSQL is ready"
echo ""

# Run migrations
echo "Running database migrations..."
alembic revision --autogenerate -m "Initial migration"
alembic upgrade head
echo "✓ Migrations completed"
echo ""

echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Edit .env file with your Google OAuth credentials"
echo "2. Run: source venv/bin/activate"
echo "3. Run: uvicorn app.main:app --reload"
echo "4. Visit: http://localhost:8000/docs"
echo ""
