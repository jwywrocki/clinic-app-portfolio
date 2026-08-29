import type { DBClient } from '@/lib/db/types';
import { DomainError, failure, success, type Result } from '@/domain';
import type { DatabaseExportRepository } from './interfaces';

export class DatabaseExportRepositoryImpl implements DatabaseExportRepository {
  constructor(private db: DBClient) {}

  async listTable(tableName: string): Promise<Result<Record<string, unknown>[]>> {
    try {
      const rows = await this.db.list<Record<string, unknown>>(tableName);
      return success(rows);
    } catch (error) {
      return failure(new DomainError(`Failed to list table ${tableName}`, 'DATABASE_ERROR', error));
    }
  }
}
