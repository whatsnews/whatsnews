// src/app/(public)/page.tsx
import { Suspense } from 'react';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { Button } from '@/components/ui/button';
import { PromptCard } from '@/components/prompts/PromptCard';
import { NewsCard } from '@/components/news/NewsCard';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Newspaper, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { promptsService } from '@/services/promptsService';
import { newsService } from '@/services/newsService';
import type { Prompt, News } from '@/types/api';

async function getPublicPrompts() {
  try {
    return await promptsService.getPublicPrompts({
      limit: 6,
    });
  } catch (error) {
    console.error('Error fetching public prompts:', error);
    return [];
  }
}

async function getLatestPublicNews() {
  try {
    return await newsService.getLatestPublicNews(3);  // Get latest 3 news items
  } catch (error) {
    console.error('Error fetching public news:', error);
    return [];
  }
}

export default async function PublicLandingPage() {
  const isAuthenticated = !!cookies().get('token');
  const [prompts, latestNews] = await Promise.all([
    getPublicPrompts(),
    getLatestPublicNews()
  ]);

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-center space-y-4 py-12">
        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
          Your News, Your Way
        </h1>
        <p className="mx-auto max-w-[700px] text-lg text-muted-foreground">
          Create custom prompts to aggregate and summarize news from any source.
          Stay informed with personalized news updates.
        </p>
        <div className="flex justify-center gap-4">
          {!isAuthenticated && (
            <>
              <Button asChild size="lg">
                <Link href="/signup">Get Started</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/login">Sign In</Link>
              </Button>
            </>
          )}
          {isAuthenticated && (
            <Button asChild size="lg">
              <Link href="/prompts">
                <Newspaper className="mr-2 h-5 w-5" />
                Go to My Prompts
              </Link>
            </Button>
          )}
        </div>
      </section>

      {/* Latest News Section */}
      <section className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold tracking-tight">
            Latest Updates
          </h2>
          <Button asChild variant="ghost">
            <Link href="/explore">View all →</Link>
          </Button>
        </div>

        <Suspense
          fallback={
            <div className="grid gap-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-[200px] rounded-lg bg-muted animate-pulse"
                />
              ))}
            </div>
          }
        >
          {latestNews.length > 0 ? (
            <div className="grid gap-6">
              {latestNews.map((news) => (
                <NewsCard key={news.id} news={news} />
              ))}
            </div>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No public news available at the moment.
              </AlertDescription>
            </Alert>
          )}
        </Suspense>
      </section>

      {/* Featured Prompts Section */}
      <section className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold tracking-tight">
            Featured Prompts
          </h2>
          <Button asChild variant="ghost">
            <Link href="/explore">View all →</Link>
          </Button>
        </div>

        <Suspense
          fallback={
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-[200px] rounded-lg bg-muted animate-pulse"
                />
              ))}
            </div>
          }
        >
          {prompts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {prompts.map((prompt) => (
                <PromptCard
                  key={prompt.id}
                  prompt={prompt}
                  showActions={false}
                />
              ))}
            </div>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No public prompts available at the moment.
              </AlertDescription>
            </Alert>
          )}
        </Suspense>
      </section>

      {/* Features Section */}
      <section className="space-y-6 py-12">
        <h2 className="text-2xl font-semibold tracking-tight text-center">
          Why Choose whats news?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="p-6 rounded-lg border bg-card text-card-foreground"
            >
              <div className="flex flex-col items-center text-center space-y-2">
                <feature.icon className="h-6 w-6 mb-2" />
                <h3 className="font-semibold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

const features = [
  {
    title: 'Custom Prompts',
    description: 'Create personalized prompts to aggregate news from any source',
    icon: Newspaper,
  },
  {
    title: 'AI-Powered Summaries',
    description: 'Get concise, relevant summaries powered by advanced AI',
    icon: Sparkles,
  },
  {
    title: 'Real-time Updates',
    description: 'Stay informed with automatic updates throughout the day',
    icon: AlertCircle,
  },
];