'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, type Book, type User } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, BookOpen, LogOut, Library, ArrowLeft } from 'lucide-react';

type View = 'all-books' | 'borrowed-books';

interface BorrowedBookDetails {
  id: number;
  book_id: number;
  borrow_count: number;
  book?: Book;
}

export default function MemberDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [borrowedBooks, setBorrowedBooks] = useState<BorrowedBookDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<View>('all-books');
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUser();
    loadBooks();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await api.auth.getCurrentUser();
      setUser(userData);
    } catch (err) {
      router.push('/');
    }
  };

  const loadBooks = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.books.list();
      // Sort by ID descending (latest first)
      const sortedBooks = data.sort((a, b) => b.id - a.id);
      setBooks(sortedBooks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load books');
    } finally {
      setLoading(false);
    }
  };

  const loadBorrowedBooks = async () => {
    try {
      setLoading(true);
      setError(null);
      const records = await api.borrow.getMyBooks();

      // Fetch book details for each borrowed book
      const booksWithDetails = await Promise.all(
        records.map(async (record) => {
          try {
            const book = await api.books.get(record.book_id);
            return { ...record, book };
          } catch (err) {
            console.error(`Failed to load book ${record.book_id}:`, err);
            return record;
          }
        })
      );

      setBorrowedBooks(booksWithDetails);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load borrowed books');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadBooks();
      return;
    }

    try {
      setLoading(true);
      setError(null);
      // Search in both title and author
      const data = await api.books.search({
        title: searchQuery,
        author: searchQuery,
      });
      // Sort by ID descending (latest first)
      const sortedBooks = data.sort((a, b) => b.id - a.id);
      setBooks(sortedBooks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleBorrow = async (bookId: number) => {
    try {
      await api.borrow.borrowBook(bookId);
      alert('Book borrowed successfully!');
      loadBooks();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to borrow book');
    }
  };

  const handleReturn = async (bookId: number) => {
    try {
      await api.borrow.returnBook(bookId);
      alert('Book returned successfully!');
      loadBorrowedBooks();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to return book');
    }
  };

  const handleLogout = async () => {
    try {
      await api.auth.logout();
      router.push('/');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const handleViewChange = (view: View) => {
    setCurrentView(view);
    if (view === 'borrowed-books') {
      loadBorrowedBooks();
    } else {
      loadBooks();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md border-r flex flex-col">
        <div className="p-6 border-b">
          <div className="flex items-center gap-2 mb-2">
            <Library className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Library</h2>
          </div>
          <p className="text-sm text-gray-600">{user?.name}</p>
          <Badge variant="outline" className="mt-2">
            {user?.user_type.replace('_', ' ')}
          </Badge>
        </div>

        <nav className="flex-1 p-4">
          <button
            onClick={() => handleViewChange('all-books')}
            className={`w-full text-left px-4 py-3 rounded-lg mb-2 flex items-center gap-3 transition-colors ${
              currentView === 'all-books'
                ? 'bg-blue-50 text-blue-700 font-medium'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <BookOpen className="h-5 w-5" />
            All Books
          </button>

          <button
            onClick={() => handleViewChange('borrowed-books')}
            className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${
              currentView === 'borrowed-books'
                ? 'bg-blue-50 text-blue-700 font-medium'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Library className="h-5 w-5" />
            Borrowed Books
          </button>
        </nav>

        <div className="p-4 border-t space-y-2">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => router.push('/dashboard')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <Button variant="outline" className="w-full" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto px-8 py-8">
          {currentView === 'all-books' ? (
            <>
              {/* Search Section */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">
                  Browse Books
                </h1>
                <div className="flex gap-4 max-w-2xl">
                  <Input
                    placeholder="Search by title or author..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="flex-1"
                  />
                  <Button onClick={handleSearch}>
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </Button>
                  {searchQuery && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchQuery('');
                        loadBooks();
                      }}
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <Card className="mb-6 border-red-200 bg-red-50">
                  <CardContent className="pt-6">
                    <p className="text-red-600">{error}</p>
                  </CardContent>
                </Card>
              )}

              {/* Books List */}
              {loading ? (
                <div className="text-center py-12 text-gray-500">Loading...</div>
              ) : books.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No books found. Try a different search.
                </div>
              ) : (
                <div className="grid gap-4">
                  {books.map((book) => (
                    <Card
                      key={book.id}
                      className="hover:shadow-md transition-shadow"
                    >
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                              {book.title}
                            </h3>
                            <p className="text-gray-600 mb-2">
                              by {book.author}
                            </p>
                            {book.summary && (
                              <p className="text-gray-500 text-sm mb-3">
                                {book.summary}
                              </p>
                            )}
                            <div className="flex gap-2 flex-wrap">
                              {book.genre && (
                                <Badge variant="secondary">{book.genre}</Badge>
                              )}
                              {book.year_of_publishing && (
                                <Badge variant="outline">
                                  {book.year_of_publishing}
                                </Badge>
                              )}
                              {book.publisher && (
                                <Badge variant="outline">
                                  {book.publisher}
                                </Badge>
                              )}
                              {book.available_copies !== undefined && (
                                <Badge
                                  variant={
                                    book.available_copies > 0
                                      ? 'default'
                                      : 'destructive'
                                  }
                                >
                                  {book.available_copies > 0
                                    ? `${book.available_copies} available`
                                    : 'Not available'}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="ml-4">
                            <Button
                              onClick={() => handleBorrow(book.id)}
                              disabled={
                                !book.available_copies ||
                                book.available_copies <= 0
                              }
                            >
                              Borrow
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              {/* Borrowed Books Section */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  My Borrowed Books
                </h1>
                <p className="text-gray-600">
                  Books you currently have borrowed from the library
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <Card className="mb-6 border-red-200 bg-red-50">
                  <CardContent className="pt-6">
                    <p className="text-red-600">{error}</p>
                  </CardContent>
                </Card>
              )}

              {/* Borrowed Books List */}
              {loading ? (
                <div className="text-center py-12 text-gray-500">Loading...</div>
              ) : borrowedBooks.length === 0 ? (
                <Card>
                  <CardContent className="py-12">
                    <div className="text-center text-gray-500">
                      <BookOpen className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg mb-2">No borrowed books</p>
                      <p className="text-sm">
                        Browse the library and borrow a book to get started!
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {borrowedBooks.map((record) => (
                    <Card
                      key={record.id}
                      className="hover:shadow-md transition-shadow"
                    >
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                              {record.book?.title || 'Loading...'}
                            </h3>
                            <p className="text-gray-600 mb-2">
                              by {record.book?.author || 'Loading...'}
                            </p>
                            {record.book?.summary && (
                              <p className="text-gray-500 text-sm mb-3">
                                {record.book.summary}
                              </p>
                            )}
                            <div className="flex gap-2 flex-wrap">
                              {record.book?.genre && (
                                <Badge variant="secondary">
                                  {record.book.genre}
                                </Badge>
                              )}
                              {record.book?.year_of_publishing && (
                                <Badge variant="outline">
                                  {record.book.year_of_publishing}
                                </Badge>
                              )}
                              <Badge variant="default">
                                Borrowed {record.borrow_count}{' '}
                                {record.borrow_count === 1 ? 'time' : 'times'}
                              </Badge>
                            </div>
                          </div>
                          <div className="ml-4">
                            <Button
                              variant="outline"
                              onClick={() => handleReturn(record.book_id)}
                            >
                              Return Book
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
