// src/app/(dashboard)/prompts/page.tsx
"use client";

import { useState, useEffect } from "react";
import { PromptCard } from "@/components/prompts/PromptCard";
import { CreatePromptDialog } from "@/components/prompts/CreatePromptDialog";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Prompt {
  id: number;
  name: string;
  content: string;
  user_id: number;
  created_at: string;
  updated_at: string;
  // Add statistics if available from API
  stats?: {
    total_news: number;
    last_update?: string;
  };
}

export default function PromptsPage() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPrompts = async () => {
    setIsLoading(true);
    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('token='))
        ?.split('=')[1];

      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('http://localhost:8000/api/v1/prompts/?skip=0&limit=100', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch prompts');
      }

      const data = await response.json();
      // Sort prompts by created date, newest first
      const sortedPrompts = data.sort((a: Prompt, b: Prompt) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setPrompts(sortedPrompts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch prompts');
      console.error('Error fetching prompts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPrompts();
  }, []);

  const handleEditPrompt = (prompt: Prompt) => {
    // TODO: Implement edit prompt dialog
    console.log('Edit prompt:', prompt);
  };

  const handleDeletePrompt = async (promptId: number) => {
    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('token='))
        ?.split('=')[1];

      if (!token) {
        throw new Error('No authentication token found');
      }

      const confirmDelete = window.confirm('Are you sure you want to delete this prompt? This action cannot be undone.');
      if (!confirmDelete) return;

      const response = await fetch(`http://localhost:8000/api/v1/prompts/${promptId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete prompt');
      }

      // Remove the deleted prompt from the state
      setPrompts(prompts.filter(p => p.id !== promptId));
    } catch (err) {
      console.error('Error deleting prompt:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete prompt');
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="h-8 w-32 bg-muted animate-pulse rounded"></div>
          <div className="h-10 w-32 bg-muted animate-pulse rounded"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-muted animate-pulse rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-medium">My Prompts</h1>
        <CreatePromptDialog onPromptCreated={fetchPrompts} />
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {prompts.map((prompt) => (
          <PromptCard
            key={prompt.id}
            prompt={prompt}
            onEdit={handleEditPrompt}
            onDelete={handleDeletePrompt}
          />
        ))}
        {prompts.length === 0 && !error && (
          <div className="col-span-full bg-muted/50 rounded-lg p-12 text-center">
            <p className="text-muted-foreground mb-4">
              No prompts found. Create your first prompt to get started.
            </p>
            <CreatePromptDialog onPromptCreated={fetchPrompts} />
          </div>
        )}
      </div>
    </div>
  );
}