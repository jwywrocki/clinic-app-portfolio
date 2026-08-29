export interface Page {
  id: string;
  title: string;
  slug: string;
  content: string;
  meta_description?: string | null;
  is_published: boolean;
  created_by?: string | null;
  survey_id?: string | null;
  specialization_ids?: string[];
  created_at: string;
  updated_at: string;
}

export interface PageSpecializationLink {
  id: string;
  page_id: string;
  specialization_id: string;
}
