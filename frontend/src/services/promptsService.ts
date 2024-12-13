// src/services/promptsService.ts
import { api } from './api';
import { API_ENDPOINTS } from '@/config/api';
import type { 
  Prompt, 
  PromptCreate, 
  PromptUpdate, 
  PromptWithStats,
  PromptListResponse,
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

class PromptsService {
  // CRUD Operations
  async createPrompt(data: PromptCreate): Promise<Prompt> {
    try {
      return await api.post<Prompt>(API_ENDPOINTS.prompts.create, data);
    } catch (error) {
      console.error('Error creating prompt:', error);
      throw error;
    }
  }

  async getPrompts(params?: PromptListParams): Promise<Prompt[]> {
    try {
      return await api.get<Prompt[]>(API_ENDPOINTS.prompts.list, {
        skip: params?.skip?.toString(),
        limit: params?.limit?.toString(),
        search: params?.search,
        include_internal: params?.include_internal?.toString(),
        include_public: params?.include_public?.toString(),
      });
    } catch (error) {
      console.error('Error fetching prompts:', error);
      throw error;
    }
  }

  // Public Access Methods
  async getPublicPrompts(params?: PromptListParams): Promise<Prompt[]> {
    try {
      return await api.get<Prompt[]>(API_ENDPOINTS.prompts.public, {
        skip: params?.skip?.toString(),
        limit: params?.limit?.toString(),
        search: params?.search,
      });
    } catch (error) {
      console.error('Error fetching public prompts:', error);
      throw error;
    }
  }

  async getInternalPrompts(params?: PromptListParams): Promise<Prompt[]> {
    try {
      return await api.get<Prompt[]>(API_ENDPOINTS.prompts.internal, {
        skip: params?.skip?.toString(),
        limit: params?.limit?.toString(),
        search: params?.search,
      });
    } catch (error) {
      console.error('Error fetching internal prompts:', error);
      throw error;
    }
  }

  async getPromptById(id: number): Promise<PromptWithStats> {
    try {
      const endpoint = API_ENDPOINTS.prompts.detail(id);
      return await api.get<PromptWithStats>(endpoint);
    } catch (error) {
      console.error(`Error fetching prompt ${id}:`, error);
      throw error;
    }
  }

  async getPromptByPath(username: string, slug: string): Promise<PromptWithStats> {
    try {
      const endpoint = API_ENDPOINTS.prompts.byPath(username, slug);
      return await api.get<PromptWithStats>(endpoint);
    } catch (error) {
      console.error(`Error fetching prompt ${username}/${slug}:`, error);
      throw error;
    }
  }

  async updatePrompt(id: number, data: PromptUpdate): Promise<Prompt> {
    try {
      const endpoint = API_ENDPOINTS.prompts.update(id);
      return await api.put<Prompt>(endpoint, data);
    } catch (error) {
      console.error(`Error updating prompt ${id}:`, error);
      throw error;
    }
  }

  async deletePrompt(id: number): Promise<void> {
    try {
      const endpoint = API_ENDPOINTS.prompts.delete(id);
      await api.delete(endpoint);
    } catch (error) {
      console.error(`Error deleting prompt ${id}:`, error);
      throw error;
    }
  }

  // Template Management
  async getTemplates(): Promise<TemplateType[]> {
    try {
      return await api.get<TemplateType[]>(API_ENDPOINTS.prompts.templates);
    } catch (error) {
      console.error('Error fetching templates:', error);
      throw error;
    }
  }

  async validateTemplate(
    template_type: TemplateType,
    custom_template?: string
  ): Promise<TemplateValidationResponse> {
    try {
      return await api.post<TemplateValidationResponse>(
        API_ENDPOINTS.prompts.validateTemplate,
        {
          template_type,
          custom_template,
        }
      );
    } catch (error) {
      console.error('Error validating template:', error);
      throw error;
    }
  }

  // News Management
  async getPromptNews(promptId: number): Promise<any> {
    try {
      const endpoint = API_ENDPOINTS.prompts.news(promptId);
      return await api.get(endpoint);
    } catch (error) {
      console.error(`Error fetching news for prompt ${promptId}:`, error);
      throw error;
    }
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

  // Visibility Helpers
  canAccessPrompt(
    prompt: Prompt,
    isAuthenticated: boolean = auth.isAuthenticated()
  ): boolean {
    const isOwner = isAuthenticated && prompt.user_id === auth.getCurrentUserId();
    const visibility = auth.checkVisibility(prompt.visibility, isAuthenticated, isOwner);
    return visibility.canView;
  }
}

export const promptsService = new PromptsService();