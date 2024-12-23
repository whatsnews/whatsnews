// src/app/page.tsx
import { cookies } from 'next/headers';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { promptsService } from '@/services/promptsService';
import { serverAuth } from '@/lib/server-auth';
import { PublicPromptCard } from '@/components/prompts/PublicPromptCard';

export default async function HomePage() {
  const isAuthenticated = await serverAuth.isAuthenticated();

  try {
    // Fetch public prompts for the landing page
    const publicPrompts = await promptsService.getPublicPrompts({ limit: 6 });

    return (
      <div className="container mx-auto py-12 space-y-12">
        {/* Hero Section */}
        <section className="text-center space-y-6">
          <h1 className="text-4xl font-bold sm:text-5xl md:text-6xl">
            Your News, Your Way
          </h1>
          <p className="text-xl text-muted-foreground max-w-[700px] mx-auto">
            Create custom prompts to aggregate and summarize news from any source.
          </p>
          <div className="flex justify-center gap-4">
            {!isAuthenticated ? (
              <>
                <Button asChild size="lg">
                  <Link href="/signup">Get Started</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/login">Sign In</Link>
                </Button>
              </>
            ) : (
              <Button asChild size="lg">
                <Link href="/news">Go to Dashboard</Link>
              </Button>
            )}
          </div>
        </section>

        {/* Public Prompts Section */}
        {publicPrompts.length > 0 && (
          <section className="space-y-6">
            <h2 className="text-3xl font-bold text-center">
              Featured Public Prompts
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {publicPrompts.map((prompt) => (
                <PublicPromptCard 
                  key={prompt.id} 
                  prompt={prompt} 
                />
              ))}
            </div>
          </section>
        )}
      </div>
    );
  } catch (error) {
    console.error('Error loading public prompts:', error);
    return (
      <div className="container mx-auto py-12 text-center">
        <h1 className="text-4xl font-bold">Welcome to WhatsNews</h1>
        <p className="mt-4 text-muted-foreground">
          Something went wrong loading the public prompts.
        </p>
      </div>
    );
  }
}