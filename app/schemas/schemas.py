from pydantic import BaseModel, EmailStr
from typing import Optional
from app.models.models import UserType


class UserBase(BaseModel):
    name: str
    email: EmailStr
    user_type: UserType = UserType.MEMBER


class UserCreate(UserBase):
    google_id: Optional[str] = None


class UserResponse(UserBase):
    id: int
    google_id: Optional[str] = None

    class Config:
        from_attributes = True


class BookBase(BaseModel):
    title: str
    author: str
    publisher: Optional[str] = None
    summary: Optional[str] = None
    genre: Optional[str] = None
    year_of_publishing: Optional[int] = None


class BookCreate(BookBase):
    pass


class BookUpdate(BaseModel):
    title: Optional[str] = None
    author: Optional[str] = None
    publisher: Optional[str] = None
    summary: Optional[str] = None
    genre: Optional[str] = None
    year_of_publishing: Optional[int] = None


class BookResponse(BookBase):
    id: int

    class Config:
        from_attributes = True


class BookInventoryBase(BaseModel):
    book_id: int
    total_copies: int = 0
    borrowed_copies: int = 0


class BookInventoryCreate(BookInventoryBase):
    pass


class BookInventoryUpdate(BaseModel):
    total_copies: Optional[int] = None
    borrowed_copies: Optional[int] = None


class BookInventoryResponse(BookInventoryBase):
    id: int

    class Config:
        from_attributes = True


class BorrowRecordCreate(BaseModel):
    book_id: int


class BorrowRecordResponse(BaseModel):
    id: int
    user_id: int
    book_id: int
    borrow_count: int
    delete_entry: bool

    class Config:
        from_attributes = True


class BookWithInventory(BookResponse):
    inventory: Optional[BookInventoryResponse] = None
    available_copies: Optional[int] = None


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: Optional[str] = None
