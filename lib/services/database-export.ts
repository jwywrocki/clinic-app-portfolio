import type { DatabaseExportRepository } from '@/repositories';
import { type Result } from '@/domain';

export class DatabaseExportService {
  constructor(private repository: DatabaseExportRepository) {}

  async listTable(tableName: string): Promise<Result<Record<string, unknown>[]>> {
    return this.repository.listTable(tableName);
  }
}
