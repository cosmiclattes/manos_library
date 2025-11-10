'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, type User } from '@/lib/api';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { User as UserIcon, LogOut, Library } from 'lucide-react';

interface TopBarProps {
  user: User | null;
}

export default function TopBar({ user }: TopBarProps) {
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await api.auth.logout();
      router.push('/');
    } catch (err) {
      console.error('Logout failed:', err);
      // Still redirect even if logout fails
      router.push('/');
    }
  };

  const getInitial = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  if (!user) return null;

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        {/* Left side - Logo/Title */}
        <div className="flex items-center gap-2">
          <Library className="h-6 w-6 text-blue-600" />
          <span className="text-xl font-semibold text-gray-900">
            Library
          </span>
        </div>

        {/* Right side - User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger onClick={() => setDropdownOpen(!dropdownOpen)}>
            <button className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              {/* Avatar with initial */}
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold cursor-pointer hover:bg-blue-700 transition-colors">
                {getInitial(user.name)}
              </div>
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent open={dropdownOpen} onClose={() => setDropdownOpen(false)}>
            {/* User profile link */}
            <DropdownMenuItem onClick={() => { router.push('/profile'); setDropdownOpen(false); }}>
              <UserIcon className="h-4 w-4" />
              <span>{user.name}</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            {/* Logout option */}
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
