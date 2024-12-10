// src/app/(dashboard)/prompts/[id]/page.tsx
"use client";

import { Card } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

interface Prompt {
  id: number;
  name: string;
  content: string;
  user_id: number;
  created_at: string;
  updated_at: string;
}

interface NewsItem {
  type: string;
  timestamp: string;
  title: string;
  content: string;
}

const mockNews: NewsItem[] = [
  {
    type: "10 minutes (type of generation)",
    timestamp: "1:20pm 10 Dec 24 (generated time and date)",
    title: "News Headline",
    content: "Summarized news goes here....."
  },
  {
    type: "10 minutes (type of generation)",
    timestamp: "1:10pm 10 Dec 24 (generated time and date)",
    title: "Another News Headline",
    content: "More summarized news content..."
  }
];

export default function PromptPage() {
  const params = useParams();
  const promptId = params.id;
  const [prompt, setPrompt] = useState<Prompt | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState("10 minutes");
  const filters = ["All News", "10 minutes", "Hourly", "Daily"];

  useEffect(() => {
    const fetchPrompt = async () => {
      try {
        const token = document.cookie
          .split('; ')
          .find(row => row.startsWith('token='))
          ?.split('=')[1];

        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await fetch(`http://localhost:8000/api/v1/prompts/${promptId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'accept': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch prompt details');
        }

        const data = await response.json();
        setPrompt(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch prompt details');
        console.error('Error fetching prompt:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (promptId) {
      fetchPrompt();
    }
  }, [promptId]);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="h-6 w-48 bg-muted animate-pulse rounded mb-8"></div>
        <div className="space-y-4">
          <div className="h-32 bg-muted animate-pulse rounded"></div>
          <div className="h-32 bg-muted animate-pulse rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-destructive">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header Section */}
      <div className="mb-8">
        <h2 className="text-xl text-foreground/90 font-medium">
          &gt; {prompt?.name}
        </h2>
        
        {/* Time Filter Buttons */}
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

      {/* News Feed */}
      <div className="space-y-4">
        {mockNews.map((news, index) => (
          <Card key={index} className="p-6 bg-white border border-border/50 shadow-sm hover:shadow-md transition-shadow">
            <div className="space-y-1 mb-4">
              <p className="text-sm text-primary/70">
                {news.type}
              </p>
              <p className="text-sm text-foreground/50">
                {news.timestamp}
              </p>
            </div>
            <h3 className="text-xl text-foreground/90 font-medium mb-2">
              {news.title}
            </h3>
            <p className="text-foreground/70 leading-relaxed">
              {news.content}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}