import type { DBClient } from '@/lib/db/types';
import { DomainError, failure, success, type Result } from '@/domain';
import type { PageSpecializationLink } from '@/lib/types/pages';
import type { PageSpecializationRepository } from './interfaces';

export class PageSpecializationRepositoryImpl implements PageSpecializationRepository {
  constructor(private db: DBClient) {}

  async listByPageId(pageId: string): Promise<Result<PageSpecializationLink[]>> {
    try {
      const links = await this.db.findWhere<PageSpecializationLink>('page_has_specializations', {
        page_id: pageId,
      });
      return success(links);
    } catch (error) {
      return failure(
        new DomainError('Failed to load page specializations', 'DATABASE_ERROR', error)
      );
    }
  }

  async replaceLinks(pageId: string, specializationIds: string[]): Promise<Result<void>> {
    try {
      await this.db.transaction(async tx => {
        await tx.deleteWhere('page_has_specializations', { page_id: pageId });

        if (specializationIds.length === 0) return;

        const rows = specializationIds.map(specializationId => ({
          page_id: pageId,
          specialization_id: specializationId,
        }));

        await tx.insertMany('page_has_specializations', rows);
      });

      return success(undefined);
    } catch (error) {
      return failure(
        new DomainError('Failed to sync page specializations', 'DATABASE_ERROR', error)
      );
    }
  }

  async deleteByPageId(pageId: string): Promise<Result<void>> {
    try {
      await this.db.deleteWhere('page_has_specializations', { page_id: pageId });
      return success(undefined);
    } catch (error) {
      return failure(
        new DomainError('Failed to delete page specializations', 'DATABASE_ERROR', error)
      );
    }
  }
}
