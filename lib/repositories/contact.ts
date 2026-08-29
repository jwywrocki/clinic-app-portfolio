import type { DBClient } from '@/lib/db/types';
import type { ContactDetail, ContactGroup } from '@/lib/types/contact';
import { BaseRepository } from './base';
import type { ContactDetailRepository, ContactGroupRepository } from './interfaces';
import { DomainError, failure, success, type Result } from '@/domain';

export class ContactGroupRepositoryImpl
  extends BaseRepository<ContactGroup>
  implements ContactGroupRepository
{
  constructor(db: DBClient) {
    super(db, 'contact_groups');
  }

  async listOrdered(): Promise<Result<ContactGroup[]>> {
    return this.findAll({ orderBy: { column: 'order_position', ascending: true } });
  }

  async updateOrderPositions(
    updates: Array<{ id: string; order_position: number }>
  ): Promise<Result<void>> {
    for (const update of updates) {
      const result = await this.update(update.id, { order_position: update.order_position });
      if (result.isFailure()) {
        return failure(result.error);
      }
    }

    return success(undefined);
  }
}

export class ContactDetailRepositoryImpl
  extends BaseRepository<ContactDetail>
  implements ContactDetailRepository
{
  constructor(db: DBClient) {
    super(db, 'contact_details');
  }

  async listOrdered(): Promise<Result<ContactDetail[]>> {
    return this.findAll({ orderBy: { column: 'order_position', ascending: true } });
  }

  async listByGroupId(groupId: string): Promise<Result<ContactDetail[]>> {
    return this.findByField('group_id', groupId, {
      orderBy: { column: 'order_position', ascending: true },
    });
  }

  async deleteByGroupId(groupId: string): Promise<Result<void>> {
    try {
      await this.db.deleteWhere(this.tableName, { group_id: groupId });
      return success(undefined);
    } catch (error) {
      return failure(
        new DomainError('Failed to delete contact details for group', 'DATABASE_ERROR', error)
      );
    }
  }
}
