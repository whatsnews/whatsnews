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

export type VisibilityType = "private" | "internal" | "public";

export interface Prompt {
  id: number;
  name: string;
  slug: string;
  content: string;
  template_type: TemplateType;
  visibility: VisibilityType;
  custom_template?: string;
  user_id: number;
  created_at?: string;
  updated_at?: string;
}

export interface PromptCreate {
  name: string;
  content: string;
  template_type: TemplateType;
  visibility: VisibilityType;
  custom_template?: string;
}

export interface PromptUpdate {
  name?: string;
  content?: string;
  template_type?: TemplateType;
  visibility?: VisibilityType;
  custom_template?: string;
}

export interface PromptStats {
  total: number;
  hourly: number;
  daily: number;
  last_update?: string;
}

export interface PromptWithStats extends Prompt {
  news_count: PromptStats;
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