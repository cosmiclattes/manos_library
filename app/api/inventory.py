from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.models import BookInventory, Book, User
from app.schemas.schemas import BookInventoryCreate, BookInventoryUpdate, BookInventoryResponse
from app.dependencies.auth import require_librarian

router = APIRouter(prefix="/inventory", tags=["inventory"])


@router.post("/", response_model=BookInventoryResponse, status_code=status.HTTP_201_CREATED)
def create_inventory(
    inventory: BookInventoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_librarian)
):
    book = db.query(Book).filter(Book.id == inventory.book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    existing_inventory = db.query(BookInventory).filter(
        BookInventory.book_id == inventory.book_id
    ).first()
    if existing_inventory:
        raise HTTPException(
            status_code=400,
            detail="Inventory already exists for this book. Use PUT to update."
        )

    db_inventory = BookInventory(**inventory.model_dump())
    db.add(db_inventory)
    db.commit()
    db.refresh(db_inventory)
    return db_inventory


@router.get("/", response_model=List[BookInventoryResponse])
def list_inventory(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_librarian)
):
    inventories = db.query(BookInventory).offset(skip).limit(limit).all()
    return inventories


@router.get("/{book_id}", response_model=BookInventoryResponse)
def get_inventory(
    book_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_librarian)
):
    inventory = db.query(BookInventory).filter(BookInventory.book_id == book_id).first()
    if not inventory:
        raise HTTPException(status_code=404, detail="Inventory not found for this book")
    return inventory


@router.put("/{book_id}", response_model=BookInventoryResponse)
def update_inventory(
    book_id: int,
    inventory_update: BookInventoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_librarian)
):
    db_inventory = db.query(BookInventory).filter(BookInventory.book_id == book_id).first()
    if not db_inventory:
        raise HTTPException(status_code=404, detail="Inventory not found for this book")

    update_data = inventory_update.model_dump(exclude_unset=True)

    if "borrowed_copies" in update_data:
        if update_data["borrowed_copies"] > db_inventory.total_copies:
            raise HTTPException(
                status_code=400,
                detail="Borrowed copies cannot exceed total copies"
            )

    for field, value in update_data.items():
        setattr(db_inventory, field, value)

    db.commit()
    db.refresh(db_inventory)
    return db_inventory


@router.delete("/{book_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_inventory(
    book_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_librarian)
):
    db_inventory = db.query(BookInventory).filter(BookInventory.book_id == book_id).first()
    if not db_inventory:
        raise HTTPException(status_code=404, detail="Inventory not found for this book")

    db.delete(db_inventory)
    db.commit()
    return None
