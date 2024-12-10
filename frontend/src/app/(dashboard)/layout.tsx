// src/app/(dashboard)/layout.tsx
"use client";

import { MainLayout } from '@/components/layout/MainLayout';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MainLayout>{children}</MainLayout>;
}