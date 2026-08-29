import type { DBClient } from '@/lib/db/types';
import { DomainError, failure, success, type Result } from '@/domain';
import type { DoctorSpecializationLink } from '@/lib/types/doctors';
import type { DoctorSpecializationRepository } from './interfaces';

export class DoctorSpecializationRepositoryImpl implements DoctorSpecializationRepository {
  constructor(private db: DBClient) {}

  async listAll(): Promise<Result<DoctorSpecializationLink[]>> {
    try {
      const links = await this.db.list<DoctorSpecializationLink>('doctor_has_specializations');
      return success(links);
    } catch (error) {
      return failure(
        new DomainError('Failed to list doctor specializations', 'DATABASE_ERROR', error)
      );
    }
  }

  async listByDoctorId(doctorId: string): Promise<Result<DoctorSpecializationLink[]>> {
    try {
      const links = await this.db.findWhere<DoctorSpecializationLink>(
        'doctor_has_specializations',
        { doctor_id: doctorId }
      );
      return success(links);
    } catch (error) {
      return failure(
        new DomainError('Failed to list doctor specializations', 'DATABASE_ERROR', error)
      );
    }
  }

  async addLink(
    doctorId: string,
    specializationId: string
  ): Promise<Result<DoctorSpecializationLink>> {
    try {
      const link = await this.db.insert<DoctorSpecializationLink>('doctor_has_specializations', {
        doctor_id: doctorId,
        specialization_id: specializationId,
      });
      return success(link);
    } catch (error) {
      return failure(
        new DomainError('Failed to add doctor specialization', 'DATABASE_ERROR', error)
      );
    }
  }

  async replaceLinks(doctorId: string, specializationIds: string[]): Promise<Result<void>> {
    try {
      await this.db.transaction(async tx => {
        await tx.deleteWhere('doctor_has_specializations', { doctor_id: doctorId });

        if (specializationIds.length === 0) return;

        const rows = specializationIds.map(specializationId => ({
          doctor_id: doctorId,
          specialization_id: specializationId,
        }));

        await tx.insertMany('doctor_has_specializations', rows);
      });

      return success(undefined);
    } catch (error) {
      return failure(
        new DomainError('Failed to replace doctor specializations', 'DATABASE_ERROR', error)
      );
    }
  }

  async deleteByDoctorId(doctorId: string): Promise<Result<void>> {
    try {
      await this.db.deleteWhere('doctor_has_specializations', { doctor_id: doctorId });
      return success(undefined);
    } catch (error) {
      return failure(
        new DomainError('Failed to delete doctor specializations', 'DATABASE_ERROR', error)
      );
    }
  }
}
