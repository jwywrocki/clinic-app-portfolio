import type { DBClient } from '@/lib/db/types';
import type { MenuItem } from '@/lib/types/menu';
import { BaseRepository } from './base';
import type { MenuItemRepository } from './interfaces';
import { failure, success, type Result } from '@/domain';

export class MenuItemRepositoryImpl extends BaseRepository<MenuItem> implements MenuItemRepository {
  constructor(db: DBClient) {
    super(db, 'menu_items');
  }

  async findPublished(): Promise<Result<MenuItem[]>> {
    return this.findByField('is_published', true, {
      orderBy: { column: 'order_position', ascending: true },
    });
  }

  async updateOrderPositions(
    updates: Array<{ id: string; order_position: number; parent_id?: string | null }>
  ): Promise<Result<void>> {
    for (const update of updates) {
      const result = await this.update(update.id, {
        order_position: update.order_position,
        parent_id: update.parent_id,
      });
      if (result.isFailure()) {
        return failure(result.error);
      }
    }

    return success(undefined);
  }
}
