// src/components/news/NewsCard.tsx
import { Card } from "@/components/ui/card";
import ReactMarkdown from 'react-markdown';
import { News } from "@/types/api";
import { formatDistanceToNow } from 'date-fns';

interface NewsCardProps {
  news: News;
}

function isMarkdown(content: string): boolean {
  // Check for common markdown syntax
  return content.includes('**') || 
         content.includes('##') || 
         content.includes('1.') || 
         content.includes('*') ||
         content.includes('- ');
}

function formatFrequency(frequency: string): string {
  switch (frequency.toLowerCase()) {
    case "hourly":
      return "Hourly Update";
    case "daily":
      return "Daily Digest";
    default:
      return "News Update";
  }
}

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return `${formatDistanceToNow(date, { addSuffix: true })}`;
  } catch (error) {
    return dateString;
  }
}

export function NewsCard({ news }: NewsCardProps) {
  const hasMarkdown = isMarkdown(news.content);

  return (
    <Card className="p-6 bg-white border border-border/50 shadow-sm hover:shadow-md transition-shadow">
      <div className="space-y-1 mb-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-primary/70">
            {formatFrequency(news.frequency)}
          </p>
          <p className="text-sm text-muted-foreground">
            {formatDate(news.created_at)}
          </p>
        </div>
      </div>

      <h3 className="text-xl text-foreground/90 font-medium mb-4">
        {news.title}
      </h3>

      {hasMarkdown ? (
        <div className="text-foreground/70 leading-relaxed prose prose-sm max-w-none prose-headings:text-foreground prose-p:text-foreground/70 prose-strong:text-foreground/90 prose-ul:text-foreground/70">
          <ReactMarkdown>
            {news.content}
          </ReactMarkdown>
        </div>
      ) : (
        <p className="text-foreground/70 leading-relaxed whitespace-pre-wrap">
          {news.content}
        </p>
      )}

      {news.didYouKnow && (
        <div className="mt-4 pt-4 border-t border-border/50">
          <p className="text-sm font-medium text-primary/70 mb-2">Did you know?</p>
          <p className="text-sm text-foreground/70">{news.didYouKnow}</p>
        </div>
      )}
    </Card>
  );
}

export function NewsCardSkeleton() {
  return (
    <Card className="p-6 bg-white border border-border/50">
      <div className="flex justify-between mb-4">
        <div className="h-4 w-24 bg-muted animate-pulse rounded"></div>
        <div className="h-4 w-32 bg-muted animate-pulse rounded"></div>
      </div>
      <div className="h-7 bg-muted animate-pulse rounded mb-4"></div>
      <div className="space-y-2">
        <div className="h-4 bg-muted animate-pulse rounded"></div>
        <div className="h-4 bg-muted animate-pulse rounded"></div>
        <div className="h-4 w-3/4 bg-muted animate-pulse rounded"></div>
      </div>
    </Card>
  );
}