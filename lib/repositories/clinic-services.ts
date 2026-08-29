import type { DBClient } from '@/lib/db/types';
import type { Service } from '@/lib/types/services';
import { BaseRepository } from './base';
import type { ClinicServicesRepository } from './interfaces';
import type { Result } from '@/domain';

export class ClinicServicesRepositoryImpl
  extends BaseRepository<Service>
  implements ClinicServicesRepository
{
  constructor(db: DBClient) {
    super(db, 'services');
  }

  async findPublished(): Promise<Result<Service[]>> {
    return this.findByField('is_published', true, {
      orderBy: { column: 'order_position', ascending: true },
    });
  }
}
