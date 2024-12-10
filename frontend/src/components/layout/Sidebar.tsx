// src/components/layout/Sidebar.tsx
"use client";

import { useEffect, useState } from "react";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Settings, 
  MessageSquareText,
  Newspaper,
  LogOut
} from 'lucide-react';

import { useRouter } from 'next/navigation'; // Add this import

interface Prompt {
  id: number;
  name: string;
  content: string;
  user_id: number;
  created_at: string;
  updated_at: string;
}

interface NavItem {
  title: string;
  href: string;
  icon?: React.ReactNode;
  isPrompt?: boolean;
}

const bottomNav: NavItem[] = [
  {
    title: "My Prompts",
    href: "/prompts",
    icon: <MessageSquareText className="h-5 w-5" />,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: <Settings className="h-5 w-5" />,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchPrompts = async () => {
      try {
        const token = document.cookie
          .split('; ')
          .find(row => row.startsWith('token='))
          ?.split('=')[1];

        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await fetch('http://localhost:8000/api/v1/prompts/?skip=0&limit=10', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'accept': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch prompts');
        }

        const data = await response.json();
        setPrompts(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch prompts');
        console.error('Error fetching prompts:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrompts();
  }, []);

  const handleLogout = () => {
    // Clear the token cookie
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
    // Redirect to login page
    router.push('/login');
    router.refresh();
  };

  const NavLink = ({ item }: { item: NavItem }) => {
    const isActive = pathname === item.href;
    
    return (
      <Link
        href={item.href}
        className={`flex items-center gap-x-3 px-4 py-2.5 text-base rounded-md transition-all
          ${isActive 
            ? 'bg-primary/10 text-primary font-medium' 
            : 'text-foreground/70 hover:bg-primary/5 hover:text-primary/90'
          }
          ${item.isPrompt ? 'pl-6' : 'pl-4'}`
        }
      >
        {item.isPrompt ? (
          <Newspaper className="h-4 w-4 text-foreground/50" />
        ) : (
          item.icon
        )}
        <span>{item.title}</span>
      </Link>
    );
  };

  return (
    <div className="h-full w-80 border-r border-border/50 flex flex-col bg-background/50">
      <div className="p-6 border-b border-border/50 hidden md:block">
        <h1 className="text-2xl font-semibold text-primary">whats news.</h1>
      </div>

      <nav className="flex-1 py-6">
        <div className="px-7 mb-3 text-xs font-medium text-foreground/50 uppercase tracking-wider">
          My News
        </div>

        <div className="px-3 space-y-1">
          {isLoading ? (
            <div className="px-4 py-2 text-sm text-muted-foreground">
              Loading prompts...
            </div>
          ) : error ? (
            <div className="px-4 py-2 text-sm text-destructive">
              {error}
            </div>
          ) : (
            prompts.map((prompt) => (
              <NavLink
                key={prompt.id}
                item={{
                  title: prompt.name,
                  href: `/prompts/${prompt.id}`,
                  isPrompt: true
                }}
              />
            ))
          )}
        </div>
      </nav>

      <div className="p-3 border-t border-border/50 space-y-1 bg-background/50">
        {bottomNav.map((item) => (
          <NavLink key={item.title} item={item} />
        ))}
      </div>

      <button
          onClick={handleLogout}
          className="flex items-center gap-x-3 px-4 py-2.5 text-base rounded-md transition-all
            w-full text-foreground/70 hover:bg-primary/5 hover:text-primary/90"
        >
          <LogOut className="h-5 w-5" />
          <span>Logout</span>
        </button>
    </div>
  );
}