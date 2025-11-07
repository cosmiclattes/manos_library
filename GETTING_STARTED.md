# Getting Started - Quick Tutorial

This guide will walk you through setting up your first library, adding books, and managing inventory.

## Prerequisites

- App is running: `uvicorn app.main:app --reload`
- You have completed Google OAuth login

## Step 1: Make Yourself Super Admin

After logging in with Google, make yourself a super admin:

```bash
# Activate virtual environment
source venv/bin/activate

# Make yourself super admin (replace with your email)
python create_admin.py your-email@gmail.com super_admin
```

**Expected output:**
```
✓ User 'Your Name' (your-email@gmail.com) updated successfully!
  Previous role: member
  New role: super_admin
```

### Check Available Users

```bash
# List all users
python create_admin.py --list
```

## Step 2: Get Your Access Token

### Option A: From Browser (Easiest)

1. Login via browser:
   ```
   http://localhost:8000/auth/login/google
   ```

2. After OAuth, you'll see JSON response:
   ```json
   {
     "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
     "token_type": "bearer"
   }
   ```

3. Copy the `access_token` value

### Option B: From Browser Cookies

1. After logging in, open DevTools (F12)
2. Go to Application → Cookies → http://localhost:8000
3. Find `access_token` cookie
4. Copy the value (it starts with "Bearer ")
5. Remove "Bearer " prefix, keep only the token part

## Step 3: Add Sample Books and Inventory (Automated)

Use the helper script to add 5 sample books with inventory:

```bash
# Replace YOUR_TOKEN with the actual token from Step 2
python add_sample_data.py YOUR_TOKEN
```

**This script will:**
- ✅ Add 5 classic books (To Kill a Mockingbird, 1984, etc.)
- ✅ Add inventory for each book (5 copies each)
- ✅ Display the complete catalog

**Expected output:**
```
Adding sample books...
============================================================
✓ Added: To Kill a Mockingbird (ID: 1)
✓ Added: 1984 (ID: 2)
✓ Added: The Great Gatsby (ID: 3)
✓ Added: Pride and Prejudice (ID: 4)
✓ Added: The Catcher in the Rye (ID: 5)
============================================================
Added 5 books successfully!

Adding inventory for books...
============================================================
✓ Added inventory for Book ID 1: 5 copies
✓ Added inventory for Book ID 2: 5 copies
...
```

## Step 4: Manual Book Addition (Via Swagger UI)

### Add a Book

1. **Go to Swagger UI:**
   ```
   http://localhost:8000/docs
   ```

2. **Authorize (if using Swagger):**
   - Click "Authorize" button
   - Enter: `Bearer YOUR_TOKEN` or just `YOUR_TOKEN`
   - Click "Authorize"

   **OR** just browse after logging in (cookies work automatically!)

3. **Find POST /books/ endpoint** and click "Try it out"

4. **Enter book data:**
   ```json
   {
     "title": "Harry Potter and the Philosopher's Stone",
     "author": "J.K. Rowling",
     "publisher": "Bloomsbury",
     "summary": "A young wizard's journey begins",
     "genre": "Fantasy",
     "year_of_publishing": 1997
   }
   ```

5. **Click "Execute"**

6. **Note the book ID** from the response (e.g., ID: 6)

### Add Inventory for the Book

1. **Find POST /inventory/ endpoint** and click "Try it out"

2. **Enter inventory data:**
   ```json
   {
     "book_id": 6,
     "total_copies": 10,
     "borrowed_copies": 0
   }
   ```

3. **Click "Execute"**

## Step 5: View All Books

### Via Browser:
```
http://localhost:8000/books/
```

### Via Swagger UI:
- Go to GET /books/
- Click "Try it out"
- Click "Execute"

### Via curl:
```bash
curl http://localhost:8000/books/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Step 6: Borrow a Book

### Via Swagger UI:

1. **Find POST /borrow/ endpoint**

2. **Enter:**
   ```json
   {
     "book_id": 1
   }
   ```

3. **Click "Execute"**

**Expected response:**
```json
{
  "id": 1,
  "user_id": 1,
  "book_id": 1,
  "borrow_count": 1,
  "delete_entry": false
}
```

### Via curl:
```bash
curl -X POST http://localhost:8000/borrow/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"book_id": 1}'
```

## Step 7: View Your Borrowed Books

### Via Browser:
```
http://localhost:8000/borrow/my-books
```

### Via Swagger UI:
- Go to GET /borrow/my-books
- Click "Try it out"
- Click "Execute"

## Step 8: Return a Book

### Via Swagger UI:

1. **Find POST /borrow/return/{book_id} endpoint**

2. **Enter book_id: 1**

3. **Click "Execute"**

### Via curl:
```bash
curl -X POST http://localhost:8000/borrow/return/1 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Step 9: Update a Book

### Via Swagger UI:

1. **Find PUT /books/{book_id} endpoint**

2. **Enter book_id: 1**

3. **Enter update data:**
   ```json
   {
     "summary": "Updated summary: A powerful exploration of racial injustice"
   }
   ```

4. **Click "Execute"**

## Step 10: Update Inventory

### Via Swagger UI:

1. **Find PUT /inventory/{book_id} endpoint**

2. **Enter book_id: 1**

3. **Enter update data:**
   ```json
   {
     "total_copies": 10
   }
   ```

4. **Click "Execute"**

## Common Commands Reference

### User Management
```bash
# Make user super admin
python create_admin.py user@email.com super_admin

# Make user librarian
python create_admin.py user@email.com librarian

# List all users
python create_admin.py --list
```

### Quick Data Setup
```bash
# Add sample books and inventory
python add_sample_data.py YOUR_TOKEN
```

### API Testing with curl

```bash
# Set your token
TOKEN="your_access_token_here"

# List books
curl -H "Authorization: Bearer $TOKEN" http://localhost:8000/books/

# Add book
curl -X POST http://localhost:8000/books/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Book Title","author":"Author Name","genre":"Fiction","year_of_publishing":2024}'

# Add inventory
curl -X POST http://localhost:8000/inventory/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"book_id":1,"total_copies":5,"borrowed_copies":0}'

# Borrow book
curl -X POST http://localhost:8000/borrow/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"book_id":1}'

# Return book
curl -X POST http://localhost:8000/borrow/return/1 \
  -H "Authorization: Bearer $TOKEN"

# View borrowed books
curl -H "Authorization: Bearer $TOKEN" http://localhost:8000/borrow/my-books
```

## Workflow Summary

```
1. Login with Google
   ↓
2. Make yourself super admin/librarian
   ↓
3. Add books (manual or via script)
   ↓
4. Add inventory for books
   ↓
5. Users can borrow books
   ↓
6. Users can return books
   ↓
7. Librarians can update books/inventory
```

## Troubleshooting

### "Not authenticated" error
- Make sure you've logged in via Google OAuth
- Check that your token is valid
- Try logging in again

### "Not enough permissions" error
- Make sure you're a librarian or super admin
- Run: `python create_admin.py your-email@gmail.com librarian`

### Book ID not found
- List all books first: `GET /books/`
- Use the correct book ID from the response

### Cannot add inventory
- Make sure the book exists first
- Check that inventory doesn't already exist for this book
- Use PUT to update existing inventory

## Next Steps

- **Add more books** via Swagger UI or script
- **Test the borrow/return flow** with multiple books
- **View the API documentation** at http://localhost:8000/docs
- **Check the API reference** in API_REFERENCE.md
- **Explore all endpoints** in Swagger UI

Happy managing! 📚
