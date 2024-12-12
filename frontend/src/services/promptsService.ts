// src/services/promptsService.ts
import { api } from './api';
import { API_ENDPOINTS } from '@/config/api';
import type { Prompt, PromptCreate, TemplateType } from '@/types/api';

interface GetPromptsParams {
  skip?: number;
  limit?: number;
}

export const promptsService = {
  async createPrompt(data: PromptCreate): Promise<Prompt> {
    return api.post<Prompt>(API_ENDPOINTS.prompts.create, data);
  },

  async getPrompts(params?: GetPromptsParams): Promise<Prompt[]> {
    return api.get<Prompt[]>(API_ENDPOINTS.prompts.list, params);
  },

  async getPromptById(id: number): Promise<Prompt> {
    return api.get<Prompt>(API_ENDPOINTS.prompts.detail(id));
  },

  async updatePrompt(id: number, data: Partial<PromptCreate>): Promise<Prompt> {
    return api.put<Prompt>(API_ENDPOINTS.prompts.detail(id), data);
  },

  async deletePrompt(id: number): Promise<void> {
    return api.delete(API_ENDPOINTS.prompts.detail(id));
  },

  async getTemplates(): Promise<TemplateType[]> {
    return api.get<TemplateType[]>(API_ENDPOINTS.prompts.templates);
  },

  async getPromptNews(promptId: number): Promise<Prompt> {
    return api.get<Prompt>(API_ENDPOINTS.prompts.news(promptId));
  },

  async validatePromptTemplate(data: {
    template_type: TemplateType;
    custom_template?: string;
  }): Promise<boolean> {
    try {
      await api.post(API_ENDPOINTS.prompts.validateTemplate, data);
      return true;
    } catch (error) {
      return false;
    }
  },

  async duplicatePrompt(id: number): Promise<Prompt> {
    return api.post<Prompt>(API_ENDPOINTS.prompts.duplicate(id));
  }
};