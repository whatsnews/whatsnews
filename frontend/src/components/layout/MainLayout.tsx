// src/components/layout/MainLayout.tsx
"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function MainLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('token='))
        ?.split('=')[1];

      if (!token) {
        router.push('/login');
      } else {
        setIsAuthenticated(true);
      }
      setIsLoading(false);
    };

    checkAuth();
  }, [router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="space-y-4 text-center">
          <h1 className="text-2xl font-semibold text-primary">whats news.</h1>
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:block w-80">
        <Sidebar />
      </div>

      {/* Mobile Header with Hamburger */}
      <div className="md:hidden fixed top-0 left-0 right-0 p-4 border-b border-border/50 bg-background z-10">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-primary">whats news.</h1>
          <Sheet>
            <SheetTrigger asChild>
              <button className="p-2 hover:bg-primary/5 rounded-md">
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
      <main className="flex-1 overflow-auto md:pt-0 pt-16">
        {children}
      </main>
    </div>
  );
}