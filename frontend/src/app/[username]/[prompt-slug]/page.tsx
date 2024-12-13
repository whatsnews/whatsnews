// src/app/[username]/[prompt-slug]/page.tsx
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { PromptView } from '@/components/prompts/PromptView';
import { promptsService } from '@/services/promptsService';
import { serverAuth } from '@/lib/server-auth';
import type { PromptWithStats } from '@/types/api';

interface PageProps {
  params: {
    username: string;
    'prompt-slug': string;
  };
}

async function getPromptData(
  username: string, 
  slug: string,
  token?: string
): Promise<PromptWithStats | null> {
  try {
    // First try without auth for public prompts
    const prompt = await promptsService.getPromptByPath(username, slug);
    return prompt;
  } catch (error: any) {
    // If unauthorized and we have a token, retry with auth
    if (error?.status === 401 && token) {
      try {
        const prompt = await promptsService.getPromptByPath(username, slug, true);
        return prompt;
      } catch (retryError) {
        console.error('Error fetching prompt with auth:', retryError);
        return null;
      }
    }
    console.error('Error fetching prompt:', error);
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username, 'prompt-slug': slug } = params;
  const token = await serverAuth.getServerToken();
  const prompt = await getPromptData(username, slug, token);

  if (!prompt) {
    return {
      title: 'Prompt Not Found',
      description: 'The requested prompt could not be found.'
    };
  }

  return {
    title: `${prompt.name} by @${username}`,
    description: prompt.content.substring(0, 160),
    openGraph: {
      title: prompt.name,
      description: prompt.content.substring(0, 160),
      type: 'article',
      authors: [username],
    },
  };
}

export default async function PromptPage({ params }: PageProps) {
  const { username, 'prompt-slug': slug } = params;
  const token = await serverAuth.getServerToken();
  const prompt = await getPromptData(username, slug, token);
  const currentUser = token ? await serverAuth.getCurrentUser() : null;

  if (!prompt) {
    notFound();
  }

  const isOwner = currentUser?.id === prompt.user_id;
  const canAccess = promptsService.canAccessPrompt(prompt, !!currentUser, isOwner);

  if (!canAccess) {
    return (
      <div className="container max-w-4xl py-8">
        <div className="bg-destructive/10 text-destructive px-4 py-2 rounded">
          You don't have permission to view this prompt.
          {!currentUser && (
            <p className="text-sm mt-2">
              Please <a href="/login" className="underline">log in</a> to access this content.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8">
      <PromptView 
        prompt={prompt}
        isOwner={isOwner}
        isAuthenticated={!!currentUser}
      />
    </div>
  );
}