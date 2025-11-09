// API client for FastAPI backend

// In production (static build served by FastAPI), use same origin (empty string)
// In development, use localhost:8000
const getApiUrl = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;

  console.log('=== API URL Configuration ===');
  console.log('NEXT_PUBLIC_API_URL:', envUrl);
  console.log('window.location.hostname:', typeof window !== 'undefined' ? window.location.hostname : 'N/A');

  // If set to special value "SAME_ORIGIN", use empty string for same-origin requests
  if (envUrl === 'SAME_ORIGIN') {
    console.log('Using SAME_ORIGIN mode - returning empty string');
    return '';
  }

  // If explicitly set, use it
  if (envUrl) {
    console.log('Using explicit env URL:', envUrl);
    return envUrl;
  }

  // Development fallback: use localhost if running on localhost
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    console.log('Running on localhost - using http://localhost:8000');
    return 'http://localhost:8000';
  }

  // Default: same-origin requests
  console.log('Using default - empty string for same-origin');
  return '';
};

const API_URL = getApiUrl();
console.log('Final API_URL:', API_URL);
console.log('=============================');

export interface Book {
  id: number;
  title: string;
  author: string;
  publisher?: string;
  summary?: string;
  genre?: string;
  year_of_publishing?: number;
  inventory?: {
    id: number;
    book_id: number;
    total_copies: number;
    borrowed_copies: number;
  };
  available_copies?: number;
}

export interface User {
  id: number;
  name: string;
  email: string;
  user_type: 'member' | 'librarian' | 'super_admin';
  google_id?: string;
}

export interface BorrowRecord {
  id: number;
  user_id: number;
  book_id: number;
  borrow_count: number;
  delete_entry: boolean;
}

class APIClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const config: RequestInit = {
      ...options,
      credentials: 'include', // Send cookies
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'An error occurred' }));
      throw new Error(error.detail || `HTTP error! status: ${response.status}`);
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  // Auth endpoints
  auth = {
    loginWithGoogle: () => {
      window.location.href = `${this.baseURL}/auth/login/google`;
    },

    logout: () => this.request<{ message: string }>('/auth/logout', {
      method: 'POST',
    }),

    getCurrentUser: () => this.request<User>('/auth/me'),
  };

  // Books endpoints
  books = {
    list: (params?: { skip?: number; limit?: number; genre?: string }) => {
      const queryParams = new URLSearchParams();
      if (params?.skip !== undefined) queryParams.append('skip', params.skip.toString());
      if (params?.limit !== undefined) queryParams.append('limit', params.limit.toString());
      if (params?.genre) queryParams.append('genre', params.genre);

      const query = queryParams.toString();
      return this.request<Book[]>(`/books/${query ? `?${query}` : ''}`);
    },

    search: (params: { title?: string; author?: string; skip?: number; limit?: number }) => {
      const queryParams = new URLSearchParams();
      if (params.title) queryParams.append('title', params.title);
      if (params.author) queryParams.append('author', params.author);
      if (params.skip !== undefined) queryParams.append('skip', params.skip.toString());
      if (params.limit !== undefined) queryParams.append('limit', params.limit.toString());

      return this.request<Book[]>(`/books/search/?${queryParams.toString()}`);
    },

    get: (id: number) => this.request<Book>(`/books/${id}`),

    create: (book: Omit<Book, 'id' | 'inventory' | 'available_copies'>) =>
      this.request<Book>('/books/', {
        method: 'POST',
        body: JSON.stringify(book),
      }),

    update: (id: number, book: Partial<Omit<Book, 'id' | 'inventory' | 'available_copies'>>) =>
      this.request<Book>(`/books/${id}`, {
        method: 'PUT',
        body: JSON.stringify(book),
      }),

    delete: (id: number) =>
      this.request<void>(`/books/${id}`, {
        method: 'DELETE',
      }),
  };

  // Inventory endpoints
  inventory = {
    create: (data: { book_id: number; total_copies: number; borrowed_copies: number }) =>
      this.request('/inventory/', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (bookId: number, data: { total_copies?: number; borrowed_copies?: number }) =>
      this.request(`/inventory/${bookId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    get: (bookId: number) => this.request(`/inventory/${bookId}`),
  };

  // Borrow endpoints
  borrow = {
    borrowBook: (bookId: number) =>
      this.request<BorrowRecord>('/borrow/', {
        method: 'POST',
        body: JSON.stringify({ book_id: bookId }),
      }),

    returnBook: (bookId: number) =>
      this.request<BorrowRecord>(`/borrow/return/${bookId}`, {
        method: 'POST',
      }),

    getMyBooks: () => this.request<BorrowRecord[]>('/borrow/my-books'),

    getHistory: () => this.request<BorrowRecord[]>('/borrow/history'),
  };
}

export const api = new APIClient(API_URL);
