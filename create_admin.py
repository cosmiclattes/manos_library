"""
Script to create or update a user to have librarian/admin privileges.
Run this after your first login via Google OAuth to grant yourself admin access.
"""

from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app.models.models import User, UserType
import sys


def create_admin(email: str, user_type: UserType = UserType.LIBRARIAN):
    db: Session = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()

        if not user:
            print(f"❌ User with email '{email}' not found.")
            print("Please login via Google OAuth first, then run this script.")
            return False

        old_type = user.user_type
        user.user_type = user_type
        db.commit()

        print(f"✓ User '{user.name}' ({email}) updated successfully!")
        print(f"  Previous role: {old_type.value}")
        print(f"  New role: {user_type.value}")
        return True

    except Exception as e:
        print(f"❌ Error: {str(e)}")
        db.rollback()
        return False
    finally:
        db.close()


def list_users():
    db: Session = SessionLocal()
    try:
        users = db.query(User).all()

        if not users:
            print("No users found in database.")
            return

        print("\nCurrent users:")
        print("-" * 80)
        print(f"{'ID':<5} {'Name':<25} {'Email':<30} {'Role':<15}")
        print("-" * 80)

        for user in users:
            print(f"{user.id:<5} {user.name:<25} {user.email:<30} {user.user_type.value:<15}")

        print("-" * 80)

    except Exception as e:
        print(f"❌ Error: {str(e)}")
    finally:
        db.close()


if __name__ == "__main__":
    print("Library Management System - User Role Manager")
    print("=" * 80)
    print()

    if len(sys.argv) < 2:
        print("Usage:")
        print("  python create_admin.py <email> [role]")
        print()
        print("Examples:")
        print("  python create_admin.py user@example.com librarian")
        print("  python create_admin.py user@example.com super_admin")
        print()
        print("Available roles:")
        print("  - member (default)")
        print("  - librarian")
        print("  - super_admin")
        print()
        print("To list all users:")
        print("  python create_admin.py --list")
        print()
        sys.exit(1)

    if sys.argv[1] == "--list":
        list_users()
        sys.exit(0)

    email = sys.argv[1]

    user_type = UserType.LIBRARIAN
    if len(sys.argv) > 2:
        role_str = sys.argv[2].lower()
        if role_str == "librarian":
            user_type = UserType.LIBRARIAN
        elif role_str == "super_admin":
            user_type = UserType.SUPER_ADMIN
        elif role_str == "member":
            user_type = UserType.MEMBER
        else:
            print(f"❌ Invalid role: {sys.argv[2]}")
            print("Available roles: member, librarian, super_admin")
            sys.exit(1)

    success = create_admin(email, user_type)
    sys.exit(0 if success else 1)
