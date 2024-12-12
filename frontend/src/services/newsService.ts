// src/services/newsService.ts
import { api } from './api';
import { API_ENDPOINTS } from '@/config/api';
import type { News, NewsCreate, NewsResponse, UpdateFrequency } from '@/types/api';

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
  async getNews(params?: GetNewsParams): Promise<News[]> {
    return api.get<News[]>(API_ENDPOINTS.news.list, params);
  },

  async getNewsById(id: number): Promise<News> {
    return api.get<News>(API_ENDPOINTS.news.byId(id));
  },

  async createNews(data: NewsCreate): Promise<NewsResponse> {
    return api.post<NewsResponse>(API_ENDPOINTS.news.create, data);
  },

  async deleteNews(id: number): Promise<void> {
    return api.delete(API_ENDPOINTS.news.byId(id));
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
    return api.get<News[]>(API_ENDPOINTS.news.list, params);
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
      case "30_minutes":
        return "30 minutes";
      case "hourly":
        return "Hourly";
      case "daily":
        return "Daily";
      default:
        return frequency.replace('_', ' ');
    }
  }
};