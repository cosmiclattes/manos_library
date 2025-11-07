#!/usr/bin/env python3
"""
Verification script to check if the database setup is correct.
Run this after starting docker-compose to verify everything is working.
"""

import sys
import os
from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError
from app.config import get_settings

def test_database_connection():
    """Test if we can connect to the database."""
    print("=" * 60)
    print("Database Setup Verification")
    print("=" * 60)
    print()

    try:
        settings = get_settings()
        print(f"✓ Configuration loaded")
        print(f"  DATABASE_URL: {settings.DATABASE_URL.split('@')[1] if '@' in settings.DATABASE_URL else 'configured'}")
        print()
    except Exception as e:
        print(f"✗ Failed to load configuration: {e}")
        print("  Make sure .env file exists and is properly configured")
        return False

    try:
        print("Testing database connection...")
        engine = create_engine(settings.DATABASE_URL)

        with engine.connect() as conn:
            # Test basic connection
            result = conn.execute(text("SELECT version();"))
            version = result.fetchone()[0]
            print(f"✓ Connected to PostgreSQL")
            print(f"  Version: {version.split(',')[0]}")
            print()

            # Check current database
            result = conn.execute(text("SELECT current_database();"))
            db_name = result.fetchone()[0]
            print(f"✓ Connected to database: {db_name}")

            # Check current user
            result = conn.execute(text("SELECT current_user;"))
            user_name = result.fetchone()[0]
            print(f"✓ Connected as user: {user_name}")
            print()

            # List all tables
            result = conn.execute(text("""
                SELECT tablename
                FROM pg_catalog.pg_tables
                WHERE schemaname = 'public'
                ORDER BY tablename;
            """))
            tables = [row[0] for row in result.fetchall()]

            if tables:
                print(f"✓ Found {len(tables)} table(s):")
                for table in tables:
                    print(f"  - {table}")
            else:
                print("⚠ No tables found (run 'alembic upgrade head' to create tables)")
            print()

            # Check if alembic version table exists
            result = conn.execute(text("""
                SELECT EXISTS (
                    SELECT FROM pg_tables
                    WHERE schemaname = 'public'
                    AND tablename = 'alembic_version'
                );
            """))
            has_alembic = result.fetchone()[0]

            if has_alembic:
                result = conn.execute(text("SELECT version_num FROM alembic_version;"))
                version = result.fetchone()
                if version:
                    print(f"✓ Database migrations applied: {version[0]}")
                else:
                    print("⚠ Alembic table exists but no migrations applied")
            else:
                print("⚠ No migrations applied yet (run 'alembic upgrade head')")
            print()

        print("=" * 60)
        print("✓ Database verification complete - All checks passed!")
        print("=" * 60)
        return True

    except OperationalError as e:
        print(f"✗ Failed to connect to database")
        print(f"  Error: {e}")
        print()
        print("Troubleshooting:")
        print("  1. Make sure PostgreSQL is running: docker-compose ps")
        print("  2. Check if container is healthy: docker-compose logs postgres")
        print("  3. Verify DATABASE_URL in .env file")
        print("  4. Try: docker-compose down && docker-compose up -d")
        return False
    except Exception as e:
        print(f"✗ Unexpected error: {e}")
        return False


def test_application_imports():
    """Test if all application modules can be imported."""
    print("\nTesting application imports...")
    try:
        from app.models import models
        from app.schemas import schemas
        from app.api import auth, books, inventory, borrow
        from app.dependencies import auth as auth_dep
        print("✓ All application modules imported successfully")
        return True
    except ImportError as e:
        print(f"✗ Failed to import application modules: {e}")
        print("  Make sure all dependencies are installed: pip install -r requirements.txt")
        return False


def main():
    """Run all verification tests."""
    # Change to script directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)

    # Check if .env exists
    if not os.path.exists('.env'):
        print("✗ .env file not found!")
        print("  Run: cp .env.example .env")
        print("  Then edit .env with your configuration")
        sys.exit(1)

    # Run tests
    imports_ok = test_application_imports()
    print()
    db_ok = test_database_connection()

    if imports_ok and db_ok:
        print("\n✓ All verifications passed! You're ready to run the application.")
        print("\nNext steps:")
        print("  1. Run migrations: alembic upgrade head")
        print("  2. Start the app: uvicorn app.main:app --reload")
        print("  3. Visit: http://localhost:8000/docs")
        sys.exit(0)
    else:
        print("\n✗ Some verifications failed. Please fix the issues above.")
        sys.exit(1)


if __name__ == "__main__":
    main()
