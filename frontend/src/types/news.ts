// src/types/news.ts
export type UpdateFrequency = "30_minutes" | "hourly" | "daily";

export const frequencyMap = {
  "All News": null,
  "30 minutes": "30_minutes" as UpdateFrequency,
  "Hourly": "hourly" as UpdateFrequency,
  "Daily": "daily" as UpdateFrequency
};

export interface News {
  id: number;
  title: string;
  content: string;
  frequency: UpdateFrequency;
  prompt_id: number;
  created_at: string;
  updated_at: string;
}