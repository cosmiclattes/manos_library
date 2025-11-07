# Quick Start Guide

## 1. One-Command Setup (Automated)

```bash
./setup.sh
```

This will:
- Create `.env` file from template
- Set up virtual environment
- Install dependencies
- Start PostgreSQL with automatic database/user creation
- Run database migrations

## 2. Manual Setup (Step by Step)

```bash
# 1. Environment setup
cp .env.example .env
# Edit .env with your Google OAuth credentials and SECRET_KEY

# 2. Python environment
python -m venv venv
source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Start PostgreSQL (auto-creates db and user)
docker-compose up -d

# 5. Verify setup
python verify_setup.py

# 6. Run migrations
alembic revision --autogenerate -m "Initial migration"
alembic upgrade head

# 7. Start application
uvicorn app.main:app --reload
```

## 3. Essential Configuration

### Minimum Required in `.env`:

```bash
DATABASE_URL=postgresql://library_user:library_password@localhost:5432/library_db
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
SECRET_KEY=$(openssl rand -hex 32)
```

### Get Google OAuth Credentials:
1. Visit: https://console.cloud.google.com/
2. Create project → APIs & Services → Credentials
3. Create OAuth 2.0 Client ID
4. Add redirect URI: `http://localhost:8000/auth/callback/google`

## 4. First Login & Make Yourself Admin

```bash
# 1. Login via browser
open http://localhost:8000/auth/login/google

# 2. Complete Google OAuth flow

# 3. Grant yourself librarian access
python create_admin.py your-email@example.com librarian
```

## 5. Common Commands

```bash
# Start database
docker-compose up -d

# Stop database
docker-compose down

# View logs
docker-compose logs -f postgres

# Reset database (WARNING: deletes all data)
docker-compose down -v

# Run migrations
alembic upgrade head

# Create new migration
alembic revision --autogenerate -m "description"

# Rollback migration
alembic downgrade -1

# Start application
uvicorn app.main:app --reload

# Start with custom port
uvicorn app.main:app --reload --port 8080

# Verify setup
python verify_setup.py

# List all users
python create_admin.py --list

# Make user a librarian
python create_admin.py user@email.com librarian
```

## 6. Access the Application

- **API Docs**: http://localhost:8000/docs
- **Alternative Docs**: http://localhost:8000/redoc
- **Google Login**: http://localhost:8000/auth/login/google
- **Health Check**: http://localhost:8000/health

## 7. Testing the API

### Using Swagger UI (Easiest):
1. Go to http://localhost:8000/docs
2. Click "Authorize" button
3. Login via Google
4. Copy the access token
5. Paste in authorization field
6. Test endpoints directly in the UI

### Using curl:

```bash
# Login and get token (use browser for Google OAuth)
# After login, use token:

TOKEN="your-access-token-here"

# List books
curl -H "Authorization: Bearer $TOKEN" http://localhost:8000/books/

# Create a book (requires librarian role)
curl -X POST http://localhost:8000/books/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "1984",
    "author": "George Orwell",
    "genre": "Fiction",
    "year_of_publishing": 1949
  }'

# Borrow a book
curl -X POST http://localhost:8000/borrow/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"book_id": 1}'

# Return a book
curl -X POST http://localhost:8000/borrow/return/1 \
  -H "Authorization: Bearer $TOKEN"
```

## 8. Troubleshooting

### Database connection failed
```bash
# Check if PostgreSQL is running
docker-compose ps

# Check logs
docker-compose logs postgres

# Restart
docker-compose restart postgres
```

### Module not found
```bash
# Make sure virtual environment is activated
source venv/bin/activate

# Reinstall dependencies
pip install -r requirements.txt
```

### Permission denied
```bash
# Make scripts executable
chmod +x setup.sh init-db.sh verify_setup.py
```

### Wrong credentials
```bash
# Check environment variables
cat .env | grep DATABASE_URL

# Match them with docker-compose
cat docker-compose.yml | grep -A 5 environment
```

### Port already in use
```bash
# Check what's using port 5432 (PostgreSQL)
lsof -i :5432

# Check what's using port 8000 (FastAPI)
lsof -i :8000

# Use different port for FastAPI
uvicorn app.main:app --reload --port 8080
```

## 9. Development Workflow

```bash
# 1. Start database
docker-compose up -d

# 2. Activate virtual environment
source venv/bin/activate

# 3. Make code changes

# 4. If models changed, create migration
alembic revision --autogenerate -m "description of changes"
alembic upgrade head

# 5. Start/restart app
uvicorn app.main:app --reload

# 6. Test in browser at http://localhost:8000/docs
```

## 10. Custom Database Setup

To use different database credentials:

```bash
# .env file
POSTGRES_DB=my_custom_db
DB_USER=my_user
DB_PASSWORD=my_secure_pass
DATABASE_URL=postgresql://my_user:my_secure_pass@localhost:5432/my_custom_db

# Restart PostgreSQL
docker-compose down -v
docker-compose up -d
```

See [DATABASE_SETUP.md](DATABASE_SETUP.md) for detailed information.

## 11. Production Deployment

**Important changes for production:**

1. **Change all default passwords**
2. **Use environment-specific `.env` file**
3. **Enable HTTPS** (update `APP_URL` in `.env`)
4. **Update CORS settings** in `app/main.py`
5. **Use production-grade PostgreSQL** (not Docker for production data)
6. **Add rate limiting**
7. **Set up monitoring and logging**
8. **Use gunicorn with uvicorn workers**:
   ```bash
   pip install gunicorn
   gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker
   ```

## Need Help?

- **API Reference**: [API_REFERENCE.md](API_REFERENCE.md)
- **Database Setup**: [DATABASE_SETUP.md](DATABASE_SETUP.md)
- **Full Documentation**: [README.md](README.md)

---

**TL;DR - Fastest Setup:**

```bash
cp .env.example .env
# Add Google OAuth credentials to .env
./setup.sh
uvicorn app.main:app --reload
# Visit: http://localhost:8000/docs
```
