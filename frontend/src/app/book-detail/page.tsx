'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api, type Book, type User } from '@/lib/api';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ArrowLeft, BookOpen, Edit, Package } from 'lucide-react';
import TopBar from '@/components/TopBar';
import { useToast } from '@/hooks/useToast';
import { Toast } from '@/components/ui/toast';

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

function BookDetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookId = parseInt(searchParams.get('id') || '0');
  const { toasts, showToast, hideToast } = useToast();

  const [user, setUser] = useState<User | null>(null);
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [borrowing, setBorrowing] = useState(false);
  const [returning, setReturning] = useState(false);
  const [editingBook, setEditingBook] = useState(false);
  const [editingInventory, setEditingInventory] = useState(false);
  const [togglingCirculation, setTogglingCirculation] = useState(false);

  // Dialog states
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

  useEffect(() => {
    if (!bookId) {
      router.push('/books');
      return;
    }
    loadUser();
    loadBook();
  }, [bookId]);

  const loadUser = async () => {
    try {
      const userData = await api.auth.getCurrentUser();
      setUser(userData);
    } catch (err) {
      router.push('/');
    }
  };

  const loadBook = async () => {
    try {
      setLoading(true);
      const bookData = await api.books.get(bookId);
      setBook(bookData);
    } catch (err) {
      showToast('Error loading book details', 'error');
      router.push('/books');
    } finally {
      setLoading(false);
    }
  };

  const handleBorrow = async () => {
    if (!book) return;
    setBorrowing(true);
    try {
      await api.borrow.borrowBook(book.id);
      showToast('Book borrowed successfully!', 'success');
      loadBook();
    } catch (err: any) {
      showToast(err.message || 'Failed to borrow book', 'error');
    } finally {
      setBorrowing(false);
    }
  };

  const handleReturn = async () => {
    if (!book) return;
    setReturning(true);
    try {
      await api.borrow.returnBook(book.id);
      showToast('Book returned successfully!', 'success');
      loadBook();
    } catch (err: any) {
      showToast(err.message || 'Failed to return book', 'error');
    } finally {
      setReturning(false);
    }
  };

  const handleEditBook = () => {
    if (!book) return;
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

  const handleSaveBook = async () => {
    if (!book) return;
    setEditingBook(true);
    try {
      await api.books.update(book.id, bookFormData);
      showToast('Book updated successfully!', 'success');
      setEditBookDialogOpen(false);
      loadBook();
    } catch (err: any) {
      showToast(err.message || 'Failed to update book', 'error');
    } finally {
      setEditingBook(false);
    }
  };

  const handleEditInventory = () => {
    if (!book?.inventory) {
      setInventoryFormData({ total_copies: 0, borrowed_copies: 0 });
    } else {
      setInventoryFormData({
        total_copies: book.inventory.total_copies,
        borrowed_copies: book.inventory.borrowed_copies,
      });
    }
    setEditInventoryDialogOpen(true);
  };

  const handleSaveInventory = async () => {
    if (!book) return;
    setEditingInventory(true);
    try {
      if (book.inventory) {
        await api.inventory.update(book.id, inventoryFormData);
        showToast('Inventory updated successfully!', 'success');
      } else {
        await api.inventory.create({
          book_id: book.id,
          ...inventoryFormData,
        });
        showToast('Inventory created successfully!', 'success');
      }
      setEditInventoryDialogOpen(false);
      loadBook();
    } catch (err: any) {
      showToast(err.message || 'Failed to save inventory', 'error');
    } finally {
      setEditingInventory(false);
    }
  };

  const handleToggleCirculation = async () => {
    if (!book) return;
    setTogglingCirculation(true);
    try {
      await api.books.toggleCirculation(book.id);
      showToast(
        `Book ${book.in_circulation ? 'removed from' : 'added to'} circulation`,
        'success'
      );
      loadBook();
    } catch (err: any) {
      showToast(err.message || 'Failed to update circulation status', 'error');
    } finally {
      setTogglingCirculation(false);
    }
  };

  if (loading || !book || !user) {
    return (
      <div className="min-h-screen bg-background">
        <TopBar user={user} />
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const isLibrarian = user.user_type === 'librarian' || user.user_type === 'super_admin';
  const availableCopies = book.available_copies || 0;
  const canBorrow = !book.is_borrowed_by_user && availableCopies > 0 && book.in_circulation;

  return (
    <div className="min-h-screen bg-background">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => hideToast(toast.id)}
        />
      ))}

      <TopBar user={user} />

      <div className="container mx-auto px-4 py-8">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Main Book Details */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-3xl mb-2">{book.title}</CardTitle>
                    <p className="text-xl text-muted-foreground">by {book.author}</p>
                  </div>
                  <BookOpen className="h-12 w-12 text-primary" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {book.summary && (
                  <div>
                    <h3 className="font-semibold mb-2">Summary</h3>
                    <p className="text-muted-foreground">{book.summary}</p>
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-4">
                  {book.publisher && (
                    <div>
                      <h3 className="font-semibold text-sm">Publisher</h3>
                      <p className="text-muted-foreground">{book.publisher}</p>
                    </div>
                  )}
                  {book.genre && (
                    <div>
                      <h3 className="font-semibold text-sm">Genre</h3>
                      <Badge variant="outline">{book.genre}</Badge>
                    </div>
                  )}
                  {book.year_of_publishing && (
                    <div>
                      <h3 className="font-semibold text-sm">Year Published</h3>
                      <p className="text-muted-foreground">{book.year_of_publishing}</p>
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-sm">Status</h3>
                    <Badge variant={book.in_circulation ? 'default' : 'secondary'}>
                      {book.in_circulation ? 'In Circulation' : 'Not Available'}
                    </Badge>
                  </div>
                </div>

                {book.inventory && (
                  <div>
                    <h3 className="font-semibold text-sm">Availability</h3>
                    <p className="text-muted-foreground">
                      {availableCopies} of {book.inventory.total_copies} copies available
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Actions Sidebar */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {!isLibrarian && (
                  <>
                    {book.is_borrowed_by_user ? (
                      <Button
                        className="w-full"
                        onClick={handleReturn}
                        disabled={returning}
                        variant="outline"
                      >
                        {returning ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Returning...
                          </>
                        ) : (
                          'Return Book'
                        )}
                      </Button>
                    ) : (
                      <Button
                        className="w-full"
                        onClick={handleBorrow}
                        disabled={borrowing || !canBorrow}
                      >
                        {borrowing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Borrowing...
                          </>
                        ) : !book.in_circulation ? (
                          'Not Available'
                        ) : availableCopies === 0 ? (
                          'No Copies Available'
                        ) : (
                          'Borrow Book'
                        )}
                      </Button>
                    )}
                  </>
                )}

                {isLibrarian && (
                  <>
                    <Button
                      className="w-full"
                      onClick={handleEditBook}
                      variant="outline"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Book
                    </Button>

                    <Button
                      className="w-full"
                      onClick={handleEditInventory}
                      variant="outline"
                    >
                      <Package className="mr-2 h-4 w-4" />
                      {book.inventory ? 'Edit Inventory' : 'Add Inventory'}
                    </Button>

                    <Button
                      className="w-full"
                      onClick={handleToggleCirculation}
                      disabled={togglingCirculation}
                      variant={book.in_circulation ? 'destructive' : 'default'}
                    >
                      {togglingCirculation ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : book.in_circulation ? (
                        'Remove from Circulation'
                      ) : (
                        'Add to Circulation'
                      )}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Edit Book Dialog */}
      <Dialog open={editBookDialogOpen} onOpenChange={setEditBookDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Book</DialogTitle>
            <DialogDescription>Update book information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={bookFormData.title}
                onChange={(e) =>
                  setBookFormData({ ...bookFormData, title: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="author">Author</Label>
              <Input
                id="author"
                value={bookFormData.author}
                onChange={(e) =>
                  setBookFormData({ ...bookFormData, author: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="publisher">Publisher</Label>
              <Input
                id="publisher"
                value={bookFormData.publisher}
                onChange={(e) =>
                  setBookFormData({ ...bookFormData, publisher: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="genre">Genre</Label>
              <Input
                id="genre"
                value={bookFormData.genre}
                onChange={(e) =>
                  setBookFormData({ ...bookFormData, genre: e.target.value })
                }
              />
            </div>
            <div>
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
              />
            </div>
            <div>
              <Label htmlFor="summary">Summary</Label>
              <Textarea
                id="summary"
                value={bookFormData.summary}
                onChange={(e) =>
                  setBookFormData({ ...bookFormData, summary: e.target.value })
                }
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditBookDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveBook} disabled={editingBook}>
              {editingBook ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Inventory Dialog */}
      <Dialog open={editInventoryDialogOpen} onOpenChange={setEditInventoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{book.inventory ? 'Edit' : 'Add'} Inventory</DialogTitle>
            <DialogDescription>
              Update inventory information for this book
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="total_copies">Total Copies</Label>
              <Input
                id="total_copies"
                type="number"
                value={inventoryFormData.total_copies}
                onChange={(e) =>
                  setInventoryFormData({
                    ...inventoryFormData,
                    total_copies: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor="borrowed_copies">Borrowed Copies</Label>
              <Input
                id="borrowed_copies"
                type="number"
                value={inventoryFormData.borrowed_copies}
                onChange={(e) =>
                  setInventoryFormData({
                    ...inventoryFormData,
                    borrowed_copies: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditInventoryDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveInventory} disabled={editingInventory}>
              {editingInventory ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function BookDetailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <BookDetailContent />
    </Suspense>
  );
}
