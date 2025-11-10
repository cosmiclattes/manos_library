'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, type Book } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, BookOpen, LogOut, Home, Loader2 } from 'lucide-react';
import { Pagination } from '@/components/ui/pagination';
import { useToast } from '@/hooks/useToast';
import { Toast } from '@/components/ui/toast';

export default function BooksPage() {
  const router = useRouter();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTitle, setSearchTitle] = useState('');
  const [searchAuthor, setSearchAuthor] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Toast notifications
  const { toasts, showToast, hideToast } = useToast();

  // Button loading states
  const [borrowingBookId, setBorrowingBookId] = useState<number | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.books.list();
      setBooks(data);
      setCurrentPage(1); // Reset to first page
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load books');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTitle && !searchAuthor) {
      loadBooks();
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await api.books.search({
        title: searchTitle || undefined,
        author: searchAuthor || undefined,
      });
      setBooks(data);
      setCurrentPage(1); // Reset to first page
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleBorrow = async (bookId: number) => {
    try {
      setBorrowingBookId(bookId);
      await api.borrow.borrowBook(bookId);
      showToast('Book borrowed successfully!', 'success');
      loadBooks(); // Refresh the list
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to borrow book', 'error');
    } finally {
      setBorrowingBookId(null);
    }
  };

  const handleLogout = async () => {
    try {
      await api.auth.logout();
      window.location.href = '/';
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  // Calculate pagination
  const totalPages = Math.ceil(books.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedBooks = books.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast Notifications */}
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => hideToast(toast.id)}
        />
      ))}

      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-gray-900">Library Books</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push('/dashboard')}>
              <Home className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Search Books</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 flex-wrap">
              <Input
                placeholder="Search by title..."
                value={searchTitle}
                onChange={(e) => setSearchTitle(e.target.value)}
                className="flex-1 min-w-[200px]"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Input
                placeholder="Search by author..."
                value={searchAuthor}
                onChange={(e) => setSearchAuthor(e.target.value)}
                className="flex-1 min-w-[200px]"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch}>
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTitle('');
                  setSearchAuthor('');
                  loadBooks();
                }}
              >
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-600">{error}</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>
              All Books ({books.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : books.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No books found. Try a different search.
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Author</TableHead>
                      <TableHead>Genre</TableHead>
                      <TableHead>Year</TableHead>
                      <TableHead>Available</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedBooks.map((book) => (
                    <TableRow key={book.id}>
                      <TableCell
                        className="font-medium cursor-pointer hover:text-primary transition-colors"
                        onClick={() => router.push(`/book-detail?id=${book.id}`)}
                      >
                        {book.title}
                      </TableCell>
                      <TableCell>{book.author}</TableCell>
                      <TableCell>
                        {book.genre && (
                          <Badge variant="secondary">{book.genre}</Badge>
                        )}
                      </TableCell>
                      <TableCell>{book.year_of_publishing}</TableCell>
                      <TableCell>
                        {book.available_copies !== undefined ? (
                          <Badge
                            variant={
                              book.available_copies > 0 ? 'success' : 'destructive'
                            }
                          >
                            {book.available_copies > 0
                              ? `${book.available_copies} available`
                              : 'Not available'}
                          </Badge>
                        ) : (
                          <Badge variant="outline">No inventory</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {book.is_borrowed_by_user ? (
                          <Badge variant="secondary">Already Borrowed</Badge>
                        ) : !book.in_circulation ? (
                          <Badge variant="outline">Not Available</Badge>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleBorrow(book.id)}
                            disabled={
                              borrowingBookId === book.id ||
                              !book.available_copies ||
                              book.available_copies <= 0
                            }
                            className="transition-all hover:scale-105 active:scale-95"
                          >
                            {borrowingBookId === book.id ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Borrowing...
                              </>
                            ) : (
                              'Borrow'
                            )}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                <div className="mt-4">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    totalItems={books.length}
                    itemsPerPage={itemsPerPage}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
