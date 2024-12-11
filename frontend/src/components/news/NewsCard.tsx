// src/components/news/NewsCard.tsx
import { Card } from "@/components/ui/card";
import ReactMarkdown from 'react-markdown';
import { News } from "@/types/news";

interface NewsCardProps {
  news: News;
}

function isMarkdown(content: string): boolean {
  return content.includes('**') || content.includes('##') || content.includes('1.') || content.includes('*');
}

function formatFrequency(frequency: string): string {
  switch (frequency) {
    case "30_minutes":
      return "30 minutes";
    case "hourly":
      return "Hourly";
    case "daily":
      return "Daily";
    default:
      return frequency.replace('_', ' ');
  }
}

export function NewsCard({ news }: NewsCardProps) {
  const hasMarkdown = isMarkdown(news.content);

  return (
    <Card className="p-6 bg-white border border-border/50 shadow-sm hover:shadow-md transition-shadow">
      <div className="space-y-1 mb-4">
        <p className="text-sm text-primary/70">
          {formatFrequency(news.frequency)}
        </p>
        <p className="text-sm text-foreground/50">
          {new Date(news.created_at).toLocaleString()}
        </p>
      </div>
      <h3 className="text-xl text-foreground/90 font-medium mb-2">
        {news.title}
      </h3>
      {hasMarkdown ? (
        <div className="text-foreground/70 leading-relaxed prose prose-sm max-w-none prose-headings:text-foreground prose-p:text-foreground/70">
          <ReactMarkdown>
            {news.content}
          </ReactMarkdown>
        </div>
      ) : (
        <p className="text-foreground/70 leading-relaxed">
          {news.content}
        </p>
      )}
    </Card>
  );
}

export function NewsCardSkeleton() {
  return (
    <Card className="p-6 bg-white border border-border/50">
      <div className="h-4 w-32 bg-muted animate-pulse rounded mb-2"></div>
      <div className="h-4 w-24 bg-muted animate-pulse rounded mb-4"></div>
      <div className="h-8 bg-muted animate-pulse rounded mb-4"></div>
      <div className="h-20 bg-muted animate-pulse rounded"></div>
    </Card>
  );
}