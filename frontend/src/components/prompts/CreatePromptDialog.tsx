// src/components/prompts/CreatePromptDialog.tsx
"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Plus } from "lucide-react";
import { promptsService } from "@/services/promptsService";
import type { TemplateType } from "@/types/api";

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  content: z.string().min(10, 'Content must be at least 10 characters'),
  template_type: z.enum(['summary', 'analysis', 'bullet_points', 'narrative'] as const),
  custom_template: z.string().optional(),
});

type PromptFormValues = z.infer<typeof formSchema>;

interface CreatePromptDialogProps {
  onPromptCreated: () => void;
}

export function CreatePromptDialog({ onPromptCreated }: CreatePromptDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<PromptFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      content: "",
      template_type: 'summary',
    },
  });

  const onSubmit = async (values: PromptFormValues) => {
    setIsLoading(true);
    setError(null);

    try {
      await promptsService.createPrompt(values);
      setOpen(false);
      form.reset();
      onPromptCreated();
    } catch (err) {
      console.error('Error creating prompt:', err);
      setError(err instanceof Error ? err.message : 'Failed to create prompt');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Prompt
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Prompt</DialogTitle>
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
                    <Input 
                      placeholder="Enter prompt name" 
                      {...field} 
                      disabled={isLoading}
                    />
                  </FormControl>
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
                      placeholder="Enter prompt content" 
                      {...field} 
                      disabled={isLoading}
                      rows={5}
                    />
                  </FormControl>
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
                  <FormControl>
                    <select 
                      {...field}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors"
                      disabled={isLoading}
                    >
                      <option value="summary">Summary</option>
                      <option value="analysis">Analysis</option>
                      <option value="bullet_points">Bullet Points</option>
                      <option value="narrative">Narrative</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? "Creating..." : "Create"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}