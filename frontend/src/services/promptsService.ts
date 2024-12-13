// src/services/promptsService.ts
import { api } from './api';
import { API_ENDPOINTS } from '@/config/api';
import type { 
  Prompt, 
  PromptCreate, 
  PromptUpdate, 
  PromptWithStats,
  TemplateType,
  VisibilityType 
} from '@/types/api';
import { auth } from '@/lib/auth';

export interface NewsStats {
  total: number;
  hourly: number;
  daily: number;
  last_update?: string;
}

export interface PromptListParams {
  skip?: number;
  limit?: number;
  search?: string;
  include_internal?: boolean;
  include_public?: boolean;
}

export interface TemplateValidationResponse {
  valid: boolean;
  errors?: Record<string, string[]>;
}

interface RequestOptions {
  requireAuth?: boolean;
}

class PromptsService {
  private async request<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data?: any,
    params?: Record<string, string>,
    options: RequestOptions = { requireAuth: true }
  ): Promise<T> {
    try {
      const config: any = {
        method,
        params,
      };

      if (data) {
        config.body = data;
      }

      if (!options.requireAuth) {
        config.skipAuth = true;
      }

      if (method === 'GET') {
        return await api.get<T>(endpoint, params, config);
      } else if (method === 'POST') {
        return await api.post<T>(endpoint, data, config);
      } else if (method === 'PUT') {
        return await api.put<T>(endpoint, data, config);
      } else {
        return await api.delete<T>(endpoint, config);
      }
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  async createPrompt(data: PromptCreate): Promise<Prompt> {
    return this.request<Prompt>(API_ENDPOINTS.prompts.create, 'POST', data);
  }

  async getPrompts(params?: PromptListParams): Promise<Prompt[]> {
    return this.request<Prompt[]>(API_ENDPOINTS.prompts.list, 'GET', undefined, {
      skip: params?.skip?.toString(),
      limit: params?.limit?.toString(),
      search: params?.search,
      include_internal: params?.include_internal?.toString(),
      include_public: params?.include_public?.toString(),
    });
  }

  async getPublicPrompts(params?: PromptListParams): Promise<Prompt[]> {
    return this.request<Prompt[]>(
      API_ENDPOINTS.prompts.public,
      'GET',
      undefined,
      {
        skip: params?.skip?.toString(),
        limit: params?.limit?.toString(),
        search: params?.search,
      },
      { requireAuth: false }
    );
  }

  async getInternalPrompts(params?: PromptListParams): Promise<Prompt[]> {
    return this.request<Prompt[]>(API_ENDPOINTS.prompts.internal, 'GET', undefined, {
      skip: params?.skip?.toString(),
      limit: params?.limit?.toString(),
      search: params?.search,
    });
  }

  async getPromptById(id: number): Promise<PromptWithStats> {
    // Initially try without auth for public prompts
    try {
      return await this.request<PromptWithStats>(
        API_ENDPOINTS.prompts.detail(id),
        'GET',
        undefined,
        undefined,
        { requireAuth: false }
      );
    } catch (error: any) {
      if (error?.status === 401 || error?.status === 403) {
        // If unauthorized, retry with auth if user is logged in
        if (auth.isAuthenticated()) {
          return this.request<PromptWithStats>(API_ENDPOINTS.prompts.detail(id));
        }
      }
      throw error;
    }
  }

  async getPromptByPath(username: string, slug: string): Promise<PromptWithStats> {
    // First try without authentication for public prompts
    try {
      return await this.request<PromptWithStats>(
        API_ENDPOINTS.prompts.byPath(username, slug),
        'GET',
        undefined,
        undefined,
        { requireAuth: false }
      );
    } catch (error: any) {
      // If unauthorized and user is logged in, retry with auth
      if ((error?.status === 401 || error?.status === 403) && auth.isAuthenticated()) {
        return this.request<PromptWithStats>(
          API_ENDPOINTS.prompts.byPath(username, slug)
        );
      }
      throw error;
    }
  }

  async updatePrompt(id: number, data: PromptUpdate): Promise<Prompt> {
    return this.request<Prompt>(
      API_ENDPOINTS.prompts.update(id),
      'PUT',
      data
    );
  }

  async deletePrompt(id: number): Promise<void> {
    return this.request<void>(API_ENDPOINTS.prompts.delete(id), 'DELETE');
  }

  async getTemplates(): Promise<TemplateType[]> {
    return this.request<TemplateType[]>(
      API_ENDPOINTS.prompts.templates,
      'GET',
      undefined,
      undefined,
      { requireAuth: false }
    );
  }

  async validateTemplate(
    template_type: TemplateType,
    custom_template?: string
  ): Promise<TemplateValidationResponse> {
    return this.request<TemplateValidationResponse>(
      API_ENDPOINTS.prompts.validateTemplate,
      'POST',
      {
        template_type,
        custom_template,
      }
    );
  }

  async getPromptNews(promptId: number): Promise<any> {
    return this.request<any>(API_ENDPOINTS.prompts.news(promptId));
  }

  // Helper Methods
  isValidTemplateType(type: string): type is TemplateType {
    return ['summary', 'analysis', 'bullet_points', 'narrative'].includes(type);
  }

  isValidVisibilityType(type: string): type is VisibilityType {
    return ['private', 'internal', 'public'].includes(type);
  }

  getTemplateTypeLabel(type: TemplateType): string {
    const labels: Record<TemplateType, string> = {
      summary: 'Summary',
      analysis: 'Analysis',
      bullet_points: 'Bullet Points',
      narrative: 'Narrative'
    };
    return labels[type] || type;
  }

  getVisibilityLabel(type: VisibilityType): string {
    const labels: Record<VisibilityType, string> = {
      private: 'Private',
      internal: 'Internal',
      public: 'Public'
    };
    return labels[type] || type;
  }

  getVisibilityDescription(type: VisibilityType): string {
    const descriptions: Record<VisibilityType, string> = {
      private: 'Only you can see this prompt',
      internal: 'All signed-in users can see this prompt',
      public: 'Anyone can see this prompt'
    };
    return descriptions[type] || '';
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString();
  }

  canAccessPrompt(
    prompt: Prompt,
    isAuthenticated: boolean = auth.isAuthenticated()
  ): boolean {
    const isOwner = isAuthenticated && prompt.user_id === (auth as any).getCurrentUserId();
    return prompt.visibility === 'public' || 
           (prompt.visibility === 'internal' && isAuthenticated) ||
           (prompt.visibility === 'private' && isOwner);
  }
}

export const promptsService = new PromptsService();