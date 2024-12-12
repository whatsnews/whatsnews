// src/config/api.ts

export const API_BASE_URL = 'http://localhost:8000/api/v1';

export const API_ENDPOINTS = {
  auth: {
    login: '/auth/login',
    signup: '/auth/signup',
    refresh: '/auth/refresh'
  },
  users: {
    me: '/users/me',
    profile: '/users/profile'
  },
  prompts: {
    list: '/prompts',
    create: '/prompts',
    detail: (id: number) => `/prompts/${id}`,
    news: (id: number) => `/prompts/${id}/news`,
    templates: '/prompts/templates',
    validateTemplate: '/prompts/validate-template',
    duplicate: (id: number) => `/prompts/${id}/duplicate`,
  },
  news: {
    list: '/news',
    detail: (id: number) => `/news/${id}`,
    byPrompt: (promptId: number) => `/news/by-prompt/${promptId}`
  }
};

export type APIEndpoint = string | ((param: any) => string);

// Type guard to check if endpoint is a function
export function isEndpointFunction(
  endpoint: APIEndpoint
): endpoint is (param: any) => string {
  return typeof endpoint === 'function';
}

// Helper function to resolve endpoint
export function resolveEndpoint(
  endpoint: APIEndpoint,
  param?: any
): string {
  if (isEndpointFunction(endpoint) && param !== undefined) {
    return endpoint(param);
  }
  return endpoint as string;
}

// Export configured API URL for use in services
export const getApiUrl = (endpoint: string): string => {
  return `${API_BASE_URL}${endpoint}`;
};