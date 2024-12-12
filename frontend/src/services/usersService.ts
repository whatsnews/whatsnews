// src/services/usersService.ts
import { api } from './api';
import { API_ENDPOINTS } from '@/config/api';
import type { User, UserCreate, UserUpdate } from '@/types/api';

interface GetUsersParams {
  skip?: number;
  limit?: number;
}

export const usersService = {
  async getUsers(params?: GetUsersParams): Promise<User[]> {
    return api.get<User[]>(API_ENDPOINTS.users.list, params);
  },

  async createUser(data: UserCreate): Promise<User> {
    return api.post<User>(API_ENDPOINTS.users.create, data);
  },

  async updateCurrentUser(data: UserUpdate): Promise<User> {
    return api.put<User>(API_ENDPOINTS.users.me, data);
  },

  async getUserById(id: number): Promise<User> {
    return api.get<User>(API_ENDPOINTS.users.byId(id));
  },

  async getCurrentUser(): Promise<User> {
    return api.get<User>(API_ENDPOINTS.users.me);
  },

  async deleteUser(id: number): Promise<void> {
    return api.delete(API_ENDPOINTS.users.byId(id));
  },

  async getTimezones(): Promise<string[]> {
    return api.get<string[]>(API_ENDPOINTS.users.timezones);
  },

  async createInitialSuperuser(data: UserCreate): Promise<User> {
    try {
      const response = await api.post<User>(API_ENDPOINTS.users.initSuperuser, data);
      return response;
    } catch (error) {
      // If init superuser fails, try regular user creation
      if (error instanceof Error && error.message.includes('401')) {
        return this.createUser(data);
      }
      throw error;
    }
  },

  async updateUserSettings(data: {
    timezone?: string;
    news_generation_hour_1?: number;
    news_generation_hour_2?: number;
  }): Promise<User> {
    return api.put<User>(API_ENDPOINTS.users.me, data);
  }
};