from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.models import Book, BookInventory, User
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
