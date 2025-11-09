#!/usr/bin/env python3
"""
Script to add sample books and inventory to the library database.
Run this after logging in as a librarian/admin.
"""

import sys
import requests
import os
import random

# Configuration - can be overridden with environment variable or command line
BASE_URL = os.getenv("API_URL", "http://localhost:8000")

# Sample books data - 50 classic and popular books
SAMPLE_BOOKS = [
    {
        "title": "To Kill a Mockingbird",
        "author": "Harper Lee",
        "publisher": "J. B. Lippincott & Co.",
        "summary": "A gripping tale of racial injustice and childhood innocence in the Deep South",
        "genre": "Fiction",
        "year_of_publishing": 1960
    },
    {
        "title": "1984",
        "author": "George Orwell",
        "publisher": "Secker & Warburg",
        "summary": "A dystopian novel depicting a totalitarian future society",
        "genre": "Science Fiction",
        "year_of_publishing": 1949
    },
    {
        "title": "The Great Gatsby",
        "author": "F. Scott Fitzgerald",
        "publisher": "Scribner",
        "summary": "A story of wealth, love, and tragedy in 1920s America",
        "genre": "Fiction",
        "year_of_publishing": 1925
    },
    {
        "title": "Pride and Prejudice",
        "author": "Jane Austen",
        "publisher": "T. Egerton",
        "summary": "A romantic novel of manners set in Georgian England",
        "genre": "Romance",
        "year_of_publishing": 1813
    },
    {
        "title": "The Catcher in the Rye",
        "author": "J.D. Salinger",
        "publisher": "Little, Brown and Company",
        "summary": "A story about teenage rebellion and alienation",
        "genre": "Fiction",
        "year_of_publishing": 1951
    },
    {
        "title": "Harry Potter and the Sorcerer's Stone",
        "author": "J.K. Rowling",
        "publisher": "Bloomsbury",
        "summary": "A young wizard discovers his magical heritage and attends Hogwarts",
        "genre": "Fantasy",
        "year_of_publishing": 1997
    },
    {
        "title": "The Hobbit",
        "author": "J.R.R. Tolkien",
        "publisher": "George Allen & Unwin",
        "summary": "Bilbo Baggins embarks on an unexpected adventure",
        "genre": "Fantasy",
        "year_of_publishing": 1937
    },
    {
        "title": "The Lord of the Rings",
        "author": "J.R.R. Tolkien",
        "publisher": "George Allen & Unwin",
        "summary": "Epic fantasy trilogy about the quest to destroy the One Ring",
        "genre": "Fantasy",
        "year_of_publishing": 1954
    },
    {
        "title": "Animal Farm",
        "author": "George Orwell",
        "publisher": "Secker & Warburg",
        "summary": "An allegorical novella about a farm revolution",
        "genre": "Fiction",
        "year_of_publishing": 1945
    },
    {
        "title": "Brave New World",
        "author": "Aldous Huxley",
        "publisher": "Chatto & Windus",
        "summary": "A dystopian novel set in a futuristic World State",
        "genre": "Science Fiction",
        "year_of_publishing": 1932
    },
    {
        "title": "The Chronicles of Narnia",
        "author": "C.S. Lewis",
        "publisher": "Geoffrey Bles",
        "summary": "A series of fantasy novels set in the magical land of Narnia",
        "genre": "Fantasy",
        "year_of_publishing": 1950
    },
    {
        "title": "Jane Eyre",
        "author": "Charlotte Brontë",
        "publisher": "Smith, Elder & Co.",
        "summary": "The story of a young governess and her mysterious employer",
        "genre": "Romance",
        "year_of_publishing": 1847
    },
    {
        "title": "Wuthering Heights",
        "author": "Emily Brontë",
        "publisher": "Thomas Cautley Newby",
        "summary": "A tale of passion and revenge on the Yorkshire moors",
        "genre": "Romance",
        "year_of_publishing": 1847
    },
    {
        "title": "Moby-Dick",
        "author": "Herman Melville",
        "publisher": "Harper & Brothers",
        "summary": "Captain Ahab's obsessive quest for a white whale",
        "genre": "Adventure",
        "year_of_publishing": 1851
    },
    {
        "title": "The Odyssey",
        "author": "Homer",
        "publisher": "Ancient Greece",
        "summary": "Epic poem about Odysseus's journey home after the Trojan War",
        "genre": "Epic",
        "year_of_publishing": -800
    },
    {
        "title": "Crime and Punishment",
        "author": "Fyodor Dostoevsky",
        "publisher": "The Russian Messenger",
        "summary": "A psychological thriller about guilt and redemption",
        "genre": "Fiction",
        "year_of_publishing": 1866
    },
    {
        "title": "The Brothers Karamazov",
        "author": "Fyodor Dostoevsky",
        "publisher": "The Russian Messenger",
        "summary": "A philosophical novel exploring faith, doubt, and morality",
        "genre": "Fiction",
        "year_of_publishing": 1880
    },
    {
        "title": "War and Peace",
        "author": "Leo Tolstoy",
        "publisher": "The Russian Messenger",
        "summary": "Epic novel of Russian society during the Napoleonic era",
        "genre": "Historical Fiction",
        "year_of_publishing": 1869
    },
    {
        "title": "Anna Karenina",
        "author": "Leo Tolstoy",
        "publisher": "The Russian Messenger",
        "summary": "Tragic story of love and adultery in 19th century Russia",
        "genre": "Romance",
        "year_of_publishing": 1877
    },
    {
        "title": "The Divine Comedy",
        "author": "Dante Alighieri",
        "publisher": "Italy",
        "summary": "Epic poem describing Dante's journey through Hell, Purgatory, and Paradise",
        "genre": "Epic",
        "year_of_publishing": 1320
    },
    {
        "title": "Don Quixote",
        "author": "Miguel de Cervantes",
        "publisher": "Francisco de Robles",
        "summary": "The adventures of a nobleman who becomes a knight-errant",
        "genre": "Fiction",
        "year_of_publishing": 1605
    },
    {
        "title": "The Count of Monte Cristo",
        "author": "Alexandre Dumas",
        "publisher": "France",
        "summary": "Epic tale of wrongful imprisonment and revenge",
        "genre": "Adventure",
        "year_of_publishing": 1844
    },
    {
        "title": "Les Misérables",
        "author": "Victor Hugo",
        "publisher": "A. Lacroix, Verboeckhoven & Cie",
        "summary": "Story of redemption and revolution in 19th century France",
        "genre": "Historical Fiction",
        "year_of_publishing": 1862
    },
    {
        "title": "The Three Musketeers",
        "author": "Alexandre Dumas",
        "publisher": "France",
        "summary": "Swashbuckling adventure of d'Artagnan and his musketeer friends",
        "genre": "Adventure",
        "year_of_publishing": 1844
    },
    {
        "title": "Frankenstein",
        "author": "Mary Shelley",
        "publisher": "Lackington, Hughes, Harding, Mavor & Jones",
        "summary": "Gothic novel about a scientist who creates a living creature",
        "genre": "Horror",
        "year_of_publishing": 1818
    },
    {
        "title": "Dracula",
        "author": "Bram Stoker",
        "publisher": "Archibald Constable and Company",
        "summary": "Gothic horror novel about the vampire Count Dracula",
        "genre": "Horror",
        "year_of_publishing": 1897
    },
    {
        "title": "The Picture of Dorian Gray",
        "author": "Oscar Wilde",
        "publisher": "Ward, Lock and Company",
        "summary": "A young man's portrait ages while he remains youthful",
        "genre": "Fiction",
        "year_of_publishing": 1890
    },
    {
        "title": "The Adventures of Sherlock Holmes",
        "author": "Arthur Conan Doyle",
        "publisher": "George Newnes",
        "summary": "Collection of detective stories featuring the brilliant Sherlock Holmes",
        "genre": "Mystery",
        "year_of_publishing": 1892
    },
    {
        "title": "The Metamorphosis",
        "author": "Franz Kafka",
        "publisher": "Kurt Wolff Verlag",
        "summary": "A man wakes up transformed into a giant insect",
        "genre": "Fiction",
        "year_of_publishing": 1915
    },
    {
        "title": "One Hundred Years of Solitude",
        "author": "Gabriel García Márquez",
        "publisher": "Harper & Row",
        "summary": "Multi-generational story of the Buendía family in Macondo",
        "genre": "Magical Realism",
        "year_of_publishing": 1967
    },
    {
        "title": "The Alchemist",
        "author": "Paulo Coelho",
        "publisher": "HarperCollins",
        "summary": "A shepherd's journey to find treasure and discover his destiny",
        "genre": "Fiction",
        "year_of_publishing": 1988
    },
    {
        "title": "The Kite Runner",
        "author": "Khaled Hosseini",
        "publisher": "Riverhead Books",
        "summary": "Story of friendship and redemption in Afghanistan",
        "genre": "Fiction",
        "year_of_publishing": 2003
    },
    {
        "title": "Life of Pi",
        "author": "Yann Martel",
        "publisher": "Knopf Canada",
        "summary": "A boy survives 227 days at sea with a Bengal tiger",
        "genre": "Adventure",
        "year_of_publishing": 2001
    },
    {
        "title": "The Book Thief",
        "author": "Markus Zusak",
        "publisher": "Picador",
        "summary": "A girl finds solace in stealing books during WWII Germany",
        "genre": "Historical Fiction",
        "year_of_publishing": 2005
    },
    {
        "title": "The Handmaid's Tale",
        "author": "Margaret Atwood",
        "publisher": "McClelland and Stewart",
        "summary": "Dystopian novel about a totalitarian theocratic state",
        "genre": "Science Fiction",
        "year_of_publishing": 1985
    },
    {
        "title": "Slaughterhouse-Five",
        "author": "Kurt Vonnegut",
        "publisher": "Delacorte",
        "summary": "Anti-war novel about Billy Pilgrim's experiences in WWII",
        "genre": "Science Fiction",
        "year_of_publishing": 1969
    },
    {
        "title": "Catch-22",
        "author": "Joseph Heller",
        "publisher": "Simon & Schuster",
        "summary": "Satirical novel set during World War II",
        "genre": "Fiction",
        "year_of_publishing": 1961
    },
    {
        "title": "The Grapes of Wrath",
        "author": "John Steinbeck",
        "publisher": "The Viking Press",
        "summary": "The Joad family's struggle during the Great Depression",
        "genre": "Fiction",
        "year_of_publishing": 1939
    },
    {
        "title": "Of Mice and Men",
        "author": "John Steinbeck",
        "publisher": "Covici Friede",
        "summary": "Two displaced migrant workers during the Great Depression",
        "genre": "Fiction",
        "year_of_publishing": 1937
    },
    {
        "title": "The Old Man and the Sea",
        "author": "Ernest Hemingway",
        "publisher": "Charles Scribner's Sons",
        "summary": "An aging fisherman's epic struggle with a giant marlin",
        "genre": "Fiction",
        "year_of_publishing": 1952
    },
    {
        "title": "A Farewell to Arms",
        "author": "Ernest Hemingway",
        "publisher": "Scribner",
        "summary": "Love story set against the backdrop of WWI",
        "genre": "Romance",
        "year_of_publishing": 1929
    },
    {
        "title": "The Sun Also Rises",
        "author": "Ernest Hemingway",
        "publisher": "Scribner",
        "summary": "Post-WWI disillusionment of the Lost Generation",
        "genre": "Fiction",
        "year_of_publishing": 1926
    },
    {
        "title": "Lord of the Flies",
        "author": "William Golding",
        "publisher": "Faber and Faber",
        "summary": "Boys stranded on an island descend into savagery",
        "genre": "Fiction",
        "year_of_publishing": 1954
    },
    {
        "title": "Fahrenheit 451",
        "author": "Ray Bradbury",
        "publisher": "Ballantine Books",
        "summary": "Dystopian future where books are outlawed and burned",
        "genre": "Science Fiction",
        "year_of_publishing": 1953
    },
    {
        "title": "The Stranger",
        "author": "Albert Camus",
        "publisher": "Gallimard",
        "summary": "A man's existential crisis after committing murder",
        "genre": "Fiction",
        "year_of_publishing": 1942
    },
    {
        "title": "The Trial",
        "author": "Franz Kafka",
        "publisher": "Verlag Die Schmiede",
        "summary": "A man is arrested and prosecuted by a mysterious authority",
        "genre": "Fiction",
        "year_of_publishing": 1925
    },
    {
        "title": "Beloved",
        "author": "Toni Morrison",
        "publisher": "Alfred A. Knopf",
        "summary": "The legacy of slavery told through a haunting story",
        "genre": "Fiction",
        "year_of_publishing": 1987
    },
    {
        "title": "The Color Purple",
        "author": "Alice Walker",
        "publisher": "Harcourt Brace Jovanovich",
        "summary": "African-American women's struggles in the early 20th century South",
        "genre": "Fiction",
        "year_of_publishing": 1982
    },
    {
        "title": "Their Eyes Were Watching God",
        "author": "Zora Neale Hurston",
        "publisher": "J.B. Lippincott & Co.",
        "summary": "A woman's journey to self-discovery in the American South",
        "genre": "Fiction",
        "year_of_publishing": 1937
    },
    {
        "title": "Invisible Man",
        "author": "Ralph Ellison",
        "publisher": "Random House",
        "summary": "An African American man's search for identity",
        "genre": "Fiction",
        "year_of_publishing": 1952
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
            # Add random number of copies (1-10) for each book
            total_copies = random.randint(1, 10)
            inventory_data = {
                "book_id": book_id,
                "total_copies": total_copies,
                "borrowed_copies": 0
            }

            response = requests.post(
                f"{BASE_URL}/inventory/",
                json=inventory_data,
                headers=headers
            )

            if response.status_code == 201:
                print(f"✓ Added inventory for Book ID {book_id}: {total_copies} copies")
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
    print("Library Sample Data Setup - 50 Classic Books")
    print("=" * 60)

    if len(sys.argv) < 2:
        print("Usage: python add_sample_data.py <access_token> [api_url]")
        print("\nHow to get your access token:")
        print("1. Login to your app (Railway or local)")
        print("2. Open browser DevTools (F12) → Application → Cookies")
        print("3. Copy the 'access_token' value")
        print("4. Run: python add_sample_data.py YOUR_TOKEN")
        print("\nFor Railway deployment:")
        print("  python add_sample_data.py YOUR_TOKEN https://your-app.railway.app")
        print("\nFor local development:")
        print("  python add_sample_data.py YOUR_TOKEN http://localhost:8000")
        print("\nOr set API_URL environment variable:")
        print("  export API_URL=https://your-app.railway.app")
        print("  python add_sample_data.py YOUR_TOKEN")
        sys.exit(1)

    token = sys.argv[1]

    # Allow overriding BASE_URL via command line
    global BASE_URL
    if len(sys.argv) > 2:
        BASE_URL = sys.argv[2].rstrip('/')

    print(f"\nUsing API URL: {BASE_URL}")
    print("=" * 60)

    # Add books
    book_ids = add_books(token)

    if book_ids:
        # Add inventory for books
        add_inventory(token, book_ids)

        # List all books
        list_books(token)

        print("=" * 60)
        print("✓ Setup complete! 50 books added to your library!")
        print("\nNext steps:")
        print(f"  - Visit {BASE_URL}/docs to explore the API")
        print(f"  - Visit {BASE_URL}/ to browse books in the frontend")
        print("  - Try borrowing books through the UI")
    else:
        print("No books were added. Please check your token and try again.")


if __name__ == "__main__":
    main()
