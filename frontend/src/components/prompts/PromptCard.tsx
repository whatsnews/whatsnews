// src/components/prompts/PromptCard.tsx
import { FC, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Trash, Edit, Copy, Clock, FileText, Globe, Lock, Users } from 'lucide-react';
import { promptsService, Prompt, PromptWithStats } from '@/services/promptsService';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import { VisibilityBadge } from '@/components/ui/visibility-badge';

interface PromptCardProps {
  prompt: Prompt | PromptWithStats;
  onEdit?: (prompt: Prompt) => void;
  onDelete?: (id: number) => void;
  disabled?: boolean;
  className?: string;
  showActions?: boolean;
}

const VisibilityIcon = {
  private: Lock,
  internal: Users,
  public: Globe,
} as const;

export const PromptCard: FC<PromptCardProps> = ({
  prompt,
  onEdit,
  onDelete,
  disabled = false,
  className = '',
  showActions = true,
}) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Safe path generation
  const getPromptPath = () => {
    if (!prompt.slug) return '#';
    // For public prompts without user info
    if (!prompt.user?.username) {
      return `/prompts/${prompt.id}`;
    }
    return `/${prompt.user.username}/${prompt.slug}`;
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(prompt);
    } else {
      router.push(`/prompts/${prompt.id}`);
    }
  };

  const handleDelete = async () => {
    if (!onDelete || disabled) return;

    try {
      setIsLoading(true);
      setError(null);
      await promptsService.deletePrompt(prompt.id);
      onDelete(prompt.id);
    } catch (err) {
      setError('Failed to delete prompt');
      console.error('Error deleting prompt:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    const path = getPromptPath();
    const url = `${window.location.origin}${path}`;
    navigator.clipboard.writeText(url);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getNewsCount = () => {
    if ('news_count' in prompt) {
      return prompt.news_count.total;
    }
    return 0;
  };

  const promptPath = getPromptPath();

  return (
    <Card className={`relative overflow-hidden ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}
      
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-2">
          <Link 
            href={promptPath}
            className="hover:underline font-medium text-lg"
          >
            {prompt.name}
          </Link>
          
          <div className="flex items-center space-x-2 text-sm">
            {prompt.user?.username && (
              <>
                <Link 
                  href={`/${prompt.user.username}`}
                  className="text-muted-foreground hover:underline"
                >
                  @{prompt.user.username}
                </Link>
                <span className="text-muted-foreground">•</span>
              </>
            )}
            <span className="text-muted-foreground">
              {formatDate(prompt.created_at)}
            </span>
            <VisibilityBadge visibility={prompt.visibility} />
          </div>
        </div>

        {showActions && prompt.user?.username && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild disabled={disabled}>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleEdit}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={copyToClipboard}>
                <Copy className="mr-2 h-4 w-4" />
                Copy Link
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardHeader>

      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-3">
          {prompt.content}
        </p>
        
        {error && (
          <Alert variant="destructive" className="mt-2">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>

      <CardFooter className="flex justify-between">
        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
          <div className="flex items-center">
            <Clock className="mr-1 h-4 w-4" />
            <span>
              {promptsService.getTemplateTypeLabel(prompt.template_type)}
            </span>
          </div>
          <div className="flex items-center">
            <FileText className="mr-1 h-4 w-4" />
            <span>{getNewsCount()} news items</span>
          </div>
        </div>

        <Link
          href={promptPath}
          className="text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          View Details →
        </Link>
      </CardFooter>
    </Card>
  );
};