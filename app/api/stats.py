from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.models import Book, User, Inventory
from app.dependencies.auth import get_current_user, require_librarian

router = APIRouter(prefix="/stats", tags=["statistics"])


@router.get("/librarian")
async def get_librarian_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_librarian)
):
    """
    Get statistics for the librarian dashboard.
    Requires librarian or super_admin role.
    """
    # Total books
    total_books = db.query(func.count(Book.id)).scalar()

    # Total users/members
    total_users = db.query(func.count(User.id)).scalar()

    # Total books borrowed (sum of all borrowed_copies)
    total_borrowed = db.query(func.sum(Inventory.borrowed_copies)).scalar() or 0

    return {
        "total_books": total_books,
        "total_users": total_users,
        "total_borrowed": int(total_borrowed)
    }
