// src/app/(dashboard)/news/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { NewsCard, NewsCardSkeleton } from "@/components/news/NewsCard";
import { Newspaper, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { newsService } from "@/services/newsService";
import { promptsService } from "@/services/promptsService";
import type { News, Prompt } from "@/types/api";

export default function NewsPage() {
  const searchParams = useSearchParams();
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [news, setNews] = useState<News[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewsLoading, setIsNewsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState("All News");
  
  const filters = ["All News", "Hourly", "Daily"];
  const promptId = Number(searchParams.get('promptId')) || 1; // Default to prompt 1 if not specified

  const fetchNews = async () => {
    setIsNewsLoading(true);
    try {
      const newsData = await newsService.getNews({
        prompt_id: promptId,
        frequency: activeFilter === "All News" ? undefined : 
                  activeFilter.toLowerCase() as "hourly" | "daily",
        skip: 0,
        limit: 100
      }).catch(error => {
        console.error('News fetch error:', error);
        return [];
      });
  
      const sortedNews = newsData.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setNews(sortedNews);
    } catch (err) {
      console.error('Error in fetchNews:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch news');
      setNews([]);
    } finally {
      setIsNewsLoading(false);
    }
  };

  useEffect(() => {
    const fetchPrompt = async () => {
      try {
        const promptData = await promptsService.getPromptById(promptId);
        setPrompt(promptData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch prompt details');
        console.error('Error fetching prompt:', err);
      } finally {
        setIsLoading(false);
      }
    };

    setIsLoading(true);
    fetchPrompt();
  }, [promptId]);

  useEffect(() => {
    if (!isLoading && !error) {
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

  return (
    <div className="p-6">
      <div className="flex justify-between items-start mb-8">
        <div className="flex-1">
          <h2 className="text-xl text-foreground/90 font-medium flex items-center gap-2">
            <Newspaper className="h-5 w-5 text-foreground/50" />
            {prompt?.name || 'News Feed'}
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

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

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