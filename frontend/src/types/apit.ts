// src/types/api.ts

// User types
export interface User {
    email: string;
    username: string;
    timezone: string;
    news_generation_hour_1: number;
    news_generation_hour_2: number;
    is_active: boolean;
    is_superuser: boolean;
    id: number;
    created_at: string;
    updated_at: string;
  }
  
  export interface UserCreate {
    email: string;
    username: string;
    password: string;
    timezone?: string;
    news_generation_hour_1?: number;
    news_generation_hour_2?: number;
    is_active?: boolean;
    is_superuser?: boolean;
  }
  
  export interface UserUpdate {
    email?: string;
    username?: string;
    password?: string;
    timezone?: string;
    news_generation_hour_1?: number;
    news_generation_hour_2?: number;
    is_active?: boolean;
    is_superuser?: boolean;
  }
  
  // News types
  export type UpdateFrequency = "hourly" | "daily";
  
  export interface News {
    id: number;
    title: string;
    content: string;
    frequency: UpdateFrequency;
    prompt_id: number;
    created_at: string;
    updated_at: string;
  }
  
  export interface NewsCreate {
    frequency: UpdateFrequency;
    prompt_id: number;
  }
  
  export interface NewsResponse extends News {}
  
  // Prompt types
  export type TemplateType = "summary" | "analysis" | "bullet_points" | "narrative";
  
  export interface Prompt {
    id: number;
    name: string;
    content: string;
    template_type: TemplateType;
    custom_template?: string;
    user_id: number;
    created_at?: string;
    updated_at?: string;
  }
  
  export interface PromptCreate {
    name: string;
    content: string;
    template_type: TemplateType;
    custom_template?: string;
  }
  
  // Auth types
  export interface Token {
    access_token: string;
    token_type: string;
  }
  
  export interface LoginRequest {
    username: string;
    password: string;
  }