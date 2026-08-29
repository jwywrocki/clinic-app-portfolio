export interface NewsItem {
  id: string;
  title: string;
  slug?: string | null;
  content: string;
  image_url?: string | null;
  excerpt?: string | null;
  is_published: boolean;
  published_at?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}
