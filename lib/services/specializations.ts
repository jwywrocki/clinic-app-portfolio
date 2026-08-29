import type { Specialization } from '@/lib/types/specializations';
import type { SpecializationRepository } from '@/repositories';
import {
  ConflictError,
  ValidationError,
  NotFoundError,
  failure,
  success,
  type Result,
} from '@/domain';

export interface CreateSpecializationRequest {
  name: string;
  description?: string | null;
}

export interface UpdateSpecializationRequest {
  name?: string;
  description?: string | null;
}

export class SpecializationService {
  constructor(private repository: SpecializationRepository) {}

  async getAll(): Promise<Result<Specialization[]>> {
    return this.repository.findAll({
      orderBy: { column: 'name', ascending: true },
    });
  }

  async getById(id: string): Promise<Result<Specialization>> {
    const result = await this.repository.findById(id);
    if (result.isFailure()) {
      return failure(result.error);
    }
    if (!result.data) {
      return failure(new NotFoundError('Specialization', id));
    }
    return success(result.data);
  }

  async create(input: CreateSpecializationRequest): Promise<Result<Specialization>> {
    const name = this.normalizeName(input.name);
    if (!name) {
      return failure(new ValidationError('Nazwa specjalizacji jest wymagana', 'name'));
    }

    const existing = await this.repository.findByName(name);
    if (existing.isFailure()) {
      return failure(existing.error);
    }
    if (existing.data) {
      return failure(new ConflictError('Specjalizacja o tej nazwie już istnieje'));
    }

    const description = this.normalizeDescription(input.description);
    return this.repository.create({ name, description });
  }

  async update(id: string, input: UpdateSpecializationRequest): Promise<Result<Specialization>> {
    const existingResult = await this.repository.findById(id);
    if (existingResult.isFailure()) {
      return failure(existingResult.error);
    }
    if (!existingResult.data) {
      return failure(new NotFoundError('Specialization', id));
    }

    const updates: Partial<Omit<Specialization, 'id' | 'created_at'>> = {};

    if (input.name !== undefined) {
      const name = this.normalizeName(input.name);
      if (!name) {
        return failure(new ValidationError('Nazwa specjalizacji jest wymagana', 'name'));
      }

      if (name !== existingResult.data.name) {
        const existingByName = await this.repository.findByName(name);
        if (existingByName.isFailure()) {
          return failure(existingByName.error);
        }
        if (existingByName.data && existingByName.data.id !== id) {
          return failure(new ConflictError('Specjalizacja o tej nazwie już istnieje'));
        }
      }

      updates.name = name;
    }

    if (input.description !== undefined) {
      updates.description = this.normalizeDescription(input.description);
    }

    if (Object.keys(updates).length === 0) {
      return success(existingResult.data);
    }

    return this.repository.update(id, updates);
  }

  async delete(id: string): Promise<Result<void>> {
    const existingResult = await this.repository.findById(id);
    if (existingResult.isFailure()) {
      return failure(existingResult.error);
    }
    if (!existingResult.data) {
      return failure(new NotFoundError('Specialization', id));
    }

    const linkedResult = await this.repository.hasLinkedDoctors(id, existingResult.data.name);
    if (linkedResult.isFailure()) {
      return failure(linkedResult.error);
    }
    if (linkedResult.data) {
      return failure(new ConflictError('Nie można usunąć specjalizacji przypisanej do lekarza'));
    }

    return this.repository.delete(id);
  }

  private normalizeName(value?: string): string {
    return value?.trim() ?? '';
  }

  private normalizeDescription(value?: string | null): string | null {
    if (value === undefined || value === null) {
      return null;
    }
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }
}
