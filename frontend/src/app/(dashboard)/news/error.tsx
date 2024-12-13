// src/app/(dashboard)/news/error.tsx
'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('News page error:', error);
  }, [error]);

  return (
    <div className="p-6">
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load news feed. Please try again.
        </AlertDescription>
      </Alert>
      <Button
        onClick={() => reset()}
        variant="outline"
        className="hover:bg-primary/5"
      >
        Try again
      </Button>
    </div>
  );
}

