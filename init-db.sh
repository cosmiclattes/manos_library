#!/bin/bash
set -e

# This script will run when the PostgreSQL container starts for the first time
# It checks if the database and user exist, and creates them if they don't

echo "Starting database initialization..."

# Configuration from environment variables with defaults
DB_NAME="${POSTGRES_DB:-library_db}"
APP_USER="${DB_USER:-library_user}"
APP_PASSWORD="${DB_PASSWORD:-library_password}"
POSTGRES_SUPERUSER="${POSTGRES_USER:-postgres}"

# Function to check if database exists
database_exists() {
    psql -U "$POSTGRES_SUPERUSER" -lqt | cut -d \| -f 1 | grep -qw "$1"
}

# Function to check if user exists
user_exists() {
    psql -U "$POSTGRES_SUPERUSER" -tAc "SELECT 1 FROM pg_roles WHERE rolname='$1'" | grep -q 1
}

echo "Checking if user '$APP_USER' exists..."
if user_exists "$APP_USER"; then
    echo "✓ User '$APP_USER' already exists"
else
    echo "Creating user '$APP_USER'..."
    psql -U "$POSTGRES_SUPERUSER" <<-EOSQL
        CREATE USER $APP_USER WITH PASSWORD '$APP_PASSWORD';
        ALTER USER $APP_USER CREATEDB;
EOSQL
    echo "✓ User '$APP_USER' created successfully"
fi

echo "Checking if database '$DB_NAME' exists..."
if database_exists "$DB_NAME"; then
    echo "✓ Database '$DB_NAME' already exists"
else
    echo "Creating database '$DB_NAME'..."
    psql -U "$POSTGRES_SUPERUSER" <<-EOSQL
        CREATE DATABASE $DB_NAME OWNER $APP_USER;
        GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $APP_USER;
EOSQL
    echo "✓ Database '$DB_NAME' created successfully"
fi

# Grant additional privileges
echo "Granting privileges..."
psql -U "$POSTGRES_SUPERUSER" -d "$DB_NAME" <<-EOSQL
    GRANT ALL ON SCHEMA public TO $APP_USER;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $APP_USER;
    ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $APP_USER;
EOSQL

echo "✓ Database initialization completed successfully!"
