import type { Service } from '@/lib/types/services';
import type { CreateServiceInput, UpdateServiceInput } from '@/lib/schemas';
import type { ClinicServicesRepository } from '@/repositories';
import { failure, success, type Result, NotFoundError } from '@/domain';

export class ClinicServicesService {
  constructor(private repository: ClinicServicesRepository) {}

  async getAll(): Promise<Result<Service[]>> {
    return this.repository.findAll({
      orderBy: { column: 'order_position', ascending: true },
    });
  }

  async getPublished(): Promise<Result<Service[]>> {
    return this.repository.findPublished();
  }

  async getPublishedByCreatedAt(): Promise<Result<Service[]>> {
    const listResult = await this.repository.findAll({
      orderBy: { column: 'created_at', ascending: true },
    });
    if (listResult.isFailure()) {
      return failure(listResult.error);
    }

    const published = listResult.data.filter(service => service.is_published);
    return success(published);
  }

  async getById(id: string): Promise<Result<Service>> {
    const result = await this.repository.findById(id);
    if (result.isFailure()) {
      return failure(result.error);
    }
    if (!result.data) {
      return failure(new NotFoundError('Service', id));
    }
    return success(result.data);
  }

  async create(input: CreateServiceInput): Promise<Result<Service>> {
    return this.repository.create(input);
  }

  async update(id: string, input: UpdateServiceInput): Promise<Result<Service>> {
    const existsResult = await this.repository.exists(id);
    if (existsResult.isFailure()) {
      return failure(existsResult.error);
    }
    if (!existsResult.data) {
      return failure(new NotFoundError('Service', id));
    }

    return this.repository.update(id, input);
  }

  async delete(id: string): Promise<Result<void>> {
    const existsResult = await this.repository.exists(id);
    if (existsResult.isFailure()) {
      return failure(existsResult.error);
    }
    if (!existsResult.data) {
      return failure(new NotFoundError('Service', id));
    }

    return this.repository.delete(id);
  }
}
