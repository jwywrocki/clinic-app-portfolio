export interface MenuItem {
  id: string;
  title: string;
  url: string | null;
  order_position: number;
  parent_id?: string | null;
  is_published: boolean;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}
