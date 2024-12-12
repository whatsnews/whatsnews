// src/services/authService.ts
import { api } from './api';
import { API_ENDPOINTS } from '@/config/api';
import type { Token, LoginRequest, User } from '@/types/api';

export const authService = {
  async login(credentials: LoginRequest): Promise<Token> {
    try {
      const formData = {
        username: credentials.username,
        password: credentials.password,
        grant_type: '',
        scope: '',
        client_id: '',
        client_secret: ''
      };

      // Log the request payload
      console.log('Login request payload:', formData);

      const response = await fetch(`http://localhost:8000/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams(formData).toString()
      });

      // Log the response status
      console.log('Response status:', response.status);

      // Handle non-200 responses
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Login error response:', errorData);
        throw new Error(errorData.detail || 'Authentication failed');
      }

      const data = await response.json();
      
      // Log successful response
      console.log('Login response:', data);

      if (data.access_token) {
        // Set cookie
        document.cookie = `token=${data.access_token}; path=/; max-age=86400; samesite=lax`;
        return data;
      } else {
        throw new Error('No access token received');
      }
    } catch (error) {
      console.error('Login processing error:', error);
      throw new Error(
        error instanceof Error 
          ? error.message 
          : 'Failed to process login request'
      );
    }
  },

  getToken(): string | undefined {
    return document.cookie
      .split('; ')
      .find(row => row.startsWith('token='))
      ?.split('=')[1];
  },

  logout(): void {
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },

  async getCurrentUser(): Promise<User> {
    return api.get<User>(API_ENDPOINTS.users.me);
  }
};