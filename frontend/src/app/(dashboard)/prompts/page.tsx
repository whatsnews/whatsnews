// src/app/(dashboard)/prompts/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PromptCard } from "@/components/prompts/PromptCard";
import { CreatePromptDialog } from "@/components/prompts/CreatePromptDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2, Search } from "lucide-react";
import { 
  promptsService, 
  Prompt, 
  PromptListParams 
} from "@/services/promptsService";

export default function PromptsPage() {
  const router = useRouter();
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout>();

  const fetchPrompts = async (params?: PromptListParams) => {
    try {
      setIsLoading(true);
      setError(null);
      const fetchedPrompts = await promptsService.getPrompts(params);
      setPrompts(fetchedPrompts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch prompts');
      console.error('Error fetching prompts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search with debounce
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeout = setTimeout(() => {
      fetchPrompts({ search: value });
    }, 500);

    setSearchTimeout(timeout);
  };

  useEffect(() => {
    fetchPrompts();
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, []);

  const handleDeletePrompt = async (promptId: number) => {
    try {
      await promptsService.deletePrompt(promptId);
      setPrompts(currentPrompts => 
        currentPrompts.filter(p => p.id !== promptId)
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete prompt');
    }
  };

  const handleEditPrompt = (prompt: Prompt) => {
    router.push(`/prompts/${prompt.id}`);
  };

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
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      );
    }

    if (prompts.length === 0) {
      return (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-muted-foreground mb-4">
            No prompts found
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            {searchTerm 
              ? "No prompts match your search criteria" 
              : "Create your first prompt to get started"}
          </p>
          {!searchTerm && <CreatePromptDialog onPromptCreated={fetchPrompts} />}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {prompts.map((prompt) => (
          <PromptCard
            key={prompt.id}
            prompt={prompt}
            onEdit={handleEditPrompt}
            onDelete={handleDeletePrompt}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-semibold">My Prompts</h1>
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search prompts..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <CreatePromptDialog 
            onPromptCreated={fetchPrompts}
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Refresh Button */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchPrompts()}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Refresh"
          )}
        </Button>
      </div>

      {renderContent()}
    </div>
  );
}