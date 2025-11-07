#!/usr/bin/env python3
"""
Script to add sample books and inventory to the library database.
Run this after logging in as a librarian/admin.
"""

import sys
import requests

# Configuration
BASE_URL = "http://localhost:8000"

# Sample books data
SAMPLE_BOOKS = [
    {
        "title": "To Kill a Mockingbird",
        "author": "Harper Lee",
        "publisher": "J. B. Lippincott & Co.",
        "summary": "A gripping tale of racial injustice and childhood innocence",
        "genre": "Fiction",
        "year_of_publishing": 1960
    },
    {
        "title": "1984",
        "author": "George Orwell",
        "publisher": "Secker & Warburg",
        "summary": "A dystopian social science fiction novel",
        "genre": "Science Fiction",
        "year_of_publishing": 1949
    },
    {
        "title": "The Great Gatsby",
        "author": "F. Scott Fitzgerald",
        "publisher": "Scribner",
        "summary": "A story of wealth and tragedy in 1920s America",
        "genre": "Fiction",
        "year_of_publishing": 1925
    },
    {
        "title": "Pride and Prejudice",
        "author": "Jane Austen",
        "publisher": "T. Egerton",
        "summary": "A romantic novel of manners",
        "genre": "Romance",
        "year_of_publishing": 1813
    },
    {
        "title": "The Catcher in the Rye",
        "author": "J.D. Salinger",
        "publisher": "Little, Brown and Company",
        "summary": "A story about teenage rebellion and angst",
        "genre": "Fiction",
        "year_of_publishing": 1951
    }
]


def add_books(token):
    """Add sample books to the library"""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    print("Adding sample books...")
    print("=" * 60)

    book_ids = []
    for book in SAMPLE_BOOKS:
        try:
            response = requests.post(
                f"{BASE_URL}/books/",
                json=book,
                headers=headers
            )

            if response.status_code == 201:
                book_data = response.json()
                book_id = book_data["id"]
                book_ids.append(book_id)
                print(f"✓ Added: {book['title']} (ID: {book_id})")
            else:
                print(f"✗ Failed to add {book['title']}: {response.text}")
        except Exception as e:
            print(f"✗ Error adding {book['title']}: {e}")

    print("=" * 60)
    print(f"Added {len(book_ids)} books successfully!\n")
    return book_ids


def add_inventory(token, book_ids):
    """Add inventory for all books"""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    print("Adding inventory for books...")
    print("=" * 60)

    for book_id in book_ids:
        try:
            # Add 5 total copies for each book
            inventory_data = {
                "book_id": book_id,
                "total_copies": 5,
                "borrowed_copies": 0
            }

            response = requests.post(
                f"{BASE_URL}/inventory/",
                json=inventory_data,
                headers=headers
            )

            if response.status_code == 201:
                print(f"✓ Added inventory for Book ID {book_id}: 5 copies")
            else:
                print(f"✗ Failed to add inventory for Book ID {book_id}: {response.text}")
        except Exception as e:
            print(f"✗ Error adding inventory for Book ID {book_id}: {e}")

    print("=" * 60)
    print(f"Added inventory for {len(book_ids)} books!\n")


def list_books(token):
    """List all books in the library"""
    headers = {
        "Authorization": f"Bearer {token}",
    }

    try:
        response = requests.get(f"{BASE_URL}/books/", headers=headers)

        if response.status_code == 200:
            books = response.json()
            print("\nCurrent Library Catalog:")
            print("=" * 60)
            for book in books:
                available = book.get("available_copies", "N/A")
                print(f"ID {book['id']}: {book['title']} by {book['author']}")
                print(f"  Genre: {book['genre']} | Year: {book['year_of_publishing']}")
                print(f"  Available: {available} copies")
                print()
        else:
            print(f"Failed to list books: {response.text}")
    except Exception as e:
        print(f"Error listing books: {e}")


def main():
    print("Library Sample Data Setup")
    print("=" * 60)

    if len(sys.argv) < 2:
        print("Usage: python add_sample_data.py <access_token>")
        print("\nHow to get your access token:")
        print("1. Login via browser: http://localhost:8000/auth/login/google")
        print("2. Copy the 'access_token' from the JSON response")
        print("3. Run: python add_sample_data.py YOUR_TOKEN")
        print("\nAlternatively, check browser cookies for 'access_token'")
        sys.exit(1)

    token = sys.argv[1]

    # Add books
    book_ids = add_books(token)

    if book_ids:
        # Add inventory for books
        add_inventory(token, book_ids)

        # List all books
        list_books(token)

        print("=" * 60)
        print("✓ Setup complete!")
        print("\nNext steps:")
        print("  - Visit http://localhost:8000/docs to explore the API")
        print("  - Visit http://localhost:8000/books/ to see all books")
        print("  - Try borrowing a book: POST /borrow/")
    else:
        print("No books were added. Please check your token and try again.")


if __name__ == "__main__":
    main()
