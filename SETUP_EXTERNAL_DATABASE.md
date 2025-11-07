# Setup with External PostgreSQL Database

This guide explains how to set up the Library Management System using your existing PostgreSQL database (not Docker).

## Prerequisites

- **Python 3.9+** installed
- **Existing PostgreSQL database** (accessible via URL)
- **Database credentials** (username, password, host, port, database name)
- **Google Cloud Console account** (for OAuth)

## Quick Start

### Step 1: Get Your Database Connection URL

You need a PostgreSQL connection URL in this format:

```
postgresql://USERNAME:PASSWORD@HOST:PORT/DATABASE_NAME
```

**Examples:**

```bash
# Local PostgreSQL
postgresql://postgres:mypassword@localhost:5432/library_db

# Remote PostgreSQL (e.g., AWS RDS)
postgresql://admin:SecurePass123@mydb.abc123.us-east-1.rds.amazonaws.com:5432/library_system

# Cloud PostgreSQL (e.g., Heroku, DigitalOcean)
postgresql://user:pass@db.example.com:5432/production_db

# With special characters in password (URL encode them)
postgresql://user:p%40ssw0rd@localhost:5432/mydb  # @ becomes %40
```

### Step 2: Prepare Your Database

Your database should:
1. **Already exist** (create it if needed)
2. **Be accessible** from your machine
3. **Have a user** with full privileges

#### If you need to create the database:

```sql
-- Connect to PostgreSQL
psql -U postgres

-- Create database
CREATE DATABASE library_db;

-- Create user (if needed)
CREATE USER library_user WITH PASSWORD 'your_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE library_db TO library_user;

-- Connect to the database
\c library_db

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO library_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO library_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO library_user;

-- Exit
\q
```

### Step 3: Configure Environment Variables

```bash
# Navigate to project directory
cd /Users/jeph/PycharmProjects/manos_library

# Create .env file
cp .env.example .env

# Generate SECRET_KEY
openssl rand -hex 32

# Edit .env file
nano .env
```

**Update your `.env` file:**

```bash
# Your PostgreSQL connection URL
DATABASE_URL=postgresql://your_user:your_password@your_host:5432/your_database

# Google OAuth credentials (from Google Cloud Console)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Generated secret key (from openssl command above)
SECRET_KEY=your-generated-secret-key-here

# App configuration (can keep defaults)
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
APP_URL=http://localhost:8000
```

**Save and exit** (Ctrl+X, then Y, then Enter)

### Step 4: Run Setup Script

```bash
./setup.sh
```

This will:
- ✅ Create Python virtual environment
- ✅ Install all dependencies
- ✅ Test database connection
- ✅ Run database migrations
- ✅ Prepare the application

### Step 5: Start the Application

```bash
# Activate virtual environment (if not already activated)
source venv/bin/activate

# Start the application
uvicorn app.main:app --reload
```

### Step 6: Test & Create Admin User

```bash
# Visit API docs
open http://localhost:8000/docs

# Login with Google
open http://localhost:8000/auth/login/google

# In a new terminal, make yourself a librarian
python create_admin.py your-email@gmail.com librarian
```

## Common Database Providers

### AWS RDS PostgreSQL

```bash
# Format
DATABASE_URL=postgresql://username:password@instance.region.rds.amazonaws.com:5432/dbname

# Example
DATABASE_URL=postgresql://admin:MySecurePass@mydb.abc123.us-east-1.rds.amazonaws.com:5432/library_db
```

**Additional steps:**
- Ensure security group allows inbound on port 5432 from your IP
- Make database publicly accessible (or use VPN/bastion)

### Heroku Postgres

```bash
# Heroku provides the URL automatically
# Copy from: heroku config:get DATABASE_URL

DATABASE_URL=postgres://user:pass@ec2-xx-xxx-xxx-xxx.compute-1.amazonaws.com:5432/dbname
```

### DigitalOcean Managed Database

```bash
# Format
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require

# Example
DATABASE_URL=postgresql://doadmin:password@db-postgresql-nyc3-12345.ondigitalocean.com:25060/defaultdb?sslmode=require
```

### Azure Database for PostgreSQL

```bash
# Format
DATABASE_URL=postgresql://username@servername:password@servername.postgres.database.azure.com:5432/dbname?sslmode=require

# Example
DATABASE_URL=postgresql://myadmin@myserver:Pass123@myserver.postgres.database.azure.com:5432/library_db?sslmode=require
```

### Google Cloud SQL

```bash
# Public IP connection
DATABASE_URL=postgresql://user:password@35.xxx.xxx.xxx:5432/dbname

# Unix socket connection (if running on GCP)
DATABASE_URL=postgresql://user:password@/dbname?host=/cloudsql/project:region:instance
```

### Local PostgreSQL (Installed on your machine)

```bash
# Default local connection
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/library_db

# With custom user
DATABASE_URL=postgresql://myuser:mypass@localhost:5432/library_db

# Unix socket connection (Mac/Linux)
DATABASE_URL=postgresql:///library_db  # Uses current user
```

## Troubleshooting

### Connection Refused

```bash
# Check if database is accessible
psql "postgresql://user:pass@host:port/dbname"

# If it works, your URL is correct
# If not, check:
# 1. Host/port correct?
# 2. Firewall allows connection?
# 3. Database is running?
```

### Authentication Failed

```bash
# Verify credentials
echo $DATABASE_URL  # Check what's in .env

# Test connection manually
psql -U your_user -h your_host -d your_database -p 5432

# If manual connection works but app doesn't:
# - Check for special characters in password (URL encode them)
# - Ensure .env file is in correct directory
```

### SSL Required

Some providers require SSL. Add to your DATABASE_URL:

```bash
# Add SSL mode
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require

# Or disable SSL verification (not recommended for production)
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=disable
```

### Permission Denied

```bash
# Connect to database
psql "your-database-url"

# Grant necessary permissions
GRANT ALL PRIVILEGES ON DATABASE your_database TO your_user;
GRANT ALL ON SCHEMA public TO your_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO your_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO your_user;
```

### Special Characters in Password

If your password contains special characters, URL encode them:

```bash
# Character -> URL Encoded
@ -> %40
# -> %23
$ -> %24
% -> %25
^ -> %5E
& -> %26
* -> %2A
( -> %28
) -> %29

# Example password: p@ss$123
# URL encoded: p%40ss%24123
# DATABASE_URL=postgresql://user:p%40ss%24123@host:5432/db
```

### Test Connection Script

```bash
# Create test script
cat > test_db.py << 'EOF'
from app.config import get_settings
from sqlalchemy import create_engine, text

settings = get_settings()
print(f"Testing connection to: {settings.DATABASE_URL.split('@')[1]}")

try:
    engine = create_engine(settings.DATABASE_URL)
    with engine.connect() as conn:
        result = conn.execute(text("SELECT version();"))
        version = result.fetchone()[0]
        print(f"✓ Connected successfully!")
        print(f"PostgreSQL version: {version}")
except Exception as e:
    print(f"✗ Connection failed: {e}")
EOF

# Run test
python test_db.py
```

## Verify Setup

```bash
# Use the verification script
python verify_setup.py

# Should show:
# ✓ Connected to PostgreSQL
# ✓ Connected to database: your_database
# ✓ Connected as user: your_user
# ✓ Database migrations applied
```

## Migration Management

```bash
# Create new migration after model changes
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback last migration
alembic downgrade -1

# View migration history
alembic history

# Show current version
alembic current
```

## Daily Workflow

```bash
# 1. Navigate to project
cd /Users/jeph/PycharmProjects/manos_library

# 2. Activate virtual environment
source venv/bin/activate

# 3. Start application
uvicorn app.main:app --reload

# 4. Access API docs
open http://localhost:8000/docs
```

## Want to Switch Back to Docker?

If you want to use Docker PostgreSQL instead:

```bash
# Use the Docker setup script
./setup-docker.sh

# Or manually start Docker PostgreSQL
docker-compose -f docker-compose.postgres.yml up -d

# Update .env to use Docker database
DATABASE_URL=postgresql://library_user:library_password@localhost:5432/library_db
```

## Production Considerations

1. **Use SSL connections** (add `?sslmode=require`)
2. **Connection pooling** (SQLAlchemy handles this)
3. **Backup your database** regularly
4. **Use read replicas** for high traffic
5. **Monitor connections** to avoid exhaustion
6. **Use environment-specific configs** (dev, staging, prod)

## Security Best Practices

1. **Never commit `.env`** to version control (already in `.gitignore`)
2. **Use strong passwords** (minimum 16 characters)
3. **Rotate credentials** regularly
4. **Use least privilege** (don't use superuser for app)
5. **Enable SSL/TLS** for remote connections
6. **Whitelist IPs** in database firewall
7. **Use secrets management** (AWS Secrets Manager, Vault, etc.)

## Summary

**Using external database setup:**
- ✅ No Docker required for database
- ✅ Connect to any PostgreSQL instance
- ✅ Works with cloud providers (AWS, Azure, GCP, etc.)
- ✅ Use existing database infrastructure
- ✅ Simplified deployment

**Setup is just:**
```bash
cp .env.example .env
# Edit .env with your DATABASE_URL
./setup.sh
uvicorn app.main:app --reload
```

That's it! 🚀
