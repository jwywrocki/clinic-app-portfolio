import type { DBClient } from '@/lib/db/types';
import { BaseRepository } from './base';
import type { SettingsRepository } from './interfaces';
import { failure, success, type Result } from '@/domain';
import type { SiteSetting } from '@/lib/types/settings';

export class SettingsRepositoryImpl
  extends BaseRepository<SiteSetting>
  implements SettingsRepository
{
  constructor(db: DBClient) {
    super(db, 'site_settings');
  }

  async findByKey(settingKey: string): Promise<Result<SiteSetting | null>> {
    return this.findOne('key', settingKey);
  }

  async upsertByKey(input: {
    key: string;
    value: string | null;
    description?: string | null;
    updatedBy?: string | null;
  }): Promise<Result<SiteSetting>> {
    const existingResult = await this.findByKey(input.key);
    if (existingResult.isFailure()) {
      return failure(existingResult.error);
    }

    if (existingResult.data) {
      return this.update(existingResult.data.id, {
        value: input.value,
        description:
          input.description !== undefined ? input.description : existingResult.data.description,
        updated_by: input.updatedBy ?? null,
      });
    }

    return this.create({
      key: input.key,
      value: input.value,
      description: input.description,
      created_by: input.updatedBy ?? null,
      updated_by: input.updatedBy ?? null,
    });
  }

  async deleteByKey(settingKey: string): Promise<Result<boolean>> {
    const existingResult = await this.findByKey(settingKey);
    if (existingResult.isFailure()) {
      return failure(existingResult.error);
    }

    if (!existingResult.data) {
      return success(false);
    }

    const deleteResult = await this.delete(existingResult.data.id);
    if (deleteResult.isFailure()) {
      return failure(deleteResult.error);
    }

    return success(true);
  }

  async listAllAsMap(): Promise<Result<Record<string, string>>> {
    const listResult = await this.findAll({
      orderBy: { column: 'key', ascending: true },
    });

    if (listResult.isFailure()) {
      return failure(listResult.error);
    }

    const settingsMap = listResult.data.reduce<Record<string, string>>((acc, setting) => {
      acc[setting.key] = setting.value ?? '';
      return acc;
    }, {});

    return success(settingsMap);
  }
}
