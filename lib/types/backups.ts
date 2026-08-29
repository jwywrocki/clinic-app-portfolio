export interface DatabaseBackup {
  id: string;
  filename: string;
  file_path: string;
  file_size: number;
  backup_type: string;
  status: string;
  error_message?: string | null;
  created_by?: string | null;
  created_at: string;
  completed_at?: string | null;
}
