# Frontend Setup Guide

This guide will help you set up and run the Next.js frontend for the Library Management System.

## Prerequisites

- Node.js 18.x or higher
- npm or yarn package manager
- Backend FastAPI server running (see README.md)

## Installation

### 1. Install Dependencies

Navigate to the frontend directory and install the required packages:

```bash
cd frontend
npm install
```

This will install:
- Next.js 14.2.0
- React 18.3.1
- Tailwind CSS
- shadcn/ui components (via Radix UI)
- Lucide icons
- TypeScript

### 2. Verify Installation

After installation completes, verify that `node_modules` directory was created:

```bash
ls -la
# You should see a node_modules directory
```

## Running the Frontend

### Development Server

From the `frontend` directory, run:

```bash
npm run dev
```

The frontend will start on `http://localhost:3000` by default.

You should see output similar to:
```
  ▲ Next.js 14.2.0
  - Local:        http://localhost:3000
  - Ready in 2.3s
```

### Alternative Port

If port 3000 is already in use, you can specify a different port:

```bash
npm run dev -- -p 3001
```

## Running Backend and Frontend Together

To run the complete application, you need both servers running:

### Option 1: Two Terminal Windows

**Terminal 1 - Backend:**
```bash
# From project root
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 - Frontend:**
```bash
# From project root
cd frontend
npm run dev
```

### Option 2: Background Processes (Unix/Mac)

```bash
# From project root

# Start backend in background
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Start frontend in background
cd frontend
npm run dev &
FRONTEND_PID=$!

# To stop both servers later:
# kill $BACKEND_PID $FRONTEND_PID
```

## Accessing the Application

Once both servers are running:

1. **Frontend UI**: Open `http://localhost:3000` in your browser
2. **Backend API**: Available at `http://localhost:8000`
3. **API Documentation**: Visit `http://localhost:8000/docs`

## Application Flow

### First Time Setup

1. Navigate to `http://localhost:3000`
2. Click "Sign in with Google" button
3. Complete Google OAuth authentication
4. You'll be automatically redirected to the Dashboard

**Note**: If you're already logged in and visit the home page, you'll be automatically redirected to the Dashboard.

### Using the Application

- **Dashboard** (`/dashboard`): View your profile and quick navigation
- **Browse Books** (`/books`): Search and view all library books
- **Borrow Books**: Click "Borrow" button on available books

### Authentication Details

The application uses HTTP-only cookies for authentication:
- After Google OAuth login, the backend sets a secure cookie
- The cookie is automatically included in all API requests
- If you visit the home page while logged in, you're redirected to the dashboard
- Logout clears the authentication cookie

## Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Landing page (Google login)
│   │   ├── dashboard/
│   │   │   └── page.tsx          # User dashboard
│   │   ├── books/
│   │   │   └── page.tsx          # Books listing and search
│   │   ├── layout.tsx            # Root layout
│   │   └── globals.css           # Global styles
│   ├── components/
│   │   └── ui/                   # shadcn/ui components
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── input.tsx
│   │       ├── table.tsx
│   │       └── badge.tsx
│   ├── lib/
│   │   ├── api.ts                # API client for backend
│   │   └── utils.ts              # Utility functions
├── public/                       # Static assets
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript config
├── tailwind.config.ts            # Tailwind CSS config
├── postcss.config.mjs            # PostCSS config
└── next.config.mjs               # Next.js config
```

## API Integration

The frontend communicates with the FastAPI backend through the API client located at `src/lib/api.ts`.

### Available API Methods

```typescript
// Authentication
api.auth.loginWithGoogle()        // Redirect to Google OAuth
api.auth.logout()                 // Logout current user
api.auth.getCurrentUser()         // Get current user info

// Books
api.books.list()                  // List all books
api.books.search({ title, author }) // Search books
api.books.getById(id)             // Get single book
api.books.create(book)            // Create book (librarian only)
api.books.update(id, book)        // Update book (librarian only)
api.books.delete(id)              // Delete book (librarian only)

// Inventory
api.inventory.getByBookId(id)    // Get inventory for book
api.inventory.create(inventory)   // Create inventory (librarian only)
api.inventory.update(id, inventory) // Update inventory (librarian only)

// Borrow
api.borrow.borrowBook(bookId)    // Borrow a book
api.borrow.returnBook(bookId)    // Return a book
api.borrow.getMyRecords()        // Get user's borrow records
```

## Building for Production

To create a production build:

```bash
npm run build
```

This will generate an optimized build in the `.next` directory.

To run the production build:

```bash
npm run start
```

## Troubleshooting

### Port Already in Use

If you see "Port 3000 is already in use":
```bash
# Use a different port
npm run dev -- -p 3001

# Or kill the process using port 3000
lsof -ti:3000 | xargs kill -9
```

### CORS Errors

If you see CORS errors in the browser console:

1. Verify the backend is running on `http://localhost:8000`
2. Check that CORS is configured in `app/main.py` to allow `http://localhost:3000`
3. Ensure cookies are enabled in your browser

### Authentication Not Working

If authentication redirects fail:

1. Verify Google OAuth credentials in backend `.env` file
2. Check that the redirect URI is registered in Google Cloud Console
3. Visit `http://localhost:8000/debug/oauth-config` to see the exact redirect URI
4. Clear browser cookies and try again

### Module Not Found Errors

If you see "Module not found" errors:

```bash
# Delete node_modules and reinstall
rm -rf node_modules
rm package-lock.json
npm install
```

## Development Tips

### Hot Reloading

Next.js automatically reloads the page when you save changes to files. If this stops working:

```bash
# Restart the dev server
# Press Ctrl+C to stop, then run:
npm run dev
```

### TypeScript Errors

Check for TypeScript errors without running the dev server:

```bash
npm run build
```

### Component Library

This project uses shadcn/ui components. To add more components:

```bash
# Example: adding a new component
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add dropdown-menu
```

Available components: https://ui.shadcn.com/docs/components

## Next Steps

- [ ] Implement "My Borrowed Books" page
- [ ] Add librarian/admin management interface
- [ ] Create book detail modal/page
- [ ] Add pagination for book listing
- [ ] Implement user profile page
- [ ] Add notifications/toast messages
- [ ] Create mobile-responsive navigation

## Support

For issues:
1. Check the backend logs (`uvicorn` terminal)
2. Check the browser console for frontend errors
3. Verify both servers are running
4. Review this guide and README.md

## Environment Variables

Currently, the API URL is hardcoded to `http://localhost:8000`. For production or different environments, you can:

1. Create a `.env.local` file in the `frontend` directory:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

2. Update `src/lib/api.ts` to use the environment variable:
   ```typescript
   private baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
   ```

**Note**: Environment variables prefixed with `NEXT_PUBLIC_` are exposed to the browser.
