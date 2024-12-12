// src/config/api.ts

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';

// API endpoint definitions
export const API_ENDPOINTS = {
  auth: {
    login: '/auth/login',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
    testToken: '/auth/test-token'
  },
  users: {
    me: '/users/me',
    profile: '/users/profile',
    timezones: '/users/timezones',
    list: '/users',
    detail: (id: number) => `/users/${id}`,
    create: '/users',
    update: (id: number) => `/users/${id}`,
    delete: (id: number) => `/users/${id}`
  },
  prompts: {
    list: '/prompts',
    create: '/prompts',
    detail: (id: number) => `/prompts/${id}`,
    update: (id: number) => `/prompts/${id}`,
    delete: (id: number) => `/prompts/${id}`,
    templates: '/prompts/templates',
    validateTemplate: '/prompts/validate-template',
    news: (id: number) => `/prompts/${id}/news`
  },
  news: {
    list: '/news',
    create: '/news',
    detail: (id: number) => `/news/${id}`,
    delete: (id: number) => `/news/${id}`,
    latest: (promptId: number) => `/news/latest/${promptId}`
  }
} as const;

// Type for API response pagination
export interface PaginationParams {
  skip?: number;
  limit?: number;
  search?: string;
}

// Type for API response error
export interface ApiError {
  status: number;
  message: string;
  detail?: string;
}

// API response wrapper type
export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
  status: number;
}

// Type guard to check if response is an error
export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    'message' in error
  );
}

// Helper to resolve dynamic endpoints
export function resolveEndpoint(endpoint: string | ((param: any) => string), param?: any): string {
  if (typeof endpoint === 'function' && param !== undefined) {
    return endpoint(param);
  }
  return endpoint as string;
}

// Helper to build full API URL
export function buildApiUrl(endpoint: string, params?: Record<string, string>): string {
  const url = new URL(`${API_BASE_URL}${endpoint}`);
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value.toString());
      }
    });
  }
  
  return url.toString();
}

// Type for HTTP methods
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

// Request configuration type
export interface RequestConfig {
  method?: HttpMethod;
  headers?: Record<string, string>;
  body?: any;
  params?: Record<string, string>;
}

// Export common content types
export const ContentTypes = {
  JSON: 'application/json',
  FORM: 'application/x-www-form-urlencoded',
  MULTIPART: 'multipart/form-data',
} as const;