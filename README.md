# Library Management System

A comprehensive library management web application built with FastAPI, SQLAlchemy, and PostgreSQL, featuring Google SSO authentication.

## Features

- **Modern Web UI**: Beautiful, responsive Next.js frontend with shadcn/ui components
- **User Management**: Three user types (Super Admin, Librarian, Member) with role-based access control
- **Book Management**: Create, edit, and list books (Librarian access required)
- **Book Search**: Search books by title or author with partial matching
- **Inventory Management**: Track book copies and availability (Librarian access required)
- **Borrow/Return System**: Users can borrow and return books with automatic inventory updates
- **Google SSO**: Secure authentication using Google OAuth
- **Database Migrations**: Version-controlled database changes using Alembic
- **RESTful API**: Comprehensive FastAPI backend with auto-generated documentation

## Tech Stack

### Backend
- **FastAPI**: Modern Python web framework
- **SQLAlchemy**: SQL toolkit and ORM
- **PostgreSQL**: Relational database
- **Alembic**: Database migration tool
- **Google OAuth**: Authentication provider
- **Pydantic**: Data validation using Python type annotations

### Frontend
- **Next.js 14**: React framework with App Router
- **React 18**: UI library
- **TypeScript**: Type-safe JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: High-quality React components built on Radix UI
- **Lucide Icons**: Beautiful icon library

## Database Schema

### Tables

1. **libraries**: Store library metadata (name, address)
2. **users**: User information (name, email, type, google_id)
3. **books**: Book metadata (title, author, publisher, summary, genre, year)
4. **book_inventory**: Track book copies (total_copies, borrowed_copies)
5. **borrow_records**: Track borrowing history (user_id, book_id, borrow_count, delete_entry)

## Installation

### Prerequisites

**Backend:**
- Python 3.9 or higher
- PostgreSQL database
- Google Cloud Console account (for OAuth credentials)

**Frontend:**
- Node.js 18.x or higher
- npm or yarn package manager

### Step 1: Clone the Repository

```bash
cd /Users/jeph/PycharmProjects/manos_library
```

### Step 2: Create Virtual Environment

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### Step 3: Install Dependencies

```bash
pip install -r requirements.txt
```

### Step 4: Set Up PostgreSQL

Start PostgreSQL using Docker Compose (automatically creates database and user):

```bash
docker-compose up -d
```

The init script will automatically:
- Create the database `library_db`
- Create user `library_user` with password `library_password`
- Grant all necessary permissions

For custom database configuration, see [DATABASE_SETUP.md](DATABASE_SETUP.md)

### Step 5: Configure Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:8000/auth/callback/google`
5. Copy the Client ID and Client Secret

### Step 6: Environment Configuration

Create a `.env` file from the example:

```bash
cp .env.example .env
```

Edit `.env` and add your configuration:

```env
DATABASE_URL=postgresql://library_user:library_password@localhost:5432/library_db
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
SECRET_KEY=your-secret-key-here-use-openssl-rand-hex-32
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
APP_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000
```

To generate a secure SECRET_KEY:
```bash
openssl rand -hex 32
```

### Step 7: Verify Setup (Optional but Recommended)

```bash
python verify_setup.py
```

This will check:
- Database connection
- User permissions
- Migration status

### Step 8: Initialize Database

Run Alembic migrations:

```bash
# Initialize alembic (first time only)
alembic revision --autogenerate -m "Initial migration"

# Apply migrations
alembic upgrade head
```

### Step 9: Run the Backend Application

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

### Step 10: Set Up Frontend (Optional but Recommended)

For detailed frontend setup instructions, see [FRONTEND_SETUP.md](FRONTEND_SETUP.md)

**Quick Start:**

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

The frontend will be available at `http://localhost:3000`

**Running Both Servers:**

Open two terminal windows:

**Terminal 1 (Backend):**
```bash
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

Then visit `http://localhost:3000` to use the application.

## API Documentation

Once the application is running, visit:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## API Endpoints

### Authentication

- `GET /auth/login/google` - Initiate Google OAuth login
- `GET /auth/callback/google` - OAuth callback endpoint
- `GET /auth/me` - Get current user information

### Books (List: All users, Create/Edit: Librarian only)

- `POST /books/` - Create a new book (Librarian)
- `GET /books/` - List all books with inventory info (All users)
- `GET /books/{book_id}` - Get book details (All users)
- `PUT /books/{book_id}` - Update book information (Librarian)
- `DELETE /books/{book_id}` - Delete a book (Librarian)

### Inventory (Librarian only)

- `POST /inventory/` - Create inventory for a book
- `GET /inventory/` - List all inventory records
- `GET /inventory/{book_id}` - Get inventory for specific book
- `PUT /inventory/{book_id}` - Update inventory
- `DELETE /inventory/{book_id}` - Delete inventory record

### Borrow/Return (All authenticated users)

- `POST /borrow/` - Borrow a book
- `POST /borrow/return/{book_id}` - Return a borrowed book
- `GET /borrow/my-books` - Get currently borrowed books
- `GET /borrow/history` - Get complete borrowing history

## User Roles

- **Member**: Can list books, borrow, and return books
- **Librarian**: All member permissions + create/edit books and manage inventory
- **Super Admin**: All permissions (same as Librarian in current implementation)

## Database Migrations

### Create a new migration

```bash
alembic revision --autogenerate -m "Description of changes"
```

### Apply migrations

```bash
alembic upgrade head
```

### Rollback migration

```bash
alembic downgrade -1
```

### View migration history

```bash
alembic history
```

## Usage Example

### 1. Authenticate with Google

Navigate to `http://localhost:8000/auth/login/google` in your browser and complete the OAuth flow. You'll receive an access token.

### 2. Use the Access Token

In Swagger UI (`http://localhost:8000/docs`), click "Authorize" and enter:
```
Bearer YOUR_ACCESS_TOKEN
```

### 3. Create a Book (as Librarian)

First, you need to manually update a user to be a librarian in the database:

```sql
UPDATE users SET user_type = 'librarian' WHERE email = 'your@email.com';
```

Then use the API:

```bash
curl -X POST "http://localhost:8000/books/" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "The Great Gatsby",
    "author": "F. Scott Fitzgerald",
    "publisher": "Scribner",
    "summary": "A classic American novel",
    "genre": "Fiction",
    "year_of_publishing": 1925
  }'
```

### 4. Add Inventory

```bash
curl -X POST "http://localhost:8000/inventory/" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "book_id": 1,
    "total_copies": 5,
    "borrowed_copies": 0
  }'
```

### 5. Borrow a Book (any user)

```bash
curl -X POST "http://localhost:8000/borrow/" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "book_id": 1
  }'
```

### 6. Return a Book

```bash
curl -X POST "http://localhost:8000/borrow/return/1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Project Structure

```
manos_library/
├── app/                     # Backend FastAPI application
│   ├── __init__.py
│   ├── main.py              # FastAPI application entry point
│   ├── config.py            # Configuration management
│   ├── database.py          # Database connection and session
│   ├── models/
│   │   ├── __init__.py
│   │   └── models.py        # SQLAlchemy models
│   ├── schemas/
│   │   ├── __init__.py
│   │   └── schemas.py       # Pydantic schemas
│   ├── api/
│   │   ├── __init__.py
│   │   ├── auth.py          # Authentication endpoints
│   │   ├── books.py         # Book management endpoints
│   │   ├── inventory.py     # Inventory management endpoints
│   │   └── borrow.py        # Borrow/return endpoints
│   └── dependencies/
│       ├── __init__.py
│       └── auth.py          # Authentication dependencies
├── frontend/                # Next.js frontend application
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx           # Landing page
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx       # User dashboard
│   │   │   ├── books/
│   │   │   │   └── page.tsx       # Books listing
│   │   │   ├── layout.tsx         # Root layout
│   │   │   └── globals.css        # Global styles
│   │   ├── components/
│   │   │   └── ui/                # shadcn/ui components
│   │   └── lib/
│   │       ├── api.ts             # API client
│   │       └── utils.ts           # Utilities
│   ├── public/                    # Static assets
│   ├── package.json               # Frontend dependencies
│   ├── tsconfig.json              # TypeScript config
│   ├── tailwind.config.ts         # Tailwind CSS config
│   └── next.config.mjs            # Next.js config
├── alembic/
│   ├── env.py               # Alembic environment configuration
│   ├── script.py.mako       # Migration template
│   └── versions/            # Migration files (auto-generated)
├── alembic.ini              # Alembic configuration
├── requirements.txt         # Python dependencies
├── docker-compose.yml       # PostgreSQL setup (optional)
├── .env.example             # Environment variables template
├── README.md                # This file
└── FRONTEND_SETUP.md        # Frontend setup guide
```

## Development

### Running Tests

```bash
pytest
```

### Code Formatting

```bash
black app/
```

### Linting

```bash
flake8 app/
```

## Security Considerations

- Always use HTTPS in production
- Keep your SECRET_KEY secure and never commit it to version control
- Regularly update dependencies to patch security vulnerabilities
- Use environment variables for sensitive configuration
- Implement rate limiting for production use
- Add input validation and sanitization

## Future Enhancements

### Frontend
- Add "My Borrowed Books" page to view current loans
- Create librarian/admin management interface for book and inventory management
- Add book detail modal/page with full information
- Implement pagination for book listings
- Add toast notifications for user actions
- Create mobile-responsive navigation menu
- Add user profile page

### Backend
- Add email notifications for due dates and reminders
- Implement fine calculation for overdue books
- Add book reservation system with waiting lists
- Create reporting and analytics endpoints
- Add advanced filtering (by genre, year, availability)
- Implement rate limiting for API endpoints
- Add book categories and tagging system
- Support multi-library management
- Add book cover image uploads

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.

## Support

For issues and questions, please create an issue in the repository.
