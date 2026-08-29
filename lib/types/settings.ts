export interface SiteSetting {
  id: string;
  key: string;
  value: string | null;
  description?: string | null;
  created_by?: string | null;
  updated_by?: string | null;
  created_at: string;
  updated_at: string;
}
