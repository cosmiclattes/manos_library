# Database Setup Guide

This guide explains how the automatic database initialization works and how to customize it.

## How It Works

The `docker-compose.yml` and `init-db.sh` script work together to automatically:

1. **Check if the database exists** - If not, create it
2. **Check if the application user exists** - If not, create it
3. **Grant proper privileges** - Ensure the user has all necessary permissions

The script is **idempotent**, meaning you can run it multiple times safely without errors.

## Default Configuration

By default, the setup creates:

- **Database**: `library_db`
- **User**: `library_user`
- **Password**: `library_password`
- **Superuser**: `postgres`
- **Superuser Password**: `postgres`

## Quick Start (Using Defaults)

```bash
# Start PostgreSQL (will auto-create database and user)
docker-compose up -d

# Check logs to see initialization
docker-compose logs postgres

# Run migrations
alembic upgrade head

# Start application
uvicorn app.main:app --reload
```

## Custom Database Configuration

### Option 1: Environment Variables

Create or edit your `.env` file:

```bash
# Application connection string
DATABASE_URL=postgresql://myuser:mypassword@localhost:5432/mydb

# Docker configuration (must match DATABASE_URL)
POSTGRES_DB=mydb
DB_USER=myuser
DB_PASSWORD=mypassword
POSTGRES_SUPERUSER=postgres
POSTGRES_SUPERUSER_PASSWORD=postgres
```

Then start:

```bash
docker-compose up -d
```

### Option 2: Export Variables (For Testing)

```bash
export POSTGRES_DB=my_custom_db
export DB_USER=my_custom_user
export DB_PASSWORD=my_secure_password

docker-compose up -d
```

### Option 3: Inline Variables

```bash
POSTGRES_DB=my_db DB_USER=my_user DB_PASSWORD=my_pass docker-compose up -d
```

## What Happens on First Start

When you run `docker-compose up -d` for the first time:

1. PostgreSQL container starts
2. The `init-db.sh` script runs automatically
3. Script checks if user exists:
   - ✓ Exists: Skip creation
   - ✗ Doesn't exist: Create user with password
4. Script checks if database exists:
   - ✓ Exists: Skip creation
   - ✗ Doesn't exist: Create database
5. Grants all necessary privileges
6. Container is ready to accept connections

## Verification

### Check if database and user were created:

```bash
# Access PostgreSQL
docker exec -it library_postgres psql -U postgres

# List databases
\l

# List users
\du

# Connect to your database
\c library_db

# List tables (after running migrations)
\dt

# Exit
\q
```

### Check initialization logs:

```bash
docker-compose logs postgres | grep "initialization"
```

You should see:
```
✓ User 'library_user' created successfully
✓ Database 'library_db' created successfully
✓ Database initialization completed successfully!
```

## Resetting the Database

If you need to start fresh:

```bash
# Stop and remove containers and volumes
docker-compose down -v

# Start fresh (will re-run initialization)
docker-compose up -d

# Run migrations again
alembic upgrade head
```

## Common Scenarios

### Scenario 1: Change Database Name Only

```bash
# .env file
POSTGRES_DB=my_library_system
DATABASE_URL=postgresql://library_user:library_password@localhost:5432/my_library_system
```

### Scenario 2: Change User and Password

```bash
# .env file
DB_USER=admin_user
DB_PASSWORD=SecurePass123!
POSTGRES_DB=library_db
DATABASE_URL=postgresql://admin_user:SecurePass123!@localhost:5432/library_db
```

### Scenario 3: Change Everything (Production-like)

```bash
# .env file
POSTGRES_DB=production_library
DB_USER=lib_admin
DB_PASSWORD=VerySecurePassword2024!
POSTGRES_SUPERUSER=postgres
POSTGRES_SUPERUSER_PASSWORD=SuperSecretAdminPass

DATABASE_URL=postgresql://lib_admin:VerySecurePassword2024!@localhost:5432/production_library
```

## Troubleshooting

### Issue: Database/User already exists from previous setup

**Solution**: The script handles this automatically. You'll see:
```
✓ User 'library_user' already exists
✓ Database 'library_db' already exists
```

### Issue: Permission denied errors

**Solution**: Make sure init-db.sh is executable:
```bash
chmod +x init-db.sh
```

### Issue: Environment variables not working

**Solution**: Ensure your `.env` file is in the same directory as `docker-compose.yml`:
```bash
ls -la .env
```

### Issue: Connection refused

**Solution**: Wait for PostgreSQL to fully start:
```bash
# Check if it's healthy
docker-compose ps

# Wait for healthy status
docker-compose logs -f postgres
```

### Issue: Wrong credentials

**Solution**: Check your `.env` file matches docker-compose environment:
```bash
# Database URL must match DB_USER, DB_PASSWORD, and POSTGRES_DB
grep DATABASE_URL .env
grep DB_USER .env
grep DB_PASSWORD .env
grep POSTGRES_DB .env
```

## Init Script Details

The `init-db.sh` script:

- **Location**: Mounted to `/docker-entrypoint-initdb.d/` in the container
- **Execution**: Runs only on first container start (when data volume is empty)
- **User**: Runs as the PostgreSQL superuser
- **Idempotency**: Safe to run multiple times
- **Error Handling**: Stops on any error (`set -e`)

## Security Recommendations

For **production**:

1. **Change all default passwords**:
   ```bash
   POSTGRES_SUPERUSER_PASSWORD=$(openssl rand -base64 32)
   DB_PASSWORD=$(openssl rand -base64 32)
   ```

2. **Use strong passwords** (min 16 characters)

3. **Never commit `.env` to version control**:
   - Already in `.gitignore`
   - Use `.env.example` as template

4. **Restrict database access**:
   - Use firewall rules
   - Don't expose port 5432 publicly
   - Use VPC/private networks

5. **Use SSL connections**:
   ```bash
   DATABASE_URL=postgresql://user:pass@localhost:5432/db?sslmode=require
   ```

## Advanced: Multiple Databases

If you need multiple databases, modify `init-db.sh`:

```bash
# Add after line 47
echo "Creating additional databases..."
psql -U "$POSTGRES_SUPERUSER" <<-EOSQL
    CREATE DATABASE test_library_db OWNER $APP_USER;
    CREATE DATABASE analytics_db OWNER $APP_USER;
EOSQL
```

## Advanced: Custom Init Scripts

Add more initialization scripts:

```bash
# Create custom SQL file
cat > init-custom.sql <<EOF
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
EOF

# Update docker-compose.yml volumes section:
volumes:
  - postgres_data:/var/lib/postgresql/data
  - ./init-db.sh:/docker-entrypoint-initdb.d/01-init-db.sh
  - ./init-custom.sql:/docker-entrypoint-initdb.d/02-init-custom.sql
```

Scripts run in alphabetical order (01, 02, etc.).

## Summary

The automatic database initialization:
- ✅ Checks before creating (no errors if exists)
- ✅ Configurable via environment variables
- ✅ Handles permissions automatically
- ✅ Production-ready with proper configuration
- ✅ Logs all operations for debugging

Just run `docker-compose up -d` and you're ready to go!
