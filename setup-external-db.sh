#!/bin/bash

echo "Library Management System - External Database Setup"
echo "===================================================="
echo ""
echo "This setup uses your existing PostgreSQL database."
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "Creating .env file from .env.example..."
    cp .env.example .env
    echo ""
    echo "⚠️  IMPORTANT: Edit .env file with your database credentials!"
    echo ""
    echo "Required configuration:"
    echo "  1. DATABASE_URL - Your PostgreSQL connection string"
    echo "  2. GOOGLE_CLIENT_ID - From Google Cloud Console"
    echo "  3. GOOGLE_CLIENT_SECRET - From Google Cloud Console"
    echo "  4. SECRET_KEY - Generate with: openssl rand -hex 32"
    echo ""
    read -p "Press Enter after you've updated the .env file..."
else
    echo "✓ .env file already exists"
    echo ""
fi

# Check if DATABASE_URL is configured
if grep -q "your_username:your_password" .env 2>/dev/null; then
    echo "❌ DATABASE_URL is not configured!"
    echo ""
    echo "Please edit .env and set your DATABASE_URL:"
    echo "Example: DATABASE_URL=postgresql://user:pass@host:5432/dbname"
    echo ""
    exit 1
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

# Test database connection
echo "Testing database connection..."
python -c "
import sys
from app.config import get_settings
from sqlalchemy import create_engine

try:
    settings = get_settings()
    engine = create_engine(settings.DATABASE_URL)
    with engine.connect() as conn:
        print('✓ Database connection successful!')
except Exception as e:
    print(f'❌ Database connection failed: {e}')
    print('')
    print('Please check your DATABASE_URL in .env file')
    sys.exit(1)
"

if [ $? -ne 0 ]; then
    exit 1
fi

echo ""

# Run migrations
echo "Running database migrations..."
alembic revision --autogenerate -m "Initial migration"
alembic upgrade head
echo "✓ Migrations completed"
echo ""

echo "===================================================="
echo "Setup Complete!"
echo "===================================================="
echo ""
echo "Your application is ready to run!"
echo ""
echo "Next steps:"
echo "  1. Make sure your .env has Google OAuth credentials"
echo "  2. Run: source venv/bin/activate"
echo "  3. Run: uvicorn app.main:app --reload"
echo "  4. Visit: http://localhost:8000/docs"
echo ""
echo "To create an admin user:"
echo "  python create_admin.py your-email@example.com librarian"
echo ""
