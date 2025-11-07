from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from app.api import auth, books, inventory, borrow
from app.database import engine
from app.models import models
from app.config import get_settings

settings = get_settings()

models.Base.metadata.create_all(bind=engine)

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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(books.router)
app.include_router(inventory.router)
app.include_router(borrow.router)


@app.get("/")
def read_root():
    return {
        "message": "Welcome to Library Management System API",
        "docs": "/docs",
        "version": "1.0.0"
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}


@app.get("/debug/oauth-config")
def debug_oauth_config():
    """Debug endpoint to check OAuth configuration"""
    return {
        "app_url": settings.APP_URL,
        "redirect_uri": f"{settings.APP_URL}/auth/callback/google",
        "google_client_id": settings.GOOGLE_CLIENT_ID[:20] + "..." if len(settings.GOOGLE_CLIENT_ID) > 20 else settings.GOOGLE_CLIENT_ID,
        "note": "Copy the redirect_uri above and add it EXACTLY to Google Cloud Console"
    }
