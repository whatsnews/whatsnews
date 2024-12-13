// src/app/[username]/[prompt-slug]/error.tsx
'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, RefreshCcw } from 'lucide-react';

interface ErrorProps {
  error: Error;
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Prompt page error:', error);
  }, [error]);

  return (
    <div className="container max-w-4xl py-8">
      <Card className="border-destructive">
        <CardHeader>
          <div className="flex items-center space-x-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <CardTitle>Something went wrong!</CardTitle>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-2">
          <p className="text-muted-foreground">
            We encountered an error while trying to load this prompt.
          </p>
          {process.env.NODE_ENV === 'development' && (
            <p className="text-sm font-mono bg-muted p-2 rounded">
              {error.message}
            </p>
          )}
        </CardContent>

        <CardFooter className="space-x-2">
          <Button onClick={() => window.location.reload()}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh Page
          </Button>
          <Button variant="outline" onClick={() => reset()}>
            Try Again
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}