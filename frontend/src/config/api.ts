// src/config/api.ts
export const API_BASE_URL = 'http://localhost:8000';

export const API_ENDPOINTS = {
  auth: {
    login: '/api/v1/auth/login',
    testToken: '/api/v1/auth/test-token',
  },
  users: {
    create: '/api/v1/users/',
    initSuperuser: '/api/v1/users/init-superuser',
    me: '/api/v1/users/me',
    list: '/api/v1/users/',
    timezones: '/api/v1/users/timezones',
    byId: (id: number) => `/api/v1/users/${id}`,
  },
  prompts: {
    create: '/api/v1/prompts/',
    templates: '/api/v1/prompts/templates',
  },
  news: {
    list: '/api/v1/news/',
    create: '/api/v1/news/',
    byId: (id: number) => `/api/v1/news/${id}`,
    latest: (promptId: number) => `/api/v1/news/latest/${promptId}`,
  },
  health: '/api/v1/health',
} as const;