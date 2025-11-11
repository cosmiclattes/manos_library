'use client';

import { Badge } from '@/components/ui/badge';
import { User } from '@/lib/api';
import { LucideIcon } from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  onClick: () => void;
}

interface SidebarProps {
  user: User | null;
  navItems: NavItem[];
  currentView: string;
}

export default function Sidebar({ user, navItems, currentView }: SidebarProps) {
  if (!user) return null;

  return (
    <aside className="w-64 bg-white shadow-md border-r flex flex-col">
      <div className="p-6 border-b">
        <p className="text-sm text-gray-600">{user.name}</p>
        <Badge variant="outline" className="mt-2">
          {user.user_type.replace('_', ' ')}
        </Badge>
      </div>

      <nav className="flex-1 p-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;

          return (
            <button
              key={item.id}
              onClick={item.onClick}
              className={`w-full text-left px-4 py-3 rounded-lg mb-2 flex items-center gap-3 transition-colors ${
                isActive
                  ? 'bg-secondary text-secondary-foreground font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
