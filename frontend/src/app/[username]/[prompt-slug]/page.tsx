// src/app/[username]/[prompt-slug]/page.tsx
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { buttonVariants } from '@/components/ui/button';
import { VisibilityBadge } from '@/components/ui/visibility-badge';
import { LoginPromptOverlay } from '@/components/prompts/LoginPromptOverlay';
import { FileText, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { promptsService } from '@/services/promptsService';
import { serverAuth } from '@/lib/server-auth';
import { auth } from '@/lib/auth';

interface PageProps {
  params: {
    username: string;
    'prompt-slug': string;
  };
}

async function getPromptData(username: string, slug: string, token?: string) {
  try {
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const prompt = await promptsService.getPromptByPath(username, slug);
    return prompt;
  } catch (error) {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const prompt = await getPromptData(params.username, params['prompt-slug']);

  if (!prompt) {
    return {
      title: 'Prompt Not Found',
    };
  }

  return {
    title: prompt.name,
    description: prompt.content.substring(0, 160),
  };
}

export default async function PromptPage({ params }: PageProps) {
  const token = serverAuth.getServerToken();
  const prompt = await getPromptData(params.username, params['prompt-slug'], token);

  if (!prompt) {
    notFound();
  }

  const isAuthenticated = !!token;
  const canAccess = auth.canAccessPrompt(prompt.visibility, isAuthenticated);

  return (
    <div className="container max-w-4xl py-8">
      <Card className="relative">
        {!canAccess && <LoginPromptOverlay visibility={prompt.visibility} />}
        
        <CardHeader className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-2xl">{prompt.name}</CardTitle>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Link 
                  href={`/${params.username}`}
                  className="hover:underline"
                >
                  @{params.username}
                </Link>
                <span>•</span>
                <VisibilityBadge visibility={prompt.visibility} />
              </div>
            </div>
            
            {canAccess && isAuthenticated && (
              <Link
                href={`/prompts/${prompt.id}`}
                className={buttonVariants({ variant: "outline" })}
              >
                <FileText className="mr-2 h-4 w-4" />
                Manage Prompt
              </Link>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {canAccess ? (
            <>
              <div className="prose dark:prose-invert max-w-none">
                <p>{prompt.content}</p>
              </div>

              {prompt.news_count && prompt.news_count.total > 0 ? (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">Generated News</h2>
                  <div className="grid gap-4">
                    {/* News items would be rendered here */}
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        This prompt has generated {prompt.news_count.total} news items.
                        {!isAuthenticated && (
                          <> <Link href="/login" className="underline">Log in</Link> to view them.</>
                        )}
                      </AlertDescription>
                    </Alert>
                  </div>
                </div>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No news items have been generated for this prompt yet.
                  </AlertDescription>
                </Alert>
              )}
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}