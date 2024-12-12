// src/services/promptsService.ts

import { api } from './api';
import { API_ENDPOINTS } from '@/config/api';

export type TemplateType = 'summary' | 'analysis' | 'bullet_points' | 'narrative';

export interface NewsStats {
  total: number;
  hourly: number;
  daily: number;
  last_update?: string;
}

export interface Prompt {
  id: number;
  name: string;
  content: string;
  template_type: TemplateType;
  custom_template?: string;
  user_id: number;
  created_at: string;
  updated_at: string;
}

export interface PromptWithStats extends Prompt {
  news_count: NewsStats;
}

export interface PromptCreate {
  name: string;
  content: string;
  template_type: TemplateType;
  custom_template?: string;
}

export interface PromptUpdate {
  name?: string;
  content?: string;
  template_type?: TemplateType;
  custom_template?: string;
}

export interface PromptListParams {
  skip?: number;
  limit?: number;
  search?: string;
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
      });
    } catch (error) {
      console.error('Error fetching prompts:', error);
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

  async getPromptNews(promptId: number): Promise<any> {
    try {
      const endpoint = API_ENDPOINTS.prompts.news(promptId);
      return await api.get(endpoint);
    } catch (error) {
      console.error(`Error fetching news for prompt ${promptId}:`, error);
      throw error;
    }
  }

  // Helper methods
  isValidTemplateType(type: string): type is TemplateType {
    return ['summary', 'analysis', 'bullet_points', 'narrative'].includes(type);
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

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString();
  }
}

export const promptsService = new PromptsService();