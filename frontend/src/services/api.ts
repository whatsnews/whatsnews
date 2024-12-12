// src/services/api.ts
import { API_BASE_URL } from '@/config/api';

interface RequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
}

interface QueryParams {
  [key: string]: string | number | boolean | undefined;
}

export class ApiService {
  private getToken(): string | undefined {
    return document.cookie
      .split('; ')
      .find(row => row.startsWith('token='))
      ?.split('=')[1];
  }

  private getHeaders(requiresAuth: boolean = true): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (requiresAuth) {
      const token = this.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  private buildUrl(endpoint: string, params?: QueryParams): string {
    const url = new URL(`${API_BASE_URL}${endpoint}`);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      });
    }
    
    return url.toString();
  }

  async request<T>(endpoint: string, options: RequestOptions = {}, params?: QueryParams): Promise<T> {
    const { method = 'GET', body, headers = {} } = options;
    const requiresAuth = !endpoint.endsWith('/login');
    
    const requestOptions: RequestOptions = {
      method,
      headers: {
        ...this.getHeaders(requiresAuth),
        ...headers,
      },
    };

    if (body) {
      requestOptions.body = JSON.stringify(body);
    }

    const url = this.buildUrl(endpoint, params);
    
    try {
      const response = await fetch(url, requestOptions);

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || 'API request failed');
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return {} as T;
      }

      return response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  get<T>(endpoint: string, params?: QueryParams): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' }, params);
  }

  post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, { method: 'POST', body: data });
  }

  put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, { method: 'PUT', body: data });
  }

  delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  postForm<T>(endpoint: string, data: Record<string, string>): Promise<T> {
    const formData = new URLSearchParams();
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, value);
    });

    return this.request<T>(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });
  }
}

export const api = new ApiService();