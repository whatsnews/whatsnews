// src/services/api.ts
import {
  API_BASE_URL,
  ContentTypes,
  type RequestConfig,
  buildApiUrl,
} from '@/config/api';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public detail?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface ApiRequestConfig extends RequestConfig {
  skipAuth?: boolean;
}

class ApiService {
  private async request<T>(
    endpoint: string,
    config: ApiRequestConfig = {}
  ): Promise<T> {
    try {
      const url = buildApiUrl(endpoint, config.params);
      
      const requestHeaders: HeadersInit = {
        'Accept': ContentTypes.JSON,
        'Content-Type': ContentTypes.JSON,
        ...config.headers,
      };

      // Only add auth header if not explicitly skipped
      if (!config.skipAuth) {
        const token = this.getToken();
        if (token) {
          requestHeaders['Authorization'] = `Bearer ${token}`;
        }
      }

      const response = await fetch(url, {
        method: config.method || 'GET',
        headers: requestHeaders,
        body: config.body ? JSON.stringify(config.body) : undefined,
        credentials: 'include',
      });

      const data = await response.json();

      // For public endpoints, don't redirect on 401
      if (response.status === 401 && !config.skipAuth) {
        this.clearToken();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }

      if (!response.ok) {
        throw new ApiError(
          response.status,
          data.detail || 'Request failed',
          typeof data === 'object' ? JSON.stringify(data) : data
        );
      }

      return data as T;

    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      // Network or fetch errors
      if (error instanceof Error && error.name === 'TypeError') {
        throw new ApiError(
          503,
          'Network error',
          error.message
        );
      }

      // Unknown errors
      throw new ApiError(
        500,
        'Internal error',
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
    }
  }

  private getToken(): string | undefined {
    if (typeof document === 'undefined') return undefined;
    return document.cookie
      .split('; ')
      .find(row => row.startsWith('token='))
      ?.split('=')[1];
  }

  private clearToken(): void {
    if (typeof document === 'undefined') return;
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
  }

  async get<T>(
    endpoint: string, 
    params?: Record<string, string>,
    config: ApiRequestConfig = {}
  ): Promise<T> {
    return this.request<T>(endpoint, { 
      method: 'GET',
      params,
      ...config
    });
  }

  async post<T>(
    endpoint: string,
    data?: any,
    config: ApiRequestConfig = {}
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data,
      ...config
    });
  }

  async put<T>(
    endpoint: string,
    data?: any,
    config: ApiRequestConfig = {}
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data,
      ...config
    });
  }

  async delete<T>(
    endpoint: string,
    config: ApiRequestConfig = {}
  ): Promise<T> {
    return this.request<T>(endpoint, { 
      method: 'DELETE',
      ...config
    });
  }
}

export const api = new ApiService();