# Library Management System - Setup Guide

## Two Setup Options

### Option 1: External PostgreSQL Database (Default - Recommended)

Use your existing PostgreSQL database (local, cloud, or any provider).

**Quick Start:**
```bash
cd /Users/jeph/PycharmProjects/manos_library
cp .env.example .env
# Edit .env with your DATABASE_URL
./setup.sh
source venv/bin/activate
uvicorn app.main:app --reload
```

**See:** [SETUP_EXTERNAL_DATABASE.md](SETUP_EXTERNAL_DATABASE.md) for detailed instructions.

---

### Option 2: Docker PostgreSQL (Alternative)

Use a Docker container with PostgreSQL (for development/testing).

**Quick Start:**
```bash
cd /Users/jeph/PycharmProjects/manos_library
./setup-docker.sh
source venv/bin/activate
uvicorn app.main:app --reload
```

**See:** [DATABASE_SETUP.md](DATABASE_SETUP.md) for Docker-specific configuration.

---

## Which Option Should I Choose?

### Use External Database (Option 1) if:
- ✅ You already have PostgreSQL installed or accessible
- ✅ You're using a cloud database (AWS RDS, Heroku, etc.)
- ✅ You want production-like setup
- ✅ You don't want to install Docker

### Use Docker Database (Option 2) if:
- ✅ You want isolated development environment
- ✅ You don't have PostgreSQL installed
- ✅ You want quick setup/teardown
- ✅ You're testing/prototyping

---

## Complete Setup Steps (External Database)

### 1. Prepare Database Connection URL

Format: `postgresql://username:password@host:port/database`

Examples:
```bash
# Local PostgreSQL
postgresql://postgres:mypass@localhost:5432/library_db

# AWS RDS
postgresql://admin:pass@mydb.us-east-1.rds.amazonaws.com:5432/library_db

# Heroku
postgresql://user:pass@ec2-xx-xxx.compute-1.amazonaws.com:5432/dbname
```

### 2. Configure Environment

```bash
# Copy template
cp .env.example .env

# Generate secret key
openssl rand -hex 32

# Edit .env
nano .env
```

**Add to `.env`:**
```bash
DATABASE_URL=postgresql://your_user:your_password@your_host:5432/your_database
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
SECRET_KEY=paste-generated-secret-key-here
```

### 3. Get Google OAuth Credentials

1. Go to: https://console.cloud.google.com/
2. Create project → APIs & Services → Credentials
3. Create OAuth 2.0 Client ID
4. Add redirect URI: `http://localhost:8000/auth/callback/google`
5. Copy Client ID and Secret to `.env`

### 4. Run Setup

```bash
./setup.sh
```

### 5. Start Application

```bash
source venv/bin/activate
uvicorn app.main:app --reload
```

### 6. Access Application

- API Docs: http://localhost:8000/docs
- Login: http://localhost:8000/auth/login/google

### 7. Create Admin User

```bash
# After logging in with Google
python create_admin.py your-email@gmail.com librarian
```

---

## File Reference

| File | Purpose |
|------|---------|
| `setup.sh` | Main setup script (external database) |
| `setup-docker.sh` | Setup script for Docker PostgreSQL |
| `setup-external-db.sh` | Detailed external database setup |
| `verify_setup.py` | Verify database connection |
| `create_admin.py` | Manage user roles |
| `docker-compose.postgres.yml` | Docker PostgreSQL configuration |
| `.env.example` | Environment variables template |

---

## Quick Commands

```bash
# Verify setup
python verify_setup.py

# List users
python create_admin.py --list

# Make user librarian
python create_admin.py email@example.com librarian

# Run migrations
alembic upgrade head

# Create new migration
alembic revision --autogenerate -m "description"

# Start app
uvicorn app.main:app --reload

# Start app on different port
uvicorn app.main:app --reload --port 8080
```

---

## Troubleshooting

### Can't connect to database
```bash
# Test connection
python verify_setup.py

# Check DATABASE_URL in .env
cat .env | grep DATABASE_URL

# Test manually
psql "postgresql://user:pass@host:port/db"
```

### Google OAuth not working
- Verify redirect URI: `http://localhost:8000/auth/callback/google`
- Check Client ID and Secret in `.env`
- Ensure Google+ API is enabled

### Port already in use
```bash
# Use different port
uvicorn app.main:app --reload --port 8080
```

---

## Next Steps After Setup

1. **Login** with Google OAuth
2. **Make yourself librarian** using `create_admin.py`
3. **Create books** via API
4. **Add inventory** for books
5. **Test borrowing/returning** functionality

---

## Documentation

- **Full README**: [README.md](README.md)
- **API Reference**: [API_REFERENCE.md](API_REFERENCE.md)
- **External Database Setup**: [SETUP_EXTERNAL_DATABASE.md](SETUP_EXTERNAL_DATABASE.md)
- **Docker Database Setup**: [DATABASE_SETUP.md](DATABASE_SETUP.md)
- **Quick Start**: [QUICK_START.md](QUICK_START.md)

---

## Support

Having issues? Check:
1. [SETUP_EXTERNAL_DATABASE.md](SETUP_EXTERNAL_DATABASE.md) - Detailed troubleshooting
2. Run `python verify_setup.py` - Diagnose issues
3. Check `.env` file configuration
4. Ensure database is accessible
