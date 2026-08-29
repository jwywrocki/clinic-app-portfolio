import type { DatabaseBackup } from '@/lib/types/backups';
import type { BackupRepository } from '@/repositories';
import { type Result } from '@/domain';

export interface CreateBackupRecordInput {
  id: string;
  filename: string;
  file_path: string;
  backup_type: string;
  status: string;
  file_size?: number;
  created_by?: string | null;
  error_message?: string | null;
  completed_at?: string | null;
}

export class BackupService {
  constructor(private repository: BackupRepository) {}

  async listRecent(limit: number): Promise<Result<DatabaseBackup[]>> {
    return this.repository.listRecent(limit);
  }

  async listAll(): Promise<Result<DatabaseBackup[]>> {
    return this.repository.listAll();
  }

  async findLatestByType(backupType: string): Promise<Result<DatabaseBackup | null>> {
    return this.repository.findLatestByType(backupType);
  }

  async findCompletedById(id: string): Promise<Result<DatabaseBackup | null>> {
    return this.repository.findCompletedById(id);
  }

  async createRecord(input: CreateBackupRecordInput): Promise<Result<DatabaseBackup>> {
    return this.repository.create({
      id: input.id,
      filename: input.filename,
      file_path: input.file_path,
      file_size: input.file_size ?? 0,
      backup_type: input.backup_type,
      status: input.status,
      error_message: input.error_message ?? null,
      created_by: input.created_by ?? null,
      completed_at: input.completed_at ?? null,
    });
  }

  async updateRecord(
    id: string,
    updates: Partial<Omit<DatabaseBackup, 'id' | 'created_at'>>
  ): Promise<Result<DatabaseBackup>> {
    return this.repository.update(id, updates);
  }

  async deleteRecord(id: string): Promise<Result<void>> {
    return this.repository.delete(id);
  }
}
