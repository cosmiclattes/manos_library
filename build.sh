#!/bin/bash

# Build script for Library Management System
# This builds both frontend and backend for deployment

set -e  # Exit on error

echo "🏗️  Building Library Management System..."
echo ""

# Check if we're in the right directory
if [ ! -f "requirements.txt" ]; then
    echo "❌ Error: requirements.txt not found"
    echo "Please run this script from the project root directory"
    exit 1
fi

# Step 1: Build Frontend
echo "📦 Step 1/2: Building frontend (Next.js static export)..."
cd frontend

if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

echo "Building Next.js application..."
NODE_ENV=production npm run build

if [ ! -d "out" ]; then
    echo "❌ Error: Frontend build failed - out/ directory not created"
    exit 1
fi

echo "✅ Frontend build complete! Output in frontend/out/"
cd ..

# Step 2: Verify Backend Dependencies
echo ""
echo "📦 Step 2/2: Checking backend dependencies..."

if [ ! -d "venv" ]; then
    echo "⚠️  Warning: Virtual environment not found"
    echo "To set up backend, run:"
    echo "  python -m venv venv"
    echo "  source venv/bin/activate"
    echo "  pip install -r requirements.txt"
else
    echo "✅ Backend dependencies OK"
fi

echo ""
echo "✨ Build complete!"
echo ""
echo "To test the full-stack build locally:"
echo "  1. Set environment variables (copy .env.example to .env)"
echo "  2. Run: uvicorn app.main:app --host 0.0.0.0 --port 8000"
echo "  3. Visit: http://localhost:8000"
echo ""
echo "To deploy to Railway:"
echo "  1. Push to GitHub: git push origin main"
echo "  2. Railway will automatically build and deploy"
echo "  3. See RAILWAY_DEPLOYMENT.md for details"
echo ""
