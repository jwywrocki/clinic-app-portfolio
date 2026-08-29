import type { DBClient } from '@/lib/db/types';
import type { Specialization } from '@/lib/types/specializations';
import { BaseRepository } from './base';
import type { SpecializationRepository } from './interfaces';
import { DomainError, failure, success, type Result } from '@/domain';

interface DoctorSpecializationLink {
  id: string;
  doctor_id: string;
  specialization_id: string;
}

export class SpecializationRepositoryImpl
  extends BaseRepository<Specialization>
  implements SpecializationRepository
{
  constructor(db: DBClient) {
    super(db, 'specializations');
  }

  async findByName(name: string): Promise<Result<Specialization | null>> {
    try {
      const specialization = await this.db.findOne<Specialization>('specializations', { name });
      return success(specialization);
    } catch (error) {
      return failure(
        new DomainError('Failed to find specialization by name', 'DATABASE_ERROR', error)
      );
    }
  }

  async hasLinkedDoctors(
    specializationId: string,
    specializationName?: string
  ): Promise<Result<boolean>> {
    try {
      const links = await this.db.findWhere<DoctorSpecializationLink>(
        'doctor_has_specializations',
        { specialization_id: specializationId }
      );
      if (links.length > 0) {
        return success(true);
      }

      const directById = await this.db.findWhere('doctors', { specialization: specializationId });
      if (directById.length > 0) {
        return success(true);
      }

      if (specializationName) {
        const directByName = await this.db.findWhere('doctors', {
          specialization: specializationName,
        });
        return success(directByName.length > 0);
      }

      return success(false);
    } catch (error) {
      return failure(
        new DomainError('Failed to check specialization usage', 'DATABASE_ERROR', error)
      );
    }
  }
}
