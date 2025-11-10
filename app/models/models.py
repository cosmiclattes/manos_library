from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector
from app.database import Base
import enum


class UserType(enum.Enum):
    SUPER_ADMIN = "super_admin"
    LIBRARIAN = "librarian"
    MEMBER = "member"


class Library(Base):
    __tablename__ = "libraries"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    address = Column(Text, nullable=True)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    user_type = Column(SQLEnum(UserType), default=UserType.MEMBER, nullable=False)
    google_id = Column(String(255), unique=True, index=True, nullable=True)

    borrow_records = relationship("BorrowRecord", back_populates="user")


class Book(Base):
    __tablename__ = "books"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False, index=True)
    author = Column(String(255), nullable=False)
    publisher = Column(String(255), nullable=True)
    summary = Column(Text, nullable=True)
    genre = Column(String(100), nullable=True, index=True)
    year_of_publishing = Column(Integer, nullable=True)
    in_circulation = Column(Boolean, default=True, nullable=False)
    embedding = Column(Vector(768), nullable=True)  # Vertex AI text-embedding-004 dimension

    inventory = relationship("BookInventory", back_populates="book", uselist=False)
    borrow_records = relationship("BorrowRecord", back_populates="book")


class BookInventory(Base):
    __tablename__ = "book_inventory"

    id = Column(Integer, primary_key=True, index=True)
    book_id = Column(Integer, ForeignKey("books.id"), unique=True, nullable=False)
    total_copies = Column(Integer, default=0, nullable=False)
    borrowed_copies = Column(Integer, default=0, nullable=False)

    book = relationship("Book", back_populates="inventory")


class BorrowRecord(Base):
    __tablename__ = "borrow_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    book_id = Column(Integer, ForeignKey("books.id"), nullable=False)
    borrow_count = Column(Integer, default=1, nullable=False)
    delete_entry = Column(Boolean, default=False, nullable=False)

    user = relationship("User", back_populates="borrow_records")
    book = relationship("Book", back_populates="borrow_records")
