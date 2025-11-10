'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, type Book, type User, type LibrarianStats } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Search, BookOpen, Library, ArrowLeft, Plus, Edit, Package, Users, BookMarked, Loader2 } from 'lucide-react';
import TopBar from '@/components/TopBar';
import { Pagination } from '@/components/ui/pagination';
import StatCard from '@/components/StatCard';
import { useToast } from '@/hooks/useToast';
import { Toast } from '@/components/ui/toast';

type View = 'all-books' | 'add-book' | 'users';

interface BookFormData {
  title: string;
  author: string;
  publisher?: string;
  summary?: string;
  genre?: string;
  year_of_publishing?: number;
  in_circulation: boolean;
}

interface InventoryFormData {
  total_copies: number;
  borrowed_copies: number;
}

export default function LibrarianDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<View>('all-books');
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Stats state
  const [stats, setStats] = useState<LibrarianStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Users state
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');

  // Toast notifications
  const { toasts, showToast, hideToast } = useToast();

  // Button loading states
  const [changingRoleUserId, setChangingRoleUserId] = useState<number | null>(null);
  const [addingBook, setAddingBook] = useState(false);
  const [editingBook, setEditingBook] = useState(false);
  const [editingInventory, setEditingInventory] = useState(false);
  const [togglingCirculationId, setTogglingCirculationId] = useState<number | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPage, setUsersPage] = useState(1);
  const itemsPerPage = 10;

  // Dialog states
  const [addBookDialogOpen, setAddBookDialogOpen] = useState(false);
  const [editBookDialogOpen, setEditBookDialogOpen] = useState(false);
  const [editInventoryDialogOpen, setEditInventoryDialogOpen] = useState(false);

  // Form data
  const [bookFormData, setBookFormData] = useState<BookFormData>({
    title: '',
    author: '',
    publisher: '',
    summary: '',
    genre: '',
    year_of_publishing: undefined,
    in_circulation: true,
  });

  const [inventoryFormData, setInventoryFormData] = useState<InventoryFormData>({
    total_copies: 0,
    borrowed_copies: 0,
  });

  const [selectedBook, setSelectedBook] = useState<Book | null>(null);

  useEffect(() => {
    loadUser();
    loadBooks();
    loadStats();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await api.auth.getCurrentUser();
      setUser(userData);

      // Redirect non-librarians
      if (userData.user_type !== 'librarian' && userData.user_type !== 'super_admin') {
        router.push('/dashboard');
      }
    } catch (err) {
      router.push('/');
    }
  };

  const loadStats = async () => {
    try {
      setStatsLoading(true);
      const data = await api.stats.getLibrarianStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      setUsersLoading(true);
      setError(null);
      const data = await api.users.list();
      setUsers(data);
      setUsersPage(1); // Reset to first page
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setUsersLoading(false);
    }
  };

  const handleUserSearch = async () => {
    if (!userSearchQuery.trim()) {
      loadUsers();
      return;
    }

    try {
      setUsersLoading(true);
      setError(null);
      const data = await api.users.list({ search: userSearchQuery });
      setUsers(data);
      setUsersPage(1); // Reset to first page
    } catch (err) {
      setError(err instanceof Error ? err.message : 'User search failed');
    } finally {
      setUsersLoading(false);
    }
  };

  const handleUserRoleChange = async (userId: number, newRole: 'member' | 'librarian') => {
    try {
      setChangingRoleUserId(userId);
      await api.users.updateRole(userId, newRole);
      showToast('User role updated successfully!', 'success');
      loadUsers(); // Refresh the list
      loadStats(); // Refresh stats
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update user role', 'error');
    } finally {
      setChangingRoleUserId(null);
    }
  };

  const handleToggleCirculation = async (bookId: number, currentStatus: boolean) => {
    try {
      setTogglingCirculationId(bookId);
      await api.books.toggleCirculation(bookId);
      const statusText = currentStatus ? 'removed from' : 'added to';
      showToast(`Book ${statusText} circulation successfully!`, 'success');
      loadBooks(); // Refresh the list
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update circulation status', 'error');
    } finally {
      setTogglingCirculationId(null);
    }
  };

  const loadBooks = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.books.list();
      const sortedBooks = data.sort((a, b) => b.id - a.id);
      setBooks(sortedBooks);
      setCurrentPage(1); // Reset to first page
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load books');
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
      const data = await api.books.search({
        title: searchQuery,
        author: searchQuery,
      });
      const sortedBooks = data.sort((a, b) => b.id - a.id);
      setBooks(sortedBooks);
      setCurrentPage(1); // Reset to first page
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAddBook = async () => {
    try {
      setAddingBook(true);
      await api.books.create(bookFormData);
      showToast('Book added successfully!', 'success');
      setAddBookDialogOpen(false);
      resetBookForm();
      loadBooks();
      loadStats(); // Refresh stats
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to add book', 'error');
    } finally {
      setAddingBook(false);
    }
  };

  const handleEditBook = async () => {
    if (!selectedBook) return;

    try {
      setEditingBook(true);
      await api.books.update(selectedBook.id, bookFormData);
      showToast('Book updated successfully!', 'success');
      setEditBookDialogOpen(false);
      resetBookForm();
      loadBooks();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update book', 'error');
    } finally {
      setEditingBook(false);
    }
  };

  const handleEditInventory = async () => {
    if (!selectedBook) return;

    try {
      setEditingInventory(true);
      // Check if inventory exists
      if (selectedBook.inventory) {
        await api.inventory.update(selectedBook.id, inventoryFormData);
      } else {
        await api.inventory.create({
          book_id: selectedBook.id,
          ...inventoryFormData,
        });
      }
      showToast('Inventory updated successfully!', 'success');
      setEditInventoryDialogOpen(false);
      resetInventoryForm();
      loadBooks();
      loadStats(); // Refresh stats
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update inventory', 'error');
    } finally {
      setEditingInventory(false);
    }
  };

  const openEditBookDialog = (book: Book) => {
    setSelectedBook(book);
    setBookFormData({
      title: book.title,
      author: book.author,
      publisher: book.publisher || '',
      summary: book.summary || '',
      genre: book.genre || '',
      year_of_publishing: book.year_of_publishing,
      in_circulation: book.in_circulation,
    });
    setEditBookDialogOpen(true);
  };

  const openEditInventoryDialog = (book: Book) => {
    setSelectedBook(book);
    setInventoryFormData({
      total_copies: book.inventory?.total_copies || 0,
      borrowed_copies: book.inventory?.borrowed_copies || 0,
    });
    setEditInventoryDialogOpen(true);
  };

  const resetBookForm = () => {
    setBookFormData({
      title: '',
      author: '',
      publisher: '',
      summary: '',
      genre: '',
      year_of_publishing: undefined,
      in_circulation: true,
    });
    setSelectedBook(null);
  };

  const resetInventoryForm = () => {
    setInventoryFormData({
      total_copies: 0,
      borrowed_copies: 0,
    });
    setSelectedBook(null);
  };

  const handleViewChange = (view: View) => {
    setCurrentView(view);
    if (view === 'add-book') {
      setAddBookDialogOpen(true);
      setCurrentView('all-books');
    } else if (view === 'users') {
      loadUsers();
    }
  };

  // Calculate pagination for books
  const totalPages = Math.ceil(books.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedBooks = books.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Calculate pagination for users
  const usersTotalPages = Math.ceil(users.length / itemsPerPage);
  const usersStartIndex = (usersPage - 1) * itemsPerPage;
  const usersEndIndex = usersStartIndex + itemsPerPage;
  const paginatedUsers = users.slice(usersStartIndex, usersEndIndex);

  const handleUsersPageChange = (page: number) => {
    setUsersPage(page);
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

      <TopBar user={user} />
      <div className="flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md border-r flex flex-col">
        <div className="p-6 border-b">
          <p className="text-sm text-gray-600">{user?.name}</p>
          <Badge variant="outline" className="mt-2">
            {user?.user_type.replace('_', ' ')}
          </Badge>
        </div>

        <nav className="flex-1 p-4">
          <button
            onClick={() => setCurrentView('all-books')}
            className={`w-full text-left px-4 py-3 rounded-lg mb-2 flex items-center gap-3 transition-colors ${
              currentView === 'all-books'
                ? 'bg-secondary text-secondary-foreground font-medium'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <BookOpen className="h-5 w-5" />
            All Books
          </button>

          <button
            onClick={() => handleViewChange('add-book')}
            className="w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors text-gray-700 hover:bg-gray-50"
          >
            <Plus className="h-5 w-5" />
            Add Book
          </button>

          <button
            onClick={() => handleViewChange('users')}
            className={`w-full text-left px-4 py-3 rounded-lg mb-2 flex items-center gap-3 transition-colors ${
              currentView === 'users'
                ? 'bg-secondary text-secondary-foreground font-medium'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Users className="h-5 w-5" />
            Manage Users
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
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto px-8 py-8">
          {/* Conditional View Rendering */}
          {currentView === 'users' ? (
            <>
              {/* Users Management View */}
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  Manage Users
                </h2>
                <div className="flex gap-4 max-w-2xl mb-6">
                  <Input
                    placeholder="Search by name or email..."
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleUserSearch()}
                    className="flex-1"
                  />
                  <Button onClick={handleUserSearch}>
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </Button>
                  {userSearchQuery && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setUserSearchQuery('');
                        loadUsers();
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

              {/* Users List */}
              {usersLoading ? (
                <div className="text-center py-12 text-gray-500">Loading...</div>
              ) : users.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No users found.
                </div>
              ) : (
                <>
                  <div className="grid gap-4">
                    {paginatedUsers.map((userItem) => (
                      <Card key={userItem.id} className="border border-gray-300 hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                {userItem.name}
                              </h3>
                              <p className="text-gray-600 mb-2">{userItem.email}</p>
                              <Badge variant="outline">{userItem.user_type.replace('_', ' ')}</Badge>
                            </div>
                            <div className="ml-4">
                              {userItem.user_type !== 'super_admin' && userItem.id !== user?.id && (
                                <div className="flex gap-2">
                                  <Button
                                    variant={userItem.user_type === 'member' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => handleUserRoleChange(userItem.id, 'member')}
                                    disabled={changingRoleUserId === userItem.id || userItem.user_type === 'member'}
                                    className="transition-all hover:scale-105 active:scale-95"
                                  >
                                    {changingRoleUserId === userItem.id ? (
                                      <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Updating...
                                      </>
                                    ) : (
                                      'Member'
                                    )}
                                  </Button>
                                  <Button
                                    variant={userItem.user_type === 'librarian' ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => handleUserRoleChange(userItem.id, 'librarian')}
                                    disabled={changingRoleUserId === userItem.id || userItem.user_type === 'librarian'}
                                    className="transition-all hover:scale-105 active:scale-95"
                                  >
                                    {changingRoleUserId === userItem.id ? (
                                      <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Updating...
                                      </>
                                    ) : (
                                      'Librarian'
                                    )}
                                  </Button>
                                </div>
                              )}
                              {userItem.user_type === 'super_admin' && (
                                <Badge>Super Admin</Badge>
                              )}
                              {userItem.id === user?.id && (
                                <Badge variant="secondary">You</Badge>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Pagination */}
                  <Pagination
                    currentPage={usersPage}
                    totalPages={usersTotalPages}
                    onPageChange={handleUsersPageChange}
                    totalItems={users.length}
                    itemsPerPage={itemsPerPage}
                  />
                </>
              )}
            </>
          ) : (
            <>
              {/* Dashboard Stats */}
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">
                  Dashboard
                </h1>
                {statsLoading ? (
                  <div className="text-center py-8 text-gray-500">Loading statistics...</div>
                ) : stats ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <StatCard
                      title="Total Books"
                      value={stats.total_books}
                      icon={BookOpen}
                      iconColor="text-primary"
                    />
                    <StatCard
                      title="Total Users"
                      value={stats.total_users}
                      icon={Users}
                      iconColor="text-green-600"
                    />
                    <StatCard
                      title="Total Books Borrowed"
                      value={stats.total_borrowed}
                      icon={BookMarked}
                      iconColor="text-purple-600"
                    />
                  </div>
                ) : null}
              </div>

              {/* Search Section */}
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  Manage Books
                </h2>
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
                <>
                  <div className="grid gap-4">
                    {paginatedBooks.map((book) => (
                <Card
                  key={book.id}
                  className="border border-gray-300 hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3
                          className="text-xl font-semibold text-gray-900 mb-2 cursor-pointer hover:text-primary transition-colors"
                          onClick={() => router.push(`/book-detail?id=${book.id}`)}
                        >
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
                          {book.inventory && (
                            <Badge variant="outline">
                              Total: {book.inventory.total_copies},
                              Borrowed: {book.inventory.borrowed_copies}
                            </Badge>
                          )}
                          <Badge variant={book.in_circulation ? 'default' : 'destructive'}>
                            {book.in_circulation ? 'In Circulation' : 'Not in Circulation'}
                          </Badge>
                        </div>
                      </div>
                      <div className="ml-4 flex flex-col gap-2">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditBookDialog(book)}
                            className="transition-all hover:scale-105 active:scale-95"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit Book
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditInventoryDialog(book)}
                            className="transition-all hover:scale-105 active:scale-95"
                          >
                            <Package className="h-4 w-4 mr-1" />
                            Edit Inventory
                          </Button>
                        </div>
                        <Button
                          variant={book.in_circulation ? 'destructive' : 'default'}
                          size="sm"
                          onClick={() => handleToggleCirculation(book.id, book.in_circulation)}
                          disabled={togglingCirculationId === book.id}
                          className="transition-all hover:scale-105 active:scale-95"
                        >
                          {togglingCirculationId === book.id ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Updating...
                            </>
                          ) : book.in_circulation ? (
                            'Remove from Circulation'
                          ) : (
                            'Add to Circulation'
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              </div>

              {/* Pagination */}
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                totalItems={books.length}
                itemsPerPage={itemsPerPage}
              />
            </>
          )}
            </>
          )}
        </div>
      </main>

      {/* Add Book Dialog */}
      <Dialog open={addBookDialogOpen} onOpenChange={setAddBookDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Book</DialogTitle>
            <DialogDescription>
              Fill in the book details below to add a new book to the library.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={bookFormData.title}
                onChange={(e) =>
                  setBookFormData({ ...bookFormData, title: e.target.value })
                }
                placeholder="Enter book title"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="author">Author *</Label>
              <Input
                id="author"
                value={bookFormData.author}
                onChange={(e) =>
                  setBookFormData({ ...bookFormData, author: e.target.value })
                }
                placeholder="Enter author name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="publisher">Publisher</Label>
              <Input
                id="publisher"
                value={bookFormData.publisher}
                onChange={(e) =>
                  setBookFormData({ ...bookFormData, publisher: e.target.value })
                }
                placeholder="Enter publisher name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="genre">Genre</Label>
              <Input
                id="genre"
                value={bookFormData.genre}
                onChange={(e) =>
                  setBookFormData({ ...bookFormData, genre: e.target.value })
                }
                placeholder="Enter genre"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="year">Year of Publishing</Label>
              <Input
                id="year"
                type="number"
                value={bookFormData.year_of_publishing || ''}
                onChange={(e) =>
                  setBookFormData({
                    ...bookFormData,
                    year_of_publishing: e.target.value ? parseInt(e.target.value) : undefined,
                  })
                }
                placeholder="Enter year"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="summary">Summary</Label>
              <Textarea
                id="summary"
                value={bookFormData.summary}
                onChange={(e) =>
                  setBookFormData({ ...bookFormData, summary: e.target.value })
                }
                placeholder="Enter book summary"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAddBookDialogOpen(false);
                resetBookForm();
              }}
              disabled={addingBook}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddBook}
              disabled={!bookFormData.title || !bookFormData.author || addingBook}
              className="transition-all hover:scale-105 active:scale-95"
            >
              {addingBook ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Book'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Book Dialog */}
      <Dialog open={editBookDialogOpen} onOpenChange={setEditBookDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Book</DialogTitle>
            <DialogDescription>
              Update the book details below.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-title">Title *</Label>
              <Input
                id="edit-title"
                value={bookFormData.title}
                onChange={(e) =>
                  setBookFormData({ ...bookFormData, title: e.target.value })
                }
                placeholder="Enter book title"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-author">Author *</Label>
              <Input
                id="edit-author"
                value={bookFormData.author}
                onChange={(e) =>
                  setBookFormData({ ...bookFormData, author: e.target.value })
                }
                placeholder="Enter author name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-publisher">Publisher</Label>
              <Input
                id="edit-publisher"
                value={bookFormData.publisher}
                onChange={(e) =>
                  setBookFormData({ ...bookFormData, publisher: e.target.value })
                }
                placeholder="Enter publisher name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-genre">Genre</Label>
              <Input
                id="edit-genre"
                value={bookFormData.genre}
                onChange={(e) =>
                  setBookFormData({ ...bookFormData, genre: e.target.value })
                }
                placeholder="Enter genre"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-year">Year of Publishing</Label>
              <Input
                id="edit-year"
                type="number"
                value={bookFormData.year_of_publishing || ''}
                onChange={(e) =>
                  setBookFormData({
                    ...bookFormData,
                    year_of_publishing: e.target.value ? parseInt(e.target.value) : undefined,
                  })
                }
                placeholder="Enter year"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-summary">Summary</Label>
              <Textarea
                id="edit-summary"
                value={bookFormData.summary}
                onChange={(e) =>
                  setBookFormData({ ...bookFormData, summary: e.target.value })
                }
                placeholder="Enter book summary"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditBookDialogOpen(false);
                resetBookForm();
              }}
              disabled={editingBook}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditBook}
              disabled={!bookFormData.title || !bookFormData.author || editingBook}
              className="transition-all hover:scale-105 active:scale-95"
            >
              {editingBook ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Book'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Inventory Dialog */}
      <Dialog open={editInventoryDialogOpen} onOpenChange={setEditInventoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Inventory</DialogTitle>
            <DialogDescription>
              Update inventory details for "{selectedBook?.title}"
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="total-copies">Total Copies *</Label>
              <Input
                id="total-copies"
                type="number"
                min="0"
                value={inventoryFormData.total_copies}
                onChange={(e) =>
                  setInventoryFormData({
                    ...inventoryFormData,
                    total_copies: parseInt(e.target.value) || 0,
                  })
                }
                placeholder="Enter total copies"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="borrowed-copies">Borrowed Copies *</Label>
              <Input
                id="borrowed-copies"
                type="number"
                min="0"
                value={inventoryFormData.borrowed_copies}
                onChange={(e) =>
                  setInventoryFormData({
                    ...inventoryFormData,
                    borrowed_copies: parseInt(e.target.value) || 0,
                  })
                }
                placeholder="Enter borrowed copies"
              />
              <p className="text-sm text-gray-500">
                Available: {inventoryFormData.total_copies - inventoryFormData.borrowed_copies}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditInventoryDialogOpen(false);
                resetInventoryForm();
              }}
              disabled={editingInventory}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditInventory}
              disabled={
                inventoryFormData.borrowed_copies > inventoryFormData.total_copies ||
                editingInventory
              }
              className="transition-all hover:scale-105 active:scale-95"
            >
              {editingInventory ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Inventory'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}
