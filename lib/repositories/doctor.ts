import { Doctor, Result, success, failure, DomainError } from '@/domain';
import { DoctorRepository } from './interfaces';
import { BaseRepository } from './base';
import { DBClient } from '@/lib/db/types';
import { Specialization } from '@/lib/types/specializations';
import { DoctorSpecializationLink } from '@/lib/types/doctors';
import { QueryOptions } from '@/domain';

export class DoctorRepositoryImpl extends BaseRepository<Doctor> implements DoctorRepository {
  constructor(db: DBClient) {
    super(db, 'doctors');
  }

  private async withSpecializationNames(doctors: Doctor[]): Promise<Doctor[]> {
    if (doctors.length === 0) return doctors;

    let links: DoctorSpecializationLink[] = [];
    try {
      links = await this.db.list<DoctorSpecializationLink>('doctor_has_specializations');
    } catch {
      links = [];
    }

    let specializations: Specialization[] = [];
    try {
      specializations = await this.db.list<Specialization>('specializations', {
        orderBy: { column: 'name', ascending: true },
      });
    } catch {
      return doctors.map(doctor => {
        const ids = links
          .filter(link => link.doctor_id === doctor.id)
          .map(link => link.specialization_id);
        const specializationIds = ids.length > 0 ? ids : [doctor.specialization].filter(Boolean);
        return {
          ...doctor,
          specialization_ids: specializationIds,
          specialization_name: doctor.specialization,
          specialization_names: specializationIds,
        };
      });
    }

    return doctors.map(doctor => {
      const ids = links
        .filter(link => link.doctor_id === doctor.id)
        .map(link => link.specialization_id);
      const specializationIds = ids.length > 0 ? ids : [doctor.specialization].filter(Boolean);
      const names = specializationIds
        .map(id => specializations.find(s => s.id === id)?.name || id)
        .filter(Boolean);

      return {
        ...doctor,
        specialization_ids: specializationIds,
        specialization_name: names[0] || doctor.specialization,
        specialization_names: names,
      };
    });
  }

  override async findAll(options?: QueryOptions): Promise<Result<Doctor[]>> {
    try {
      const doctors = await this.db.list<Doctor>(
        this.tableName,
        options?.orderBy ? { orderBy: options.orderBy } : undefined
      );
      return success(await this.withSpecializationNames(doctors));
    } catch (error) {
      return failure(
        new DomainError(`Failed to find all ${this.tableName}`, 'DATABASE_ERROR', error)
      );
    }
  }

  override async findById(id: string): Promise<Result<Doctor | null>> {
    try {
      const doctor = await this.db.getById<Doctor>(this.tableName, id);
      if (!doctor) return success(null);
      const [enriched] = await this.withSpecializationNames([doctor]);
      return success(enriched ?? null);
    } catch (error) {
      return failure(
        new DomainError(`Failed to find ${this.tableName} by id: ${id}`, 'DATABASE_ERROR', error)
      );
    }
  }

  async findBySpecialization(specialization: string): Promise<Result<Doctor[]>> {
    try {
      const doctors = await this.db.findWhere<Doctor>(this.tableName, { specialization });
      return success(await this.withSpecializationNames(doctors));
    } catch (error) {
      return failure(
        new DomainError('Failed to find doctors by specialization', 'DATABASE_ERROR', error)
      );
    }
  }

  async findByCategory(category: string): Promise<Result<Doctor[]>> {
    const _category = category;
    try {
      const doctors = await this.db.list<Doctor>(this.tableName, {
        orderBy: { column: 'order_position', ascending: true },
      });
      return success(await this.withSpecializationNames(doctors));
    } catch (error) {
      return failure(new DomainError('Failed to list doctors', 'DATABASE_ERROR', error));
    }
  }

  async findActive(): Promise<Result<Doctor[]>> {
    try {
      const doctors = await this.db.findWhere<Doctor>(
        this.tableName,
        { is_active: true },
        {
          orderBy: { column: 'order_position', ascending: true },
        }
      );
      return success(await this.withSpecializationNames(doctors));
    } catch (error) {
      return failure(new DomainError('Failed to find active doctors', 'DATABASE_ERROR', error));
    }
  }

  async updateOrderPositions(
    updates: Array<{ id: string; order_position: number }>
  ): Promise<Result<void>> {
    try {
      for (const update of updates) {
        const result = await this.update(update.id, { order_position: update.order_position });
        if (result.isFailure()) {
          return failure(result.error);
        }
      }
      return success(undefined);
    } catch (error) {
      return failure(
        new DomainError('Failed to update doctor order positions', 'DATABASE_ERROR', error)
      );
    }
  }
}
