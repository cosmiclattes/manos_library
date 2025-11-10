# Library Management System

A modern library management web application with Google SSO authentication, AI-powered book search, and an intelligent chatbot for book recommendations.

## Features

- Google OAuth authentication
- Book management with AI-powered semantic search
- AI chatbot for personalized book recommendations
- Borrowing and return system
- Role-based access (Members, Librarians, Super Admins)
- Inventory tracking
- Beautiful Next.js frontend with shadcn/ui

## Tech Stack

**Backend:** FastAPI, PostgreSQL, SQLAlchemy, Google Vertex AI
**Frontend:** Next.js 14, TypeScript, Tailwind CSS, shadcn/ui

## Quick Start

### Prerequisites
- Python 3.9+
- Node.js 18+
- PostgreSQL
- Google Cloud account (for OAuth and Vertex AI)

### Local Development

1. **Clone and setup backend:**
```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

2. **Setup PostgreSQL:**
```bash
docker-compose up -d
```

3. **Configure environment (.env):**
```env
DATABASE_URL=postgresql://library_user:library_password@localhost:5432/library_db
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
SECRET_KEY=your-secret-key
GOOGLE_CLOUD_PROJECT=your-gcp-project-id
GOOGLE_APPLICATION_CREDENTIALS_BASE64=your-base64-encoded-credentials
```

4. **Run migrations:**
```bash
alembic upgrade head
```

5. **Start backend:**
```bash
uvicorn app.main:app --reload
```

6. **Start frontend (new terminal):**
```bash
cd frontend
npm install
npm run dev
```

Visit http://localhost:3000

## Deployment

### Railway (Recommended)

1. Push to GitHub
2. Create new project in Railway
3. Add PostgreSQL database
4. Set environment variables
5. Deploy from main branch

**Important:** Use a PostgreSQL database with pgvector support (Supabase or Neon recommended) for semantic search features.

## API Documentation

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## License

MIT
