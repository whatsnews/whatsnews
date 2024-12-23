// src/app/(dashboard)/prompts/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { NewsCard, NewsCardSkeleton } from "@/components/news/NewsCard";
import { Newspaper, RefreshCcw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { newsService } from "@/services/newsService";
import { promptsService } from "@/services/promptsService";
import { ApiError } from "@/config/api";
import type { News, Prompt } from "@/types/api";

interface ErrorState {
  message: string;
  detail?: string;
}

export default function PromptPage() {
  const params = useParams();
  const promptId = params.id;
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [news, setNews] = useState<News[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewsLoading, setIsNewsLoading] = useState(true);
  const [error, setError] = useState<ErrorState | null>(null);
  const [activeFilter, setActiveFilter] = useState("All News");
  const filters = ["All News", "Hourly", "Daily"];

  const fetchNews = async () => {
    if (!promptId) return;
    
    setIsNewsLoading(true);
    setError(null);
    
    try {
      const frequency = activeFilter === "All News" ? undefined :
        activeFilter.toLowerCase() as "hourly" | "daily";

      const newsData = await newsService.getNews({
        prompt_id: Number(promptId),
        frequency,
        skip: 0,
        limit: 100
      });

      const sortedNews = newsData.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setNews(sortedNews);
    } catch (err) {
      if (err instanceof ApiError) {
        setError({
          message: err.message,
          detail: err.detail
        });
      } else {
        setError({
          message: 'Failed to fetch news',
          detail: err instanceof Error ? err.message : 'Unknown error occurred'
        });
      }
    } finally {
      setIsNewsLoading(false);
    }
  };

  useEffect(() => {
    const fetchPrompt = async () => {
      if (!promptId) return;
      
      try {
        setError(null);
        const promptData = await promptsService.getPromptById(Number(promptId));
        setPrompt(promptData);
      } catch (err) {
        if (err instanceof ApiError) {
          setError({
            message: err.message,
            detail: err.detail
          });
        } else {
          setError({
            message: 'Failed to fetch prompt details',
            detail: err instanceof Error ? err.message : 'Unknown error occurred'
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    setIsLoading(true);
    fetchPrompt();
  }, [promptId]);

  useEffect(() => {
    if (promptId && !isLoading && !error) {
      fetchNews();
    }
  }, [promptId, activeFilter, isLoading]);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="h-6 w-48 bg-muted animate-pulse rounded mb-8"></div>
        <div className="flex gap-3 mt-6">
          {filters.map((_, i) => (
            <div key={i} className="h-9 w-24 bg-muted animate-pulse rounded-md"></div>
          ))}
        </div>
        <div className="space-y-4 mt-8">
          <NewsCardSkeleton />
          <NewsCardSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <p className="font-medium">{error.message}</p>
            {error.detail && (
              <p className="text-sm mt-1 text-muted-foreground">{error.detail}</p>
            )}
          </AlertDescription>
        </Alert>
        <Button
          variant="outline"
          onClick={() => window.location.reload()}
          className="mt-4"
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-start mb-8">
        <div className="flex-1">
          <h2 className="text-xl text-foreground/90 font-medium flex items-center gap-2">
            <Newspaper className="h-5 w-5 text-foreground/50" />
            {prompt?.name}
          </h2>
          
          <div className="flex gap-3 mt-6">
            {filters.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-2 rounded-md text-sm transition-all ${
                  activeFilter === filter 
                  ? 'bg-primary text-white shadow-sm' 
                  : 'bg-background hover:bg-muted text-foreground/70'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
        
        <Button
          variant="outline"
          size="icon"
          onClick={fetchNews}
          disabled={isNewsLoading}
          className="h-9 w-9"
        >
          <RefreshCcw className={`h-4 w-4 ${isNewsLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <div className="space-y-4">
        {isNewsLoading ? (
          <>
            <NewsCardSkeleton />
            <NewsCardSkeleton />
            <NewsCardSkeleton />
          </>
        ) : news.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No news available for this filter
          </div>
        ) : (
          news.map((item) => (
            <NewsCard key={item.id} news={item} />
          ))
        )}
      </div>
    </div>
  );
}