'use client';

// src/components/prompts/PublicPromptCard.tsx
import Link from 'next/link';
import type { Prompt } from '@/types/api';

interface PublicPromptCardProps {
  prompt: Prompt;
}

export function PublicPromptCard({ prompt }: PublicPromptCardProps) {
  const hasValidPath = prompt.user?.username && prompt.slug;
  const promptPath = hasValidPath 
    ? `/${prompt.user.username}/${prompt.slug}`
    : '#';

  return (
    <div className="rounded-lg border p-4 flex flex-col">
      <div className="flex-1">
        <h3 className="font-semibold text-lg mb-2">{prompt.name}</h3>
        <p className="text-muted-foreground line-clamp-2 mb-4">
          {prompt.content}
        </p>
      </div>
      
      <div className="mt-4 pt-4 border-t flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {prompt.user?.username ? (
            <span>By @{prompt.user.username}</span>
          ) : null}
        </div>
        {hasValidPath ? (
          <Link 
            href={promptPath}
            className="text-sm text-primary hover:underline"
          >
            View Details →
          </Link>
        ) : (
          <span className="text-sm text-muted-foreground">
            Details unavailable
          </span>
        )}
      </div>
    </div>
  );
}