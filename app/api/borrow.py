from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.models import BorrowRecord, BookInventory, Book, User
from app.schemas.schemas import BorrowRecordCreate, BorrowRecordResponse
from app.dependencies.auth import get_current_user

router = APIRouter(prefix="/borrow", tags=["borrow"])


@router.post("/", response_model=BorrowRecordResponse, status_code=status.HTTP_201_CREATED)
def borrow_book(
    borrow: BorrowRecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    book = db.query(Book).filter(Book.id == borrow.book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    inventory = db.query(BookInventory).filter(
        BookInventory.book_id == borrow.book_id
    ).first()

    if not inventory:
        raise HTTPException(
            status_code=400,
            detail="No inventory record exists for this book"
        )

    available_copies = inventory.total_copies - inventory.borrowed_copies
    if available_copies <= 0:
        raise HTTPException(
            status_code=400,
            detail="No copies available for borrowing"
        )

    existing_record = db.query(BorrowRecord).filter(
        BorrowRecord.user_id == current_user.id,
        BorrowRecord.book_id == borrow.book_id,
        BorrowRecord.delete_entry == False
    ).first()

    if existing_record:
        existing_record.borrow_count += 1
        db.commit()
        db.refresh(existing_record)
        borrow_record = existing_record
    else:
        borrow_record = BorrowRecord(
            user_id=current_user.id,
            book_id=borrow.book_id,
            borrow_count=1,
            delete_entry=False
        )
        db.add(borrow_record)

    inventory.borrowed_copies += 1
    db.commit()
    db.refresh(borrow_record)

    return borrow_record


@router.post("/return/{book_id}", response_model=BorrowRecordResponse)
def return_book(
    book_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    borrow_record = db.query(BorrowRecord).filter(
        BorrowRecord.user_id == current_user.id,
        BorrowRecord.book_id == book_id,
        BorrowRecord.delete_entry == False
    ).first()

    if not borrow_record:
        raise HTTPException(
            status_code=404,
            detail="No active borrow record found for this book"
        )

    inventory = db.query(BookInventory).filter(
        BookInventory.book_id == book_id
    ).first()

    if not inventory:
        raise HTTPException(
            status_code=400,
            detail="Inventory record not found for this book"
        )

    if inventory.borrowed_copies <= 0:
        raise HTTPException(
            status_code=400,
            detail="Cannot return book: no copies are marked as borrowed"
        )

    inventory.borrowed_copies -= 1
    borrow_record.delete_entry = True

    db.commit()
    db.refresh(borrow_record)

    return borrow_record


@router.get("/my-books", response_model=List[BorrowRecordResponse])
def get_my_borrowed_books(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    records = db.query(BorrowRecord).filter(
        BorrowRecord.user_id == current_user.id,
        BorrowRecord.delete_entry == False
    ).all()
    return records


@router.get("/history", response_model=List[BorrowRecordResponse])
def get_borrow_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    records = db.query(BorrowRecord).filter(
        BorrowRecord.user_id == current_user.id
    ).all()
    return records
