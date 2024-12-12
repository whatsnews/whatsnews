// src/app/(dashboard)/prompts/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PromptCard } from "@/components/prompts/PromptCard";
import { CreatePromptDialog } from "@/components/prompts/CreatePromptDialog";
import { AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { promptsService } from "@/services/promptsService";
import { auth } from "@/lib/auth";

interface PromptStats {
  total_news: number;
  last_update?: string;
}

interface Prompt {
  id: number;
  name: string;
  content: string;
  user_id: number;
  created_at: string;
  updated_at: string;
  stats?: PromptStats;
}

export default function PromptsPage() {
  const router = useRouter();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);

  const fetchPrompts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (!auth.isAuthenticated()) {
        router.push('/login');
        return;
      }

      const fetchedPrompts = await promptsService.getPrompts({ 
        skip: 0, 
        limit: 100 
      });

      // Sort prompts by created date, newest first
      const sortedPrompts = [...fetchedPrompts].sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setPrompts(sortedPrompts);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch prompts';
      setError(errorMessage);
      console.error('Error fetching prompts:', err);
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchPrompts();
  }, [fetchPrompts]);

  const handleEditPrompt = useCallback((prompt: Prompt) => {
    router.push(`/prompts/${prompt.id}`);
  }, [router]);

  const handleDeletePrompt = useCallback(async (promptId: number) => {
    const confirmDelete = window.confirm(
      'Are you sure you want to delete this prompt? This action cannot be undone.'
    );

    if (!confirmDelete) return;

    setIsDeleting(promptId);
    setError(null);

    try {
      await promptsService.deletePrompt(promptId);
      setPrompts(currentPrompts => 
        currentPrompts.filter(p => p.id !== promptId)
      );
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Failed to delete prompt';
      setError(`Failed to delete prompt: ${errorMessage}`);
      console.error('Error deleting prompt:', err);
    } finally {
      setIsDeleting(null);
    }
  }, []);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div 
              key={i} 
              className="h-48 bg-muted animate-pulse rounded-lg"
              aria-hidden="true"
            />
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      );
    }

    if (prompts.length === 0) {
      return (
        <div className="col-span-full bg-muted/50 rounded-lg p-12 text-center">
          <p className="text-muted-foreground mb-4">
            No prompts found. Create your first prompt to get started.
          </p>
          <CreatePromptDialog onPromptCreated={fetchPrompts} />
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {prompts.map((prompt) => (
          <div key={prompt.id} className="relative">
            {isDeleting === prompt.id && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            )}
            <PromptCard
              prompt={prompt}
              onEdit={() => handleEditPrompt(prompt)}
              onDelete={() => handleDeletePrompt(prompt.id)}
              disabled={isDeleting === prompt.id}
            />
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-medium">My Prompts</h1>
        <CreatePromptDialog 
          onPromptCreated={fetchPrompts}
          disabled={isLoading}
        />
      </div>

      {renderContent()}
    </div>
  );
}