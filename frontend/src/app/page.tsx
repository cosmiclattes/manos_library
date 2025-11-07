'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Users, Library } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      try {
        await api.auth.getCurrentUser();
        // If successful, user is logged in, redirect to dashboard
        router.push('/dashboard');
      } catch (err) {
        // User is not logged in, stay on home page
      }
    };
    checkAuth();
  }, [router]);

  const handleLogin = () => {
    // Redirect to FastAPI Google OAuth
    window.location.href = 'http://localhost:8000/auth/login/google';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <Library className="h-16 w-16 text-blue-600" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Library Management System
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Manage your books, track inventory, and streamline borrowing
          </p>
          <Button
            onClick={handleLogin}
            size="lg"
            className="text-lg px-8 py-6"
          >
            Sign in with Google
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-16">
          <Card>
            <CardHeader>
              <div className="flex justify-center mb-2">
                <BookOpen className="h-10 w-10 text-blue-600" />
              </div>
              <CardTitle className="text-center">Book Management</CardTitle>
              <CardDescription className="text-center">
                Add, edit, and organize your book collection with ease
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex justify-center mb-2">
                <Users className="h-10 w-10 text-blue-600" />
              </div>
              <CardTitle className="text-center">User Roles</CardTitle>
              <CardDescription className="text-center">
                Role-based access for admins, librarians, and members
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex justify-center mb-2">
                <Library className="h-10 w-10 text-blue-600" />
              </div>
              <CardTitle className="text-center">Inventory Tracking</CardTitle>
              <CardDescription className="text-center">
                Real-time tracking of available and borrowed books
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="mt-16 text-center text-gray-600">
          <p className="text-sm">
            Secure authentication powered by Google OAuth
          </p>
        </div>
      </div>
    </div>
  );
}
