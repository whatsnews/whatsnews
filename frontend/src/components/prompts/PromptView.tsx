// src/components/prompts/PromptView.tsx
import { PromptWithStats } from '@/types/api';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { VisibilityBadge } from '@/components/ui/visibility-badge';
import Link from 'next/link';
import { Edit, FileText, Clock } from 'lucide-react';

interface PromptViewProps {
  prompt: PromptWithStats;
  isOwner: boolean;
  isAuthenticated: boolean;
}

export function PromptView({ prompt, isOwner, isAuthenticated }: PromptViewProps) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold">{prompt.name}</h1>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <span>Created {formatDate(prompt.created_at)}</span>
              <span>•</span>
              <VisibilityBadge visibility={prompt.visibility} />
            </div>
          </div>
          {isOwner && (
            <Button asChild variant="outline">
              <Link href={`/prompts/${prompt.id}`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Prompt
              </Link>
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="prose dark:prose-invert max-w-none">
          <p>{prompt.content}</p>
        </div>

        {/* Template Info */}
        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
          <div className="flex items-center">
            <Clock className="mr-2 h-4 w-4" />
            Template: {prompt.template_type}
          </div>
        </div>

        {/* News Stats */}
        {prompt.news_count && (
          <div className="border rounded-lg p-4 space-y-2">
            <h3 className="font-medium">Generated News</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-2xl font-bold">{prompt.news_count.total}</p>
                <p className="text-sm text-muted-foreground">Total Items</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{prompt.news_count.hourly}</p>
                <p className="text-sm text-muted-foreground">Hourly Updates</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{prompt.news_count.daily}</p>
                <p className="text-sm text-muted-foreground">Daily Updates</p>
              </div>
            </div>
            {prompt.news_count.last_update && (
              <p className="text-sm text-muted-foreground">
                Last updated: {formatDate(prompt.news_count.last_update)}
              </p>
            )}
          </div>
        )}

        {/* Auth CTAs */}
        {!isAuthenticated && (
          <div className="bg-muted/50 rounded-lg p-4 text-center space-y-2">
            <p>Want to create your own prompts?</p>
            <div className="flex justify-center space-x-4">
              <Button asChild variant="default">
                <Link href="/signup">Sign Up</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/login">Log In</Link>
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter>
        {isAuthenticated && (
          <div className="text-sm text-muted-foreground">
            Created by @{prompt.user?.username}
          </div>
        )}
      </CardFooter>
    </Card>
  );
}