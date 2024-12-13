// src/components/prompts/LoginPromptOverlay.tsx
import { Lock, Users } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { VisibilityType } from '@/types/api';

interface LoginPromptOverlayProps {
  visibility: VisibilityType;
}

export function LoginPromptOverlay({ visibility }: LoginPromptOverlayProps) {
  const isInternal = visibility === 'internal';
  const Icon = isInternal ? Users : Lock;

  return (
    <div className="absolute inset-0 backdrop-blur-sm bg-background/80 z-10 flex items-center justify-center p-6">
      <Card className="max-w-md p-6 space-y-4 text-center">
        <div className="flex flex-col items-center gap-2">
          <div className="p-3 rounded-full bg-muted">
            <Icon className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-semibold tracking-tight">
            {isInternal ? 'Internal Content' : 'Private Content'}
          </h2>
        </div>

        <p className="text-muted-foreground">
          {isInternal
            ? 'This content is only available to signed-in users. Please log in to view it.'
            : 'This content is private and only available to the owner. If this is your prompt, please log in to view it.'}
        </p>

        <div className="flex flex-col gap-2">
          <Button asChild>
            <Link href="/login">Log In</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/signup">Create Account</Link>
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          By logging in, you agree to our Terms of Service and Privacy Policy
        </p>
      </Card>
    </div>
  );
}