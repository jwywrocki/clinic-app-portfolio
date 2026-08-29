import { safeEncryptPassword } from '@/lib/crypto';
import type { SiteSetting } from '@/lib/types/settings';
import type { SettingsRepository } from '@/repositories';
import { failure, success, type Result } from '@/domain';

export interface SettingUpsertInput {
  key: string;
  value: string | null;
  description?: string | null;
}

export class SettingsService {
  constructor(private repository: SettingsRepository) {}

  async getAll(): Promise<Result<SiteSetting[]>> {
    return this.repository.findAll({ orderBy: { column: 'key', ascending: true } });
  }

  async getAllAsMap(): Promise<Result<Record<string, string>>> {
    return this.repository.listAllAsMap();
  }

  async getByKey(key: string): Promise<Result<SiteSetting | null>> {
    return this.repository.findByKey(key);
  }

  async upsert(
    key: string,
    value: string | null,
    userId?: string | null,
    description?: string | null
  ): Promise<Result<SiteSetting>> {
    const processedValue = this.prepareSettingValue(key, value);
    return this.repository.upsertByKey({
      key,
      value: processedValue,
      description,
      updatedBy: userId ?? null,
    });
  }

  async bulkUpsert(
    settings: SettingUpsertInput[],
    userId?: string | null
  ): Promise<Result<SiteSetting[]>> {
    const results: SiteSetting[] = [];

    for (const setting of settings) {
      if (!setting.key) continue;

      const updateResult = await this.upsert(
        setting.key,
        setting.value,
        userId ?? null,
        setting.description
      );

      if (updateResult.isFailure()) {
        return failure(updateResult.error);
      }

      results.push(updateResult.data);
    }

    return success(results);
  }

  async deleteByKey(key: string): Promise<Result<boolean>> {
    return this.repository.deleteByKey(key);
  }

  private prepareSettingValue(key: string, value: string | null): string | null {
    if (key === 'email_smtp_password' && value) {
      return safeEncryptPassword(value);
    }
    return value;
  }
}
