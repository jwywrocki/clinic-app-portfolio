import type { Doctor, DoctorSpecializationLink } from '@/lib/types/doctors';
import type { Specialization } from '@/lib/types/specializations';
import type {
  DoctorRepository,
  DoctorSpecializationRepository,
  SpecializationRepository,
} from '@/repositories';
import { failure, success, type Result, ValidationError, NotFoundError } from '@/domain';

export interface AdminDoctorsOverview {
  doctors: Doctor[];
  specializations: Specialization[];
}

export class DoctorAdminService {
  constructor(
    private doctorRepository: DoctorRepository,
    private specializationRepository: SpecializationRepository,
    private doctorSpecializationRepository: DoctorSpecializationRepository
  ) {}

  async getAdminOverview(): Promise<Result<AdminDoctorsOverview>> {
    const specializationsResult = await this.specializationRepository.findAll({
      orderBy: { column: 'name', ascending: true },
    });

    const specializations = specializationsResult.isFailure() ? [] : specializationsResult.data;

    const doctorsResult = await this.doctorRepository.findAll({
      orderBy: { column: 'last_name', ascending: true },
    });

    if (doctorsResult.isFailure()) {
      return failure(doctorsResult.error);
    }

    let doctors = doctorsResult.data;

    if (!specializationsResult.isFailure()) {
      const linksResult = await this.doctorSpecializationRepository.listAll();
      const links = linksResult.isFailure() ? [] : linksResult.data;
      const didUpdate = await this.migrateLegacySpecializations(doctors, specializations, links);

      if (didUpdate) {
        const refreshed = await this.doctorRepository.findAll({
          orderBy: { column: 'last_name', ascending: true },
        });
        if (refreshed.isFailure()) {
          return failure(refreshed.error);
        }
        doctors = refreshed.data;
      }
    }

    return success({ doctors, specializations });
  }

  async saveDoctor(input: Partial<Doctor>): Promise<Result<Doctor>> {
    const resolvedIds = await this.resolveSpecializationIds(input);
    const primarySpecializationId = resolvedIds[0] || '';

    const firstName = input.first_name?.trim() || '';
    if (!firstName) {
      return failure(new ValidationError('Imię jest wymagane', 'first_name'));
    }

    const lastName = input.last_name?.trim() || '';
    if (!lastName) {
      return failure(new ValidationError('Nazwisko jest wymagane', 'last_name'));
    }

    if (!primarySpecializationId) {
      return failure(new ValidationError('Specjalizacja jest wymagana', 'specialization'));
    }

    const payload = {
      first_name: firstName,
      last_name: lastName,
      specialization: primarySpecializationId,
      bio: input.bio || '',
      image_url: input.image_url || '',
      schedule: input.schedule || '',
      is_active: input.is_active ?? true,
      order_position: input.order_position ?? 1,
    };

    let saved: Result<Doctor>;

    if (input.id) {
      saved = await this.doctorRepository.update(input.id, payload);
    } else {
      saved = await this.doctorRepository.create(payload);
    }

    if (saved.isFailure()) {
      return failure(saved.error);
    }

    const linkResult = await this.doctorSpecializationRepository.replaceLinks(
      saved.data.id,
      resolvedIds
    );

    if (linkResult.isFailure()) {
      return success(saved.data);
    }

    return success(saved.data);
  }

  async deleteDoctor(id: string): Promise<Result<void>> {
    const existsResult = await this.doctorRepository.exists(id);
    if (existsResult.isFailure()) {
      return failure(existsResult.error);
    }
    if (!existsResult.data) {
      return failure(new NotFoundError('Doctor', id));
    }

    const linksResult = await this.doctorSpecializationRepository.deleteByDoctorId(id);
    if (linksResult.isFailure()) {
      return failure(linksResult.error);
    }

    return this.doctorRepository.delete(id);
  }

  private async resolveSpecializationIds(input: Partial<Doctor>): Promise<string[]> {
    const providedIds = (input.specialization_ids || []).filter(Boolean);
    const resolvedIds: string[] = [];

    for (const value of providedIds) {
      const resolved = await this.resolveSpecializationId(value);
      if (resolved && !resolvedIds.includes(resolved)) {
        resolvedIds.push(resolved);
      }
    }

    if (resolvedIds.length === 0 && input.specialization) {
      const fallback = await this.resolveSpecializationId(input.specialization);
      if (fallback) {
        resolvedIds.push(fallback);
      }
    }

    return resolvedIds;
  }

  private async resolveSpecializationId(value: string): Promise<string> {
    const normalized = value.trim();
    if (!normalized) return '';

    const asId = await this.specializationRepository.findById(normalized);
    if (asId.isFailure()) {
      return normalized;
    }
    if (asId.data) {
      return asId.data.id;
    }

    const byName = await this.specializationRepository.findByName(normalized);
    if (byName.isFailure()) {
      return normalized;
    }
    if (byName.data) {
      return byName.data.id;
    }

    const created = await this.specializationRepository.create({
      name: normalized,
      description: null,
    });

    if (created.isFailure()) {
      const retry = await this.specializationRepository.findByName(normalized);
      if (!retry.isFailure() && retry.data) {
        return retry.data.id;
      }
      return normalized;
    }

    return created.data.id;
  }

  private async migrateLegacySpecializations(
    doctors: Doctor[],
    specializations: Specialization[],
    links: DoctorSpecializationLink[]
  ): Promise<boolean> {
    let updated = false;

    for (const doctor of doctors) {
      const current = doctor.specialization?.trim();
      if (!current) continue;

      const hasId = specializations.some(spec => spec.id === current);
      if (hasId) continue;

      const legacyName = current;
      let match = specializations.find(
        spec => spec.name.toLowerCase() === legacyName.toLowerCase()
      );

      if (!match) {
        const created = await this.specializationRepository.create({
          name: legacyName,
          description: null,
        });

        if (created.isFailure()) {
          const retry = await this.specializationRepository.findByName(legacyName);
          if (retry.isFailure() || !retry.data) {
            continue;
          }
          match = retry.data;
        }
        if (!created.isFailure()) {
          match = created.data;
        }

        if (match) {
          specializations.push(match);
          updated = true;
        }
      }

      if (!match) {
        continue;
      }

      const updateResult = await this.doctorRepository.update(doctor.id, {
        specialization: match.id,
      });

      if (!updateResult.isFailure()) {
        doctor.specialization = match.id;
        updated = true;
      }

      const hasLink = links.some(
        link => link.doctor_id === doctor.id && link.specialization_id === match.id
      );

      if (!hasLink) {
        const linkResult = await this.doctorSpecializationRepository.addLink(doctor.id, match.id);
        if (!linkResult.isFailure()) {
          links.push(linkResult.data);
          updated = true;
        }
      }
    }

    return updated;
  }
}
