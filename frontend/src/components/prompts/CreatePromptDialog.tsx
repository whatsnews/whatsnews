// src/components/prompts/CreatePromptDialog.tsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Globe, Lock, Users, Plus, AlertCircle, Loader2 } from 'lucide-react';
import { promptsService } from '@/services/promptsService';
import { VisibilityType } from '@/types/api';

// Form validation schema
const promptSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name is too long'),
  content: z.string().min(1, 'Content is required').max(1000, 'Content is too long'),
  template_type: z.enum(['summary', 'analysis', 'bullet_points', 'narrative'] as const),
  visibility: z.enum(['private', 'internal', 'public'] as const),
  custom_template: z.string().optional(),
});

type PromptFormValues = z.infer<typeof promptSchema>;

interface CreatePromptDialogProps {
  onPromptCreated?: () => void;
  disabled?: boolean;
}

const visibilityOptions = [
  {
    value: 'private' as VisibilityType,
    label: 'Private',
    description: 'Only you can see this prompt',
    icon: Lock,
    className: 'bg-slate-100 hover:bg-slate-200'
  },
  {
    value: 'internal' as VisibilityType,
    label: 'Internal',
    description: 'All signed-in users can see this prompt',
    icon: Users,
    className: 'bg-blue-100 hover:bg-blue-200'
  },
  {
    value: 'public' as VisibilityType,
    label: 'Public',
    description: 'Anyone with the link can see this prompt',
    icon: Globe,
    className: 'bg-green-100 hover:bg-green-200'
  }
] as const;

export function CreatePromptDialog({
  onPromptCreated,
  disabled = false,
}: CreatePromptDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<PromptFormValues>({
    resolver: zodResolver(promptSchema),
    defaultValues: {
      name: '',
      content: '',
      template_type: 'summary',
      visibility: 'private',
      custom_template: '',
    },
  });

  const onSubmit = async (values: PromptFormValues) => {
    try {
      setIsLoading(true);
      setError(null);

      // Validate template if it's narrative type
      if (values.template_type === 'narrative' && values.custom_template) {
        const validationResult = await promptsService.validateTemplate(
          values.template_type,
          values.custom_template
        );
        if (!validationResult.valid) {
          setError('Invalid template format');
          return;
        }
      }

      await promptsService.createPrompt(values);
      setOpen(false);
      form.reset();
      onPromptCreated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create prompt');
    } finally {
      setIsLoading(false);
    }
  };

  const showCustomTemplate = form.watch('template_type') === 'narrative';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={disabled}>
          <Plus className="mr-2 h-4 w-4" />
          New Prompt
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Prompt</DialogTitle>
          <DialogDescription>
            Create a new prompt for news generation. Choose a template type and configure your prompt.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Daily Tech News" {...field} />
                  </FormControl>
                  <FormDescription>
                    A descriptive name for your prompt
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter your prompt content..."
                      className="h-20"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    The content to analyze and generate news from
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="template_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Template Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a template type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="summary">Summary</SelectItem>
                      <SelectItem value="analysis">Analysis</SelectItem>
                      <SelectItem value="bullet_points">Bullet Points</SelectItem>
                      <SelectItem value="narrative">Narrative</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Choose how you want your news to be formatted
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="visibility"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Visibility</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select visibility level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {visibilityOptions.map(option => (
                        <SelectItem 
                          key={option.value} 
                          value={option.value}
                          className={option.className}
                        >
                          <div className="flex items-center space-x-2">
                            <option.icon className="h-4 w-4" />
                            <div>
                              <div className="font-medium">{option.label}</div>
                              <div className="text-xs text-muted-foreground">
                                {option.description}
                              </div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Control who can access this prompt
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {showCustomTemplate && (
              <FormField
                control={form.control}
                name="custom_template"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custom Template</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter your custom template..."
                        className="h-20"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Use {`{placeholder}`} syntax for dynamic content
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Prompt
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}