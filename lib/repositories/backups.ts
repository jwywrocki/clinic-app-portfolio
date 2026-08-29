import type { DBClient } from '@/lib/db/types';
import { DomainError, failure, success, type Result } from '@/domain';
import type { DatabaseBackup } from '@/lib/types/backups';
import type { BackupRepository } from './interfaces';

export class BackupRepositoryImpl implements BackupRepository {
  constructor(private db: DBClient) {}

  async listRecent(limit: number): Promise<Result<DatabaseBackup[]>> {
    try {
      const backups = await this.db.list<DatabaseBackup>('database_backups', {
        orderBy: { column: 'created_at', ascending: false },
        limit,
      });
      return success(backups);
    } catch (error) {
      return failure(new DomainError('Failed to list backups', 'DATABASE_ERROR', error));
    }
  }

  async listAll(): Promise<Result<DatabaseBackup[]>> {
    try {
      const backups = await this.db.list<DatabaseBackup>('database_backups', {
        orderBy: { column: 'created_at', ascending: false },
      });
      return success(backups);
    } catch (error) {
      return failure(new DomainError('Failed to list backups', 'DATABASE_ERROR', error));
    }
  }

  async findLatestByType(backupType: string): Promise<Result<DatabaseBackup | null>> {
    try {
      const backups = await this.db.findWhere<DatabaseBackup>(
        'database_backups',
        { backup_type: backupType },
        { orderBy: { column: 'created_at', ascending: false }, limit: 1 }
      );
      return success(backups[0] ?? null);
    } catch (error) {
      return failure(
        new DomainError('Failed to find latest backup by type', 'DATABASE_ERROR', error)
      );
    }
  }

  async findCompletedById(id: string): Promise<Result<DatabaseBackup | null>> {
    try {
      const backup = await this.db.findOne<DatabaseBackup>('database_backups', {
        id,
        status: 'completed',
      });
      return success(backup);
    } catch (error) {
      return failure(
        new DomainError('Failed to find completed backup by id', 'DATABASE_ERROR', error)
      );
    }
  }

  async create(data: Omit<DatabaseBackup, 'created_at'>): Promise<Result<DatabaseBackup>> {
    try {
      const backup = await this.db.insert<DatabaseBackup>('database_backups', data);
      return success(backup);
    } catch (error) {
      return failure(new DomainError('Failed to create backup', 'DATABASE_ERROR', error));
    }
  }

  async update(
    id: string,
    updates: Partial<Omit<DatabaseBackup, 'id' | 'created_at'>>
  ): Promise<Result<DatabaseBackup>> {
    try {
      const backup = await this.db.updateById<DatabaseBackup>('database_backups', id, updates);
      return success(backup);
    } catch (error) {
      return failure(new DomainError('Failed to update backup', 'DATABASE_ERROR', error));
    }
  }

  async delete(id: string): Promise<Result<void>> {
    try {
      await this.db.deleteById('database_backups', id);
      return success(undefined);
    } catch (error) {
      return failure(new DomainError('Failed to delete backup', 'DATABASE_ERROR', error));
    }
  }
}
