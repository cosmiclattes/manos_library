from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from starlette.middleware.sessions import SessionMiddleware
from pathlib import Path
import os
import logging
from app.api import auth, books, inventory, borrow, stats
from app.database import engine
from app.models import models
from app.config import get_settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

logger.info("=" * 60)
logger.info("Starting Library Management System")
logger.info("=" * 60)

settings = get_settings()

# Log environment configuration (without sensitive data)
logger.info(f"Environment: {settings.ENVIRONMENT}")
logger.info(f"Debug mode: {settings.DEBUG}")
logger.info(f"App URL: {settings.APP_URL}")
logger.info(f"Frontend URL: {settings.FRONTEND_URL}")
logger.info(f"Database URL: {settings.DATABASE_URL[:30]}...")
logger.info(f"Google Client ID: {settings.GOOGLE_CLIENT_ID[:20]}...")
logger.info(f"Port from env: {os.getenv('PORT', '8000')}")

models.Base.metadata.create_all(bind=engine)
logger.info("Database tables created/verified")

app = FastAPI(
    title="Library Management System",
    description="A comprehensive library management system with Google SSO authentication",
    version="1.0.0"
)

# Session middleware for OAuth (must be added before other middleware)
app.add_middleware(
    SessionMiddleware,
    secret_key=settings.SECRET_KEY
)

# Configure CORS based on environment
allowed_origins = [settings.FRONTEND_URL]

# Add localhost variations in development
if settings.ENVIRONMENT == "development" or settings.DEBUG:
    allowed_origins.extend([
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
    ])

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(books.router)
app.include_router(inventory.router)
app.include_router(borrow.router)
app.include_router(stats.router)

logger.info("All routers registered")


@app.on_event("startup")
async def startup_event():
    """Log when the application starts"""
    logger.info("=" * 60)
    logger.info("✅ APPLICATION STARTUP COMPLETE")
    logger.info(f"✅ Server is ready to accept connections")
    logger.info(f"✅ Health check endpoint: /api/health")
    logger.info(f"✅ API docs endpoint: /docs")
    logger.info("=" * 60)


@app.on_event("shutdown")
async def shutdown_event():
    """Log when the application shuts down"""
    logger.info("Application shutting down")


@app.get("/api")
def read_root():
    """API root endpoint"""
    logger.info("API root endpoint called")
    return {
        "message": "Welcome to Library Management System API",
        "docs": "/docs",
        "version": "1.0.0"
    }


@app.get("/api/health")
def health_check():
    """Health check endpoint"""
    logger.info("Health check endpoint called - returning healthy status")
    return {"status": "healthy"}


@app.get("/debug/oauth-config")
def debug_oauth_config():
    """Debug endpoint to check OAuth configuration (development only)"""
    if settings.ENVIRONMENT == "production" and not settings.DEBUG:
        return {"error": "Debug endpoints disabled in production"}

    return {
        "app_url": settings.APP_URL,
        "redirect_uri": f"{settings.APP_URL}/auth/callback/google",
        "google_client_id": settings.GOOGLE_CLIENT_ID[:20] + "..." if len(settings.GOOGLE_CLIENT_ID) > 20 else settings.GOOGLE_CLIENT_ID,
        "environment": settings.ENVIRONMENT,
        "note": "Copy the redirect_uri above and add it EXACTLY to Google Cloud Console"
    }


# Serve static frontend files (Next.js build output)
# This should be added AFTER all API routes
static_dir = Path(__file__).parent.parent / "frontend" / "out"

logger.info(f"Checking for frontend build at: {static_dir}")
logger.info(f"Frontend directory exists: {static_dir.exists()}")

if static_dir.exists():
    logger.info("Frontend build found - mounting static files")
    # Mount static files (JS, CSS, images, etc.)
    app.mount("/_next", StaticFiles(directory=static_dir / "_next"), name="next-static")
    logger.info("Static files mounted at /_next")

    # Serve other static assets
    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        """Serve the Next.js frontend for all non-API routes"""

        # Try to serve the exact file if it exists
        file_path = static_dir / full_path
        if file_path.is_file():
            return FileResponse(file_path)

        # Try with .html extension
        html_path = static_dir / f"{full_path}.html"
        if html_path.is_file():
            return FileResponse(html_path)

        # For client-side routing, serve index.html
        index_path = static_dir / "index.html"
        if index_path.is_file():
            return FileResponse(index_path)

        # Fallback
        return {"error": "Frontend not built. Run: cd frontend && npm run build"}
else:
    logger.warning("Frontend build not found - serving API only")
    @app.get("/")
    async def frontend_not_built():
        """Fallback when frontend is not built"""
        return {
            "message": "API is running, but frontend is not built",
            "api_docs": "/docs",
            "build_frontend": "cd frontend && npm run build"
        }

logger.info("=" * 60)
logger.info("Application module loaded successfully")
logger.info("Waiting for server to start...")
logger.info("=" * 60)
