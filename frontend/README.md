# Library Management System - Frontend

Next.js 14 frontend application for the Library Management System.

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Visit `http://localhost:3000`

## Prerequisites

- Node.js 18.x or higher
- Backend API running on `http://localhost:8000`

## Available Scripts

- `npm run dev` - Start development server (port 3000)
- `npm run build` - Build for production
- `npm run start` - Run production build
- `npm run lint` - Run ESLint

## Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - Component library
- **Radix UI** - Accessible components
- **Lucide Icons** - Icon library

## Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── page.tsx           # Landing page
│   │   ├── dashboard/         # Dashboard page
│   │   ├── books/             # Books listing page
│   │   ├── layout.tsx         # Root layout
│   │   └── globals.css        # Global styles
│   ├── components/
│   │   └── ui/                # shadcn/ui components
│   ├── lib/
│   │   ├── api.ts             # API client
│   │   └── utils.ts           # Utilities
├── public/                    # Static files
└── package.json               # Dependencies
```

## Pages

- `/` - Landing page with Google OAuth login
- `/dashboard` - User dashboard with navigation
- `/books` - Browse and search books, borrow functionality

## API Integration

The frontend communicates with the FastAPI backend through the API client (`src/lib/api.ts`).

**Base URL:** `http://localhost:8000`

Example usage:
```typescript
import { api } from '@/lib/api';

// Get all books
const books = await api.books.list();

// Search books
const results = await api.books.search({ title: 'gatsby' });

// Borrow a book
await api.borrow.borrowBook(bookId);
```

## Authentication

Uses Google OAuth via the backend:
1. User clicks "Sign in with Google" on landing page
2. Redirects to backend OAuth endpoint
3. Backend handles OAuth flow and sets HTTP-only cookie
4. User is redirected back to frontend dashboard

The API client automatically includes credentials in requests.

## Development

### Adding New Components

```bash
# Use shadcn/ui CLI to add components
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add dropdown-menu
```

Browse available components: https://ui.shadcn.com/docs/components

### Hot Reload

Next.js automatically reloads when you save changes. If it stops working, restart the dev server.

### Type Checking

TypeScript types are defined in `src/lib/api.ts` for all API responses.

## Building for Production

```bash
# Create optimized build
npm run build

# Run production server
npm run start
```

The build output will be in the `.next` directory.

## Environment Variables

To customize the API URL, create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Then update `src/lib/api.ts` to use it:
```typescript
private baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
```

## Troubleshooting

### Port 3000 in use
```bash
npm run dev -- -p 3001
```

### Authentication fails
- Ensure backend is running
- Check Google OAuth is configured in backend
- Clear browser cookies

### CORS errors
- Verify backend CORS allows `http://localhost:3000`
- Check `app/main.py` CORS configuration

### Module not found
```bash
rm -rf node_modules package-lock.json
npm install
```

## Documentation

For detailed setup and deployment instructions, see:
- [FRONTEND_SETUP.md](../FRONTEND_SETUP.md) - Complete setup guide
- [README.md](../README.md) - Main project documentation

## Support

For issues, check:
1. Backend logs (uvicorn terminal)
2. Browser console for errors
3. Both servers are running
4. Network tab for API calls
