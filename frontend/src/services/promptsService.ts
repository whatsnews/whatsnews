// src/services/promptsService.ts
import { api } from './api';
import { API_ENDPOINTS, resolveEndpoint } from '@/config/api';

export interface PromptStats {
  total_news: number;
  last_update?: string;
}

export interface Prompt {
  id: number;
  name: string;
  content: string;
  user_id: number;
  created_at: string;
  updated_at: string;
  stats?: PromptStats;
}

export interface PromptCreate {
  name: string;
  content: string;
  template_type?: string;
  custom_template?: string;
}

export interface PromptUpdate {
  name?: string;
  content?: string;
  template_type?: string;
  custom_template?: string;
}

export type TemplateType = 'DEFAULT' | 'CUSTOM' | string;

export interface GetPromptsParams {
  skip?: number;
  limit?: number;
  user_id?: number;
  search?: string;
}

export interface ValidateTemplateRequest {
  template_type: TemplateType;
  custom_template?: string;
}

class PromptsService {
  async createPrompt(data: PromptCreate): Promise<Prompt> {
    try {
      return await api.post<Prompt>(API_ENDPOINTS.prompts.create, data);
    } catch (error) {
      console.error('Error creating prompt:', error);
      throw this.handleError(error, 'Failed to create prompt');
    }
  }

  async getPrompts(params?: GetPromptsParams): Promise<Prompt[]> {
    try {
      return await api.get<Prompt[]>(API_ENDPOINTS.prompts.list, params);
    } catch (error) {
      console.error('Error fetching prompts:', error);
      throw this.handleError(error, 'Failed to fetch prompts');
    }
  }

  async getPromptById(id: number): Promise<Prompt> {
    try {
      const endpoint = resolveEndpoint(API_ENDPOINTS.prompts.detail, id);
      return await api.get<Prompt>(endpoint);
    } catch (error) {
      console.error(`Error fetching prompt ${id}:`, error);
      throw this.handleError(error, 'Failed to fetch prompt');
    }
  }

  async updatePrompt(id: number, data: PromptUpdate): Promise<Prompt> {
    try {
      const endpoint = resolveEndpoint(API_ENDPOINTS.prompts.detail, id);
      return await api.put<Prompt>(endpoint, data);
    } catch (error) {
      console.error(`Error updating prompt ${id}:`, error);
      throw this.handleError(error, 'Failed to update prompt');
    }
  }

  async deletePrompt(id: number): Promise<void> {
    try {
      const endpoint = resolveEndpoint(API_ENDPOINTS.prompts.detail, id);
      await api.delete(endpoint);
    } catch (error) {
      console.error(`Error deleting prompt ${id}:`, error);
      throw this.handleError(error, 'Failed to delete prompt');
    }
  }

  async getTemplates(): Promise<TemplateType[]> {
    try {
      return await api.get<TemplateType[]>(API_ENDPOINTS.prompts.templates);
    } catch (error) {
      console.error('Error fetching templates:', error);
      throw this.handleError(error, 'Failed to fetch templates');
    }
  }

  async getPromptNews(promptId: number): Promise<Prompt> {
    try {
      const endpoint = resolveEndpoint(API_ENDPOINTS.prompts.news, promptId);
      return await api.get<Prompt>(endpoint);
    } catch (error) {
      console.error(`Error fetching news for prompt ${promptId}:`, error);
      throw this.handleError(error, 'Failed to fetch prompt news');
    }
  }

  async validatePromptTemplate(data: ValidateTemplateRequest): Promise<boolean> {
    try {
      await api.post(API_ENDPOINTS.prompts.validateTemplate, data);
      return true;
    } catch (error) {
      console.error('Template validation error:', error);
      return false;
    }
  }

  async duplicatePrompt(id: number): Promise<Prompt> {
    try {
      const endpoint = resolveEndpoint(API_ENDPOINTS.prompts.duplicate, id);
      return await api.post<Prompt>(endpoint);
    } catch (error) {
      console.error(`Error duplicating prompt ${id}:`, error);
      throw this.handleError(error, 'Failed to duplicate prompt');
    }
  }

  private handleError(error: unknown, defaultMessage: string): Error {
    if (error instanceof Error) {
      return new Error(error.message || defaultMessage);
    }
    return new Error(defaultMessage);
  }
}

export const promptsService = new PromptsService();