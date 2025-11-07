# API Reference

## Authentication

All endpoints except authentication endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### Login with Google

**Endpoint**: `GET /auth/login/google`

**Description**: Redirects to Google OAuth login page

**Response**: Redirects to Google authentication

---

**Endpoint**: `GET /auth/callback/google`

**Description**: OAuth callback endpoint (handled automatically by Google)

**Response**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

---

**Endpoint**: `GET /auth/me`

**Description**: Get current user information

**Authentication**: Required

**Response**:
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "user_type": "member",
  "google_id": "1234567890"
}
```

---

## Books

### Create Book

**Endpoint**: `POST /books/`

**Authentication**: Required (Librarian only)

**Request Body**:
```json
{
  "title": "The Great Gatsby",
  "author": "F. Scott Fitzgerald",
  "publisher": "Scribner",
  "summary": "A story of wealth and tragedy in 1920s America",
  "genre": "Fiction",
  "year_of_publishing": 1925
}
```

**Response**: `201 Created`
```json
{
  "id": 1,
  "title": "The Great Gatsby",
  "author": "F. Scott Fitzgerald",
  "publisher": "Scribner",
  "summary": "A story of wealth and tragedy in 1920s America",
  "genre": "Fiction",
  "year_of_publishing": 1925
}
```

---

### List Books

**Endpoint**: `GET /books/`

**Authentication**: Required (All users)

**Query Parameters**:
- `skip` (optional): Number of records to skip (default: 0)
- `limit` (optional): Maximum number of records to return (default: 100)
- `genre` (optional): Filter by genre

**Example**: `GET /books/?skip=0&limit=10&genre=Fiction`

**Response**: `200 OK`
```json
[
  {
    "id": 1,
    "title": "The Great Gatsby",
    "author": "F. Scott Fitzgerald",
    "publisher": "Scribner",
    "summary": "A story of wealth and tragedy in 1920s America",
    "genre": "Fiction",
    "year_of_publishing": 1925,
    "inventory": {
      "id": 1,
      "book_id": 1,
      "total_copies": 5,
      "borrowed_copies": 2
    },
    "available_copies": 3
  }
]
```

---

### Search Books

**Endpoint**: `GET /books/search/`

**Authentication**: Required (All users)

**Description**: Search for books by title and/or author with case-insensitive partial matching

**Query Parameters**:
- `title` (optional): Search term for book title (partial match)
- `author` (optional): Search term for author name (partial match)
- `skip` (optional): Number of records to skip (default: 0)
- `limit` (optional): Maximum number of records to return (default: 100)

**Note**: At least one search parameter (title or author) must be provided

**Examples**:

Search by title only:
```
GET /books/search/?title=gatsby
```

Search by author only:
```
GET /books/search/?author=orwell
```

Search by both (must match both):
```
GET /books/search/?title=1984&author=george
```

Partial matches work:
```
GET /books/search/?title=kill    # Matches "To Kill a Mockingbird"
GET /books/search/?author=lee    # Matches "Harper Lee", "Stan Lee", etc.
```

**Response**: `200 OK`
```json
[
  {
    "id": 1,
    "title": "The Great Gatsby",
    "author": "F. Scott Fitzgerald",
    "publisher": "Scribner",
    "summary": "A story of wealth and tragedy in 1920s America",
    "genre": "Fiction",
    "year_of_publishing": 1925,
    "inventory": {
      "id": 1,
      "book_id": 1,
      "total_copies": 5,
      "borrowed_copies": 2
    },
    "available_copies": 3
  }
]
```

**Empty result** (no matches):
```json
[]
```

**Error** (no search parameters):
```json
{
  "detail": "At least one search parameter (title or author) is required"
}
```

---

### Get Book Details

**Endpoint**: `GET /books/{book_id}`

**Authentication**: Required (All users)

**Response**: `200 OK`
```json
{
  "id": 1,
  "title": "The Great Gatsby",
  "author": "F. Scott Fitzgerald",
  "publisher": "Scribner",
  "summary": "A story of wealth and tragedy in 1920s America",
  "genre": "Fiction",
  "year_of_publishing": 1925,
  "inventory": {
    "id": 1,
    "book_id": 1,
    "total_copies": 5,
    "borrowed_copies": 2
  },
  "available_copies": 3
}
```

---

### Update Book

**Endpoint**: `PUT /books/{book_id}`

**Authentication**: Required (Librarian only)

**Request Body** (all fields optional):
```json
{
  "title": "The Great Gatsby - Updated",
  "summary": "Updated summary"
}
```

**Response**: `200 OK`
```json
{
  "id": 1,
  "title": "The Great Gatsby - Updated",
  "author": "F. Scott Fitzgerald",
  "publisher": "Scribner",
  "summary": "Updated summary",
  "genre": "Fiction",
  "year_of_publishing": 1925
}
```

---

### Delete Book

**Endpoint**: `DELETE /books/{book_id}`

**Authentication**: Required (Librarian only)

**Response**: `204 No Content`

---

## Inventory Management

### Create Inventory

**Endpoint**: `POST /inventory/`

**Authentication**: Required (Librarian only)

**Request Body**:
```json
{
  "book_id": 1,
  "total_copies": 10,
  "borrowed_copies": 0
}
```

**Response**: `201 Created`
```json
{
  "id": 1,
  "book_id": 1,
  "total_copies": 10,
  "borrowed_copies": 0
}
```

---

### List Inventory

**Endpoint**: `GET /inventory/`

**Authentication**: Required (Librarian only)

**Query Parameters**:
- `skip` (optional): Number of records to skip (default: 0)
- `limit` (optional): Maximum number of records to return (default: 100)

**Response**: `200 OK`
```json
[
  {
    "id": 1,
    "book_id": 1,
    "total_copies": 10,
    "borrowed_copies": 3
  }
]
```

---

### Get Inventory for Book

**Endpoint**: `GET /inventory/{book_id}`

**Authentication**: Required (Librarian only)

**Response**: `200 OK`
```json
{
  "id": 1,
  "book_id": 1,
  "total_copies": 10,
  "borrowed_copies": 3
}
```

---

### Update Inventory

**Endpoint**: `PUT /inventory/{book_id}`

**Authentication**: Required (Librarian only)

**Request Body** (all fields optional):
```json
{
  "total_copies": 15,
  "borrowed_copies": 3
}
```

**Response**: `200 OK`
```json
{
  "id": 1,
  "book_id": 1,
  "total_copies": 15,
  "borrowed_copies": 3
}
```

---

### Delete Inventory

**Endpoint**: `DELETE /inventory/{book_id}`

**Authentication**: Required (Librarian only)

**Response**: `204 No Content`

---

## Borrowing System

### Borrow a Book

**Endpoint**: `POST /borrow/`

**Authentication**: Required (All users)

**Request Body**:
```json
{
  "book_id": 1
}
```

**Response**: `201 Created`
```json
{
  "id": 1,
  "user_id": 1,
  "book_id": 1,
  "borrow_count": 1,
  "delete_entry": false
}
```

**Notes**:
- If user already has an active borrow record for this book, the `borrow_count` increments
- Automatically updates inventory `borrowed_copies`
- Returns 400 error if no copies are available

---

### Return a Book

**Endpoint**: `POST /borrow/return/{book_id}`

**Authentication**: Required (All users)

**Response**: `200 OK`
```json
{
  "id": 1,
  "user_id": 1,
  "book_id": 1,
  "borrow_count": 1,
  "delete_entry": true
}
```

**Notes**:
- Marks the borrow record as deleted (`delete_entry: true`)
- Automatically decrements inventory `borrowed_copies`
- Returns 404 error if user hasn't borrowed this book

---

### Get My Borrowed Books

**Endpoint**: `GET /borrow/my-books`

**Authentication**: Required (All users)

**Description**: Get list of currently borrowed books (not yet returned)

**Response**: `200 OK`
```json
[
  {
    "id": 1,
    "user_id": 1,
    "book_id": 1,
    "borrow_count": 1,
    "delete_entry": false
  }
]
```

---

### Get Borrow History

**Endpoint**: `GET /borrow/history`

**Authentication**: Required (All users)

**Description**: Get complete borrowing history including returned books

**Response**: `200 OK`
```json
[
  {
    "id": 1,
    "user_id": 1,
    "book_id": 1,
    "borrow_count": 1,
    "delete_entry": false
  },
  {
    "id": 2,
    "user_id": 1,
    "book_id": 2,
    "borrow_count": 2,
    "delete_entry": true
  }
]
```

---

## Error Responses

### 400 Bad Request
```json
{
  "detail": "Error message describing the issue"
}
```

### 401 Unauthorized
```json
{
  "detail": "Could not validate credentials"
}
```

### 403 Forbidden
```json
{
  "detail": "Not enough permissions. Librarian access required."
}
```

### 404 Not Found
```json
{
  "detail": "Resource not found"
}
```

### 422 Validation Error
```json
{
  "detail": [
    {
      "loc": ["body", "field_name"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

---

## User Roles and Permissions

| Role | List Books | Borrow/Return | Manage Books | Manage Inventory |
|------|-----------|---------------|--------------|------------------|
| Member | ✓ | ✓ | ✗ | ✗ |
| Librarian | ✓ | ✓ | ✓ | ✓ |
| Super Admin | ✓ | ✓ | ✓ | ✓ |

---

## Rate Limiting

Currently no rate limiting is implemented. For production use, consider adding rate limiting middleware.

---

## CORS

CORS is enabled for all origins in development. For production, update the `allow_origins` in `app/main.py`.
