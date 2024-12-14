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

  // Update in src/services/promptsService.ts

async getPublicPrompts(params?: PromptListParams): Promise<Prompt[]> {
  try {
    const queryParams = {
      skip: params?.skip?.toString(),
      limit: params?.limit?.toString(),
      search: params?.search,
      include_user: 'true'  // Add this parameter
    };

    return await api.get<Prompt[]>(
      API_ENDPOINTS.prompts.public,
      queryParams,
      { skipAuth: true }
    );
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
      return await api.get<PromptWithStats>(API_ENDPOINTS.prompts.detail(id));
    } catch (error) {
      console.error(`Error fetching prompt ${id}:`, error);
      throw error;
    }
  }

  async getPromptByPath(
    username: string, 
    slug: string, 
    withAuth: boolean = false
  ): Promise<PromptWithStats> {
    try {
      const endpoint = API_ENDPOINTS.prompts.byPath(username, slug);
      const config = withAuth ? {} : { skipAuth: true };
      
      return await api.get<PromptWithStats>(endpoint, undefined, config);
    } catch (error) {
      console.error(`Error fetching prompt ${username}/${slug}:`, error);
      throw error;
    }
  }

  async updatePrompt(id: number, data: PromptUpdate): Promise<Prompt> {
    try {
      return await api.put<Prompt>(API_ENDPOINTS.prompts.update(id), data);
    } catch (error) {
      console.error(`Error updating prompt ${id}:`, error);
      throw error;
    }
  }

  async deletePrompt(id: number): Promise<void> {
    try {
      await api.delete(API_ENDPOINTS.prompts.delete(id));
    } catch (error) {
      console.error(`Error deleting prompt ${id}:`, error);
      throw error;
    }
  }

  async getTemplates(): Promise<TemplateType[]> {
    try {
      return await api.get<TemplateType[]>(
        API_ENDPOINTS.prompts.templates,
        undefined,
        { skipAuth: true }
      );
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

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString();
  }
}

export const promptsService = new PromptsService();