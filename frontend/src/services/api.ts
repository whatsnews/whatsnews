// src/services/api.ts
import {
  API_BASE_URL,
  ApiError,
  ApiResponse,
  ContentTypes,
  HttpMethod,
  RequestConfig,
  buildApiUrl,
} from '@/config/api';

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public detail?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

class ApiService {
  private async request<T>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<T> {
    const {
      method = 'GET',
      headers = {},
      body,
      params,
    } = config;

    try {
      const url = buildApiUrl(endpoint, params);
      const token = this.getToken();
      
      const requestHeaders: HeadersInit = {
        'Accept': ContentTypes.JSON,
        'Content-Type': ContentTypes.JSON,
        ...headers,
      };

      if (token) {
        requestHeaders['Authorization'] = `Bearer ${token}`;
      }

      const requestConfig: RequestInit = {
        method,
        headers: requestHeaders,
        credentials: 'include',
      };

      if (body) {
        requestConfig.body = typeof body === 'string' ? body : JSON.stringify(body);
      }

      const response = await fetch(url, requestConfig);
      
      if (response.status === 204) {
        return {} as T;
      }

      if (response.status === 401) {
        this.clearToken();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        throw new ApiError(401, 'Unauthorized access');
      }

      const contentType = response.headers.get('content-type');
      let data;
      
      try {
        data = contentType?.includes('application/json') 
          ? await response.json()
          : await response.text();
      } catch {
        throw new ApiError(
          response.status,
          'Invalid response format',
          'Failed to parse server response'
        );
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

  async get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', params });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  async postForm<T>(endpoint: string, data: Record<string, string>): Promise<T> {
    const formData = new URLSearchParams();
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, value);
    });

    return this.request<T>(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': ContentTypes.FORM,
      },
      body: formData.toString(),
    });
  }
}

export const api = new ApiService();