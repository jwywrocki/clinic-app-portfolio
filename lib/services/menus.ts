import type { MenuItem } from '@/lib/types/menu';
import type { CreateMenuItemInput, UpdateMenuItemInput } from '@/lib/schemas';
import { MenuCache } from '@/lib/menu-cache';
import type { MenuItemRepository } from '@/repositories';
import { failure, success, type Result, NotFoundError } from '@/domain';

export class MenusService {
  constructor(private repository: MenuItemRepository) {}

  async getAll(): Promise<Result<MenuItem[]>> {
    return this.repository.findAll({
      orderBy: { column: 'order_position', ascending: true },
    });
  }

  async getPublished(): Promise<Result<MenuItem[]>> {
    return this.repository.findPublished();
  }

  async getById(id: string): Promise<Result<MenuItem>> {
    const result = await this.repository.findById(id);
    if (result.isFailure()) {
      return failure(result.error);
    }
    if (!result.data) {
      return failure(new NotFoundError('Menu item', id));
    }
    return success(result.data);
  }

  async create(input: CreateMenuItemInput): Promise<Result<MenuItem>> {
    const result = await this.repository.create(input);
    if (!result.isFailure()) {
      this.clearCache();
    }
    return result;
  }

  async update(id: string, input: UpdateMenuItemInput): Promise<Result<MenuItem>> {
    const existsResult = await this.repository.exists(id);
    if (existsResult.isFailure()) {
      return failure(existsResult.error);
    }
    if (!existsResult.data) {
      return failure(new NotFoundError('Menu item', id));
    }

    const result = await this.repository.update(id, input);
    if (!result.isFailure()) {
      this.clearCache();
    }
    return result;
  }

  async delete(id: string): Promise<Result<void>> {
    const existsResult = await this.repository.exists(id);
    if (existsResult.isFailure()) {
      return failure(existsResult.error);
    }
    if (!existsResult.data) {
      return failure(new NotFoundError('Menu item', id));
    }

    const result = await this.repository.delete(id);
    if (!result.isFailure()) {
      this.clearCache();
    }
    return result;
  }

  async reorder(
    updates: Array<{ id: string; order_position: number; parent_id?: string | null }>
  ): Promise<Result<void>> {
    const result = await this.repository.updateOrderPositions(updates);
    if (!result.isFailure()) {
      this.clearCache();
    }
    return result;
  }

  private clearCache() {
    MenuCache.clearCache();
  }
}
