// src/components/layout/MainLayout.tsx
"use client";

import { ReactNode, useState } from 'react';
import { Sidebar } from './Sidebar';
import { Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
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
        <div className="container p-6">
          {children}
        </div>
      </main>
    </div>
  );
}