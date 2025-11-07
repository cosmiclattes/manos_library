# Book Search Guide

## Search Endpoint

**URL**: `GET /books/search/`

**Access**: All authenticated users

## Features

✅ **Case-insensitive** - "gatsby" matches "Gatsby", "GATSBY", etc.
✅ **Partial matching** - "kill" matches "To Kill a Mockingbird"
✅ **Search by title** - Find books by their title
✅ **Search by author** - Find books by author name
✅ **Combined search** - Search by both title AND author
✅ **Includes inventory** - Shows available copies

## Usage Examples

### 1. Search by Title

Find all books with "gatsby" in the title:

```bash
# Browser
http://localhost:8000/books/search/?title=gatsby

# curl
curl "http://localhost:8000/books/search/?title=gatsby" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
[
  {
    "id": 3,
    "title": "The Great Gatsby",
    "author": "F. Scott Fitzgerald",
    "genre": "Fiction",
    "available_copies": 5
  }
]
```

### 2. Search by Author

Find all books by authors with "orwell" in their name:

```bash
# Browser
http://localhost:8000/books/search/?author=orwell

# curl
curl "http://localhost:8000/books/search/?author=orwell" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
[
  {
    "id": 2,
    "title": "1984",
    "author": "George Orwell",
    "genre": "Science Fiction",
    "available_copies": 5
  }
]
```

### 3. Search by Both Title and Author

Find books that match BOTH criteria:

```bash
# Browser
http://localhost:8000/books/search/?title=1984&author=george

# curl
curl "http://localhost:8000/books/search/?title=1984&author=george" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

This returns books where:
- Title contains "1984" **AND**
- Author contains "george"

### 4. Partial Matching Examples

**Search for "kill":**
```bash
http://localhost:8000/books/search/?title=kill
```
Matches: "To Kill a Mockingbird"

**Search for "pride":**
```bash
http://localhost:8000/books/search/?title=pride
```
Matches: "Pride and Prejudice"

**Search for "lee":**
```bash
http://localhost:8000/books/search/?author=lee
```
Matches: "Harper Lee", or any author with "lee" in their name

### 5. Case-Insensitive Search

All searches are case-insensitive:

```bash
# These all return the same results:
/books/search/?title=GATSBY
/books/search/?title=gatsby
/books/search/?title=GaTsBY
/books/search/?title=Gatsby
```

## Using in Swagger UI

1. **Go to**: `http://localhost:8000/docs`

2. **Find**: `GET /books/search/`

3. **Click**: "Try it out"

4. **Enter search terms**:
   - Title: `gatsby`
   - Author: (leave empty)

5. **Click**: "Execute"

## Search Tips

### ✅ Good Searches

```bash
# Find books about mockingbirds
?title=mockingbird

# Find books by Harper
?author=harper

# Find Orwell's 1984
?title=1984&author=orwell

# Partial title search
?title=great

# Single letter search (finds all matching)
?author=j
```

### ❌ Common Mistakes

```bash
# No search parameters (returns error)
/books/search/

# Empty parameters (returns error)
?title=&author=

# Typos (returns empty array, not error)
?title=gatzby  # No results
```

## Response Format

### Successful Search

```json
[
  {
    "id": 1,
    "title": "Book Title",
    "author": "Author Name",
    "publisher": "Publisher",
    "summary": "Book summary",
    "genre": "Genre",
    "year_of_publishing": 2020,
    "inventory": {
      "id": 1,
      "book_id": 1,
      "total_copies": 10,
      "borrowed_copies": 3
    },
    "available_copies": 7
  }
]
```

### No Matches Found

```json
[]
```

### Error (No Search Parameters)

```json
{
  "detail": "At least one search parameter (title or author) is required"
}
```

## Advanced Usage

### Pagination

Search supports pagination with `skip` and `limit`:

```bash
# Get first 10 results
/books/search/?title=fiction&limit=10

# Get next 10 results
/books/search/?title=fiction&skip=10&limit=10

# Get all results (up to 100 by default)
/books/search/?author=smith
```

### URL Encoding

For searches with spaces or special characters, URL encode them:

```bash
# Search for "Harry Potter"
/books/search/?title=Harry%20Potter

# Or let the browser/tool handle it:
curl "http://localhost:8000/books/search/?title=Harry Potter"
```

## Performance Notes

- Search uses database indexes on `title` and `author` columns
- Partial matching (`ILIKE %term%`) is efficient for small-medium datasets
- For very large libraries, consider using full-text search (PostgreSQL FTS)

## Examples with Real Data

After running `add_sample_data.py`, try these searches:

```bash
# Find "To Kill a Mockingbird"
?title=kill
?title=mockingbird
?author=harper

# Find "1984"
?title=1984
?author=orwell

# Find "The Great Gatsby"
?title=gatsby
?author=fitzgerald

# Find "Pride and Prejudice"
?title=pride
?author=austen

# Find "The Catcher in the Rye"
?title=catcher
?author=salinger
```

## Integration Examples

### JavaScript (Fetch API)

```javascript
const searchBooks = async (title, author) => {
  const params = new URLSearchParams();
  if (title) params.append('title', title);
  if (author) params.append('author', author);

  const response = await fetch(
    `http://localhost:8000/books/search/?${params}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  return await response.json();
};

// Usage
const results = await searchBooks('gatsby', null);
```

### Python (requests)

```python
import requests

def search_books(token, title=None, author=None):
    params = {}
    if title:
        params['title'] = title
    if author:
        params['author'] = author

    response = requests.get(
        'http://localhost:8000/books/search/',
        params=params,
        headers={'Authorization': f'Bearer {token}'}
    )

    return response.json()

# Usage
results = search_books(token, title='gatsby')
```

### curl with Variables

```bash
#!/bin/bash
TOKEN="your_token_here"
SEARCH_TITLE="gatsby"

curl "http://localhost:8000/books/search/?title=${SEARCH_TITLE}" \
  -H "Authorization: Bearer $TOKEN"
```

## Summary

The search endpoint provides a simple yet powerful way to find books in your library:

- 🔍 **Flexible**: Search by title, author, or both
- 🎯 **Smart**: Case-insensitive partial matching
- 📊 **Complete**: Includes inventory and availability
- 🚀 **Fast**: Uses database indexes
- 👥 **Accessible**: Available to all authenticated users

Happy searching! 📚
