// src/components/layout/MainLayout.tsx
"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { auth } from '@/lib/auth';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Check authentication on mount and route changes
  useEffect(() => {
    const checkAuth = () => {
      try {
        const isAuthed = auth.isAuthenticated();
        setIsAuthenticated(isAuthed);
        
        if (!isAuthed) {
          router.push('/login');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router, pathname]);

  // Handle hydration
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Show nothing until mounted to prevent hydration mismatch
  if (!isMounted) {
    return null;
  }

  // Loading state with skeleton
  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="space-y-4 text-center">
          <div className="h-8 w-48 bg-primary/10 animate-pulse rounded-md mx-auto" />
          <div className="h-4 w-32 bg-muted animate-pulse rounded-md mx-auto" />
        </div>
      </div>
    );
  }

  // Not authenticated - handled by useEffect redirect
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:block w-80 border-r border-border/50">
        <div className="h-full">
          <Sidebar />
        </div>
      </div>

      {/* Mobile Header with Hamburger */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-xl font-semibold text-primary">
            whats news.
          </h1>
          <Sheet>
            <SheetTrigger asChild>
              <button 
                className="p-2 hover:bg-primary/5 rounded-md transition-colors"
                aria-label="Open menu"
              >
                <Menu className="h-6 w-6 text-foreground/70" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-80">
              <Sidebar />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto md:pt-0 pt-16 relative">
        {/* Content wrapper */}
        <div className="min-h-full relative">
          {children}
        </div>
      </main>
    </div>
  );
}