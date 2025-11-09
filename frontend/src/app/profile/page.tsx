'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, type User } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Copy, Check } from 'lucide-react';
import TopBar from '@/components/TopBar';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string>('');
  const [copiedToken, setCopiedToken] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
    loadAccessToken();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await api.auth.getCurrentUser();
      setUser(userData);
    } catch (err) {
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const loadAccessToken = async () => {
    try {
      const tokenData = await api.auth.getAccessToken();
      setAccessToken(tokenData.access_token);
    } catch (err) {
      console.error('Failed to load access token:', err);
    }
  };

  const copyToken = async () => {
    if (accessToken) {
      await navigator.clipboard.writeText(accessToken);
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
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
      <TopBar user={user} />

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Button
          variant="outline"
          className="mb-6"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>User Profile</CardTitle>
            <CardDescription>Your account information and access token</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Name */}
            <div>
              <label className="text-sm font-medium text-gray-700">Name</label>
              <p className="mt-1 text-lg text-gray-900">{user?.name}</p>
            </div>

            {/* Email */}
            <div>
              <label className="text-sm font-medium text-gray-700">Email</label>
              <p className="mt-1 text-lg text-gray-900">{user?.email}</p>
            </div>

            {/* Role */}
            <div>
              <label className="text-sm font-medium text-gray-700">Role</label>
              <p className="mt-1 text-lg text-gray-900 capitalize">
                {user?.user_type.replace('_', ' ')}
              </p>
            </div>

            {/* Access Token */}
            <div>
              <label className="text-sm font-medium text-gray-700">Access Token</label>
              <p className="mt-1 text-xs text-gray-500 mb-2">
                Use this token for API scripts and integrations
              </p>
              <div className="relative">
                <div className="p-3 bg-gray-100 rounded-md border border-gray-300 font-mono text-xs break-all">
                  {accessToken || 'No token found'}
                </div>
                {accessToken && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2"
                    onClick={copyToken}
                  >
                    {copiedToken ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Token
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>

            {/* Usage Example */}
            {accessToken && (
              <div className="mt-6 p-4 bg-blue-50 rounded-md border border-blue-200">
                <h3 className="text-sm font-medium text-blue-900 mb-2">Usage Example</h3>
                <p className="text-xs text-blue-800 mb-2">
                  Use this token with the add_sample_data.py script:
                </p>
                <code className="block p-2 bg-white rounded text-xs font-mono text-gray-800 border border-blue-300">
                  python add_sample_data.py {accessToken.substring(0, 20)}...
                </code>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
