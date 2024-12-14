// src/services/newsService.ts
import { api } from './api';
import { API_ENDPOINTS } from '@/config/api';
import type { 
  News, 
  NewsCreate, 
  NewsResponse, 
  UpdateFrequency,
  NewsListResponse
} from '@/types/api';

interface GetNewsParams {
  prompt_id?: number;
  frequency?: UpdateFrequency;
  skip?: number;
  limit?: number;
}

interface GenerateNewsParams {
  prompt_id: number;
  frequency: UpdateFrequency;
}

export const newsService = {
  // Public news methods
  async getPublicNews(params?: GetNewsParams): Promise<NewsListResponse> {
    return api.get<NewsListResponse>(
      API_ENDPOINTS.news.public,
      params as Record<string, string>,
      { skipAuth: true }  // Skip authentication for public endpoints
    );
  },

  async getLatestPublicNews(limit: number = 10, frequency?: UpdateFrequency): Promise<News[]> {
    const params = {
      limit: limit.toString(),
      ...(frequency && { frequency })
    };
    return api.get<News[]>(
      API_ENDPOINTS.news.publicLatest,
      params,
      { skipAuth: true }
    );
  },

  async getNewsByPromptPath(
    username: string,
    promptSlug: string,
    params?: Omit<GetNewsParams, 'prompt_id'>
  ): Promise<NewsListResponse> {
    return api.get<NewsListResponse>(
      API_ENDPOINTS.news.byPromptPath(username, promptSlug),
      params as Record<string, string>,
      { skipAuth: true }  // Will use token if available
    );
  },

  // Authenticated news methods
  async getNews(params?: GetNewsParams): Promise<News[]> {
    return api.get<News[]>(API_ENDPOINTS.news.list, params as Record<string, string>);
  },

  async getNewsById(id: number): Promise<News> {
    return api.get<News>(API_ENDPOINTS.news.detail(id));
  },

  async createNews(data: NewsCreate): Promise<NewsResponse> {
    return api.post<NewsResponse>(API_ENDPOINTS.news.create, data);
  },

  async deleteNews(id: number): Promise<void> {
    return api.delete(API_ENDPOINTS.news.detail(id));
  },

  async getLatestNews(promptId: number, frequency: UpdateFrequency): Promise<News> {
    return api.get<News>(
      API_ENDPOINTS.news.latest(promptId),
      { frequency }
    );
  },

  async generateNews(params: GenerateNewsParams): Promise<NewsResponse> {
    return api.post<NewsResponse>(API_ENDPOINTS.news.create, params);
  },

  async getNewsByPrompt(promptId: number, frequency?: UpdateFrequency): Promise<News[]> {
    const params: GetNewsParams = {
      prompt_id: promptId,
      frequency,
      limit: 100
    };
    return api.get<News[]>(API_ENDPOINTS.news.list, params as Record<string, string>);
  },

  async refreshNews(promptId: number, frequency: UpdateFrequency): Promise<NewsResponse> {
    const params: GenerateNewsParams = {
      prompt_id: promptId,
      frequency
    };
    return this.generateNews(params);
  },

  formatFrequency(frequency: UpdateFrequency): string {
    switch (frequency) {
      case "hourly":
        return "Hourly";
      case "daily":
        return "Daily";
      default:
        return frequency.replace('_', ' ');
    }
  },

  // Helper methods
  getFrequencyLabel(frequency: UpdateFrequency): string {
    return frequency.charAt(0).toUpperCase() + frequency.slice(1);
  }
};