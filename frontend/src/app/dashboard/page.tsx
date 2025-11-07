'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, type User } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Users, Library, LogOut, Search } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await api.auth.getCurrentUser();
      setUser(userData);

      // Redirect members to the dedicated member page
      if (userData.user_type === 'member') {
        router.push('/member');
        return;
      }
    } catch (err) {
      // Not authenticated, redirect to home
      router.push('/');
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Library className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome, {user?.name}!
          </h2>
          <p className="text-gray-600">
            Role: <span className="font-semibold capitalize">{user?.user_type.replace('_', ' ')}</span>
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => router.push('/books')}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle>Browse Books</CardTitle>
                <BookOpen className="h-8 w-8 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                View and search all available books in the library
              </p>
              <Button className="mt-4 w-full" variant="outline">
                <Search className="h-4 w-4 mr-2" />
                Browse
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle>My Borrowed Books</CardTitle>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                View books you've currently borrowed
              </p>
              <Button className="mt-4 w-full" variant="outline" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          {(user?.user_type === 'librarian' || user?.user_type === 'super_admin') && (
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle>Manage Library</CardTitle>
                  <Library className="h-8 w-8 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Add books, manage inventory, and more
                </p>
                <Button className="mt-4 w-full" variant="outline" disabled>
                  Coming Soon
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">Quick Start Guide</CardTitle>
          </CardHeader>
          <CardContent className="text-blue-800">
            <ul className="list-disc list-inside space-y-2">
              <li>Click "Browse Books" to see all available books</li>
              <li>Use the search feature to find specific books</li>
              <li>Click "Borrow" to borrow an available book</li>
              {(user?.user_type === 'librarian' || user?.user_type === 'super_admin') && (
                <li>As a {user?.user_type === 'super_admin' ? 'Super Admin' : 'Librarian'}, you can manage books and inventory (coming soon)</li>
              )}
            </ul>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
