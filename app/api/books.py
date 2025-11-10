from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, text
from typing import List, Optional
from app.database import get_db
from app.models.models import Book, BookInventory, User, BorrowRecord
from app.schemas.schemas import BookCreate, BookUpdate, BookResponse, BookWithInventory, BookWithSimilarity
from app.dependencies.auth import require_librarian, get_current_user
from app.services.embedding_service import embedding_service

router = APIRouter(prefix="/books", tags=["books"])


@router.post("/", response_model=BookResponse, status_code=status.HTTP_201_CREATED)
def create_book(
    book: BookCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_librarian)
):
    db_book = Book(**book.model_dump())

    # Generate embedding for the book using title, author, summary, and genre
    embedding = embedding_service.generate_embedding(
        title=book.title,
        author=book.author,
        summary=book.summary,
        genre=book.genre
    )

    if embedding:
        db_book.embedding = embedding

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

    # Members should only see books that are in circulation
    if current_user.user_type.value == "member":
        query = query.filter(Book.in_circulation == True)

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

    # Members should only see books that are in circulation
    if current_user.user_type.value == "member":
        query = query.filter(Book.in_circulation == True)

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


@router.get("/semantic-search/", response_model=List[BookWithSimilarity])
def semantic_search_books(
    query: str = Query(..., description="Natural language search query"),
    limit: int = Query(10, ge=1, le=50, description="Number of results to return"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Semantic search for books using natural language queries.

    Uses AI embeddings to find books based on meaning rather than exact text matches.

    - **query**: Natural language description of what you're looking for
      (e.g., "mysteries set in Victorian England", "books about space exploration")
    - **limit**: Maximum number of results to return (1-50)

    Returns books ranked by semantic similarity with similarity scores.
    """

    # Generate embedding for the search query
    query_embedding = embedding_service.generate_query_embedding(query)

    if not query_embedding:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Embedding service is not available. Please ensure Vertex AI credentials are configured."
        )

    # Convert embedding to PostgreSQL vector format
    embedding_str = "[" + ",".join(str(x) for x in query_embedding) + "]"

    # Query for similar books using cosine similarity
    # Note: Using 1 - cosine distance to get similarity score (higher = more similar)
    # Using CAST instead of :: to avoid parameter binding issues
    # Only return results with similarity >= 0.4 to ensure quality matches
    # Members should only see books that are in circulation
    if current_user.user_type.value == "member":
        query_sql = text("""
            SELECT
                b.*,
                1 - (b.embedding <=> CAST(:query_embedding AS vector)) as similarity
            FROM books b
            WHERE b.embedding IS NOT NULL
                AND b.in_circulation = true
                AND (1 - (b.embedding <=> CAST(:query_embedding AS vector))) >= 0.4
            ORDER BY b.embedding <=> CAST(:query_embedding AS vector)
            LIMIT :limit
        """)
    else:
        query_sql = text("""
            SELECT
                b.*,
                1 - (b.embedding <=> CAST(:query_embedding AS vector)) as similarity
            FROM books b
            WHERE b.embedding IS NOT NULL
                AND (1 - (b.embedding <=> CAST(:query_embedding AS vector))) >= 0.4
            ORDER BY b.embedding <=> CAST(:query_embedding AS vector)
            LIMIT :limit
        """)

    result_rows = db.execute(
        query_sql,
        {"query_embedding": embedding_str, "limit": limit}
    ).fetchall()

    # Build response with book data and similarity scores
    results = []
    for row in result_rows:
        # Get the book object
        book = db.query(Book).filter(Book.id == row.id).first()

        if book:
            # First validate as BookWithInventory to get book data
            book_dict = BookWithInventory.model_validate(book).model_dump()

            # Add inventory information
            if book.inventory:
                book_dict['available_copies'] = book.inventory.total_copies - book.inventory.borrowed_copies

            # Check if current user has borrowed this book
            borrow_record = db.query(BorrowRecord).filter(
                BorrowRecord.user_id == current_user.id,
                BorrowRecord.book_id == book.id,
                BorrowRecord.delete_entry == False
            ).first()
            book_dict['is_borrowed_by_user'] = borrow_record is not None

            # Add similarity score
            book_dict['similarity_score'] = float(row.similarity)

            # Now create BookWithSimilarity with all required fields
            book_data = BookWithSimilarity(**book_dict)

            results.append(book_data)

    return results


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

    # Regenerate embedding if title, author, summary, or genre changed
    if any(field in update_data for field in ['title', 'author', 'summary', 'genre']):
        embedding = embedding_service.generate_embedding(
            title=db_book.title,
            author=db_book.author,
            summary=db_book.summary,
            genre=db_book.genre
        )

        if embedding:
            db_book.embedding = embedding

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
