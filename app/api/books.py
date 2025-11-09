from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from app.database import get_db
from app.models.models import Book, BookInventory, User, BorrowRecord
from app.schemas.schemas import BookCreate, BookUpdate, BookResponse, BookWithInventory
from app.dependencies.auth import require_librarian, get_current_user

router = APIRouter(prefix="/books", tags=["books"])


@router.post("/", response_model=BookResponse, status_code=status.HTTP_201_CREATED)
def create_book(
    book: BookCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_librarian)
):
    db_book = Book(**book.model_dump())
    db.add(db_book)
    db.commit()
    db.refresh(db_book)
    return db_book


@router.get("/", response_model=List[BookWithInventory])
def list_books(
    skip: int = 0,
    limit: int = 100,
    genre: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Book)

    if genre:
        query = query.filter(Book.genre == genre)

    books = query.offset(skip).limit(limit).all()

    result = []
    for book in books:
        book_data = BookWithInventory.model_validate(book)
        if book.inventory:
            book_data.available_copies = book.inventory.total_copies - book.inventory.borrowed_copies

        # Check if current user has borrowed this book
        borrow_record = db.query(BorrowRecord).filter(
            BorrowRecord.user_id == current_user.id,
            BorrowRecord.book_id == book.id,
            BorrowRecord.delete_entry == False
        ).first()
        book_data.is_borrowed_by_user = borrow_record is not None

        result.append(book_data)

    return result


@router.get("/search/", response_model=List[BookWithInventory])
def search_books(
    title: Optional[str] = Query(None, description="Search by book title (partial match)"),
    author: Optional[str] = Query(None, description="Search by author name (partial match)"),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Search for books by title and/or author with partial matching.

    - **title**: Search term for book title (case-insensitive partial match)
    - **author**: Search term for author name (case-insensitive partial match)
    - If both provided with same value, returns books matching EITHER criteria (OR logic)
    - If both provided with different values, returns books matching BOTH criteria (AND logic)
    - If only one provided, returns books matching that criterion
    - Returns empty list if no search terms provided
    """

    if not title and not author:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one search parameter (title or author) is required"
        )

    query = db.query(Book)

    # Build search filters
    filters = []
    if title:
        filters.append(Book.title.ilike(f"%{title}%"))
    if author:
        filters.append(Book.author.ilike(f"%{author}%"))

    # Apply filters
    # If both title and author are the same, use OR logic (unified search)
    # Otherwise use AND logic (both must match if both provided)
    if len(filters) == 1:
        query = query.filter(filters[0])
    elif title == author:
        # Unified search - search for the term in either title or author
        query = query.filter(or_(*filters))
    else:
        # Different search terms - use AND logic
        query = query.filter(*filters)

    books = query.offset(skip).limit(limit).all()

    # Build response with inventory info
    result = []
    for book in books:
        book_data = BookWithInventory.model_validate(book)
        if book.inventory:
            book_data.available_copies = book.inventory.total_copies - book.inventory.borrowed_copies

        # Check if current user has borrowed this book
        borrow_record = db.query(BorrowRecord).filter(
            BorrowRecord.user_id == current_user.id,
            BorrowRecord.book_id == book.id,
            BorrowRecord.delete_entry == False
        ).first()
        book_data.is_borrowed_by_user = borrow_record is not None

        result.append(book_data)

    return result


@router.get("/{book_id}", response_model=BookWithInventory)
def get_book(
    book_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    book_data = BookWithInventory.model_validate(book)
    if book.inventory:
        book_data.available_copies = book.inventory.total_copies - book.inventory.borrowed_copies

    # Check if current user has borrowed this book
    borrow_record = db.query(BorrowRecord).filter(
        BorrowRecord.user_id == current_user.id,
        BorrowRecord.book_id == book.id,
        BorrowRecord.delete_entry == False
    ).first()
    book_data.is_borrowed_by_user = borrow_record is not None

    return book_data


@router.put("/{book_id}", response_model=BookResponse)
def update_book(
    book_id: int,
    book_update: BookUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_librarian)
):
    db_book = db.query(Book).filter(Book.id == book_id).first()
    if not db_book:
        raise HTTPException(status_code=404, detail="Book not found")

    update_data = book_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_book, field, value)

    db.commit()
    db.refresh(db_book)
    return db_book


@router.delete("/{book_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_book(
    book_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_librarian)
):
    db_book = db.query(Book).filter(Book.id == book_id).first()
    if not db_book:
        raise HTTPException(status_code=404, detail="Book not found")

    db.delete(db_book)
    db.commit()
    return None


@router.post("/{book_id}/toggle-circulation", response_model=BookResponse)
def toggle_book_circulation(
    book_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_librarian)
):
    """
    Toggle the circulation status of a book.
    Only librarians can mark books as in/out of circulation.
    """
    db_book = db.query(Book).filter(Book.id == book_id).first()
    if not db_book:
        raise HTTPException(status_code=404, detail="Book not found")

    # Toggle the circulation status
    db_book.in_circulation = not db_book.in_circulation

    db.commit()
    db.refresh(db_book)
    return db_book
