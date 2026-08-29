import type { Page } from '@/lib/types/pages';
import type { CreatePageInput, UpdatePageInput } from '@/lib/schemas';
import type { PageRepository, PageSpecializationRepository } from '@/repositories';
import { failure, success, type Result, NotFoundError } from '@/domain';

export class PagesService {
  constructor(
    private pageRepository: PageRepository,
    private specializationRepository: PageSpecializationRepository
  ) {}

  async getAll(): Promise<Result<Page[]>> {
    const pagesResult = await this.pageRepository.findAll({
      orderBy: { column: 'created_at', ascending: false },
    });

    if (pagesResult.isFailure()) {
      return failure(pagesResult.error);
    }

    const pages = await Promise.all(pagesResult.data.map(page => this.attachSpecializations(page)));

    return success(pages);
  }

  async getAllByUpdatedAt(): Promise<Result<Page[]>> {
    const pagesResult = await this.pageRepository.findAll({
      orderBy: { column: 'updated_at', ascending: false },
    });

    if (pagesResult.isFailure()) {
      return failure(pagesResult.error);
    }

    const pages = await Promise.all(pagesResult.data.map(page => this.attachSpecializations(page)));

    return success(pages);
  }

  async getById(id: string): Promise<Result<Page>> {
    const pageResult = await this.pageRepository.findById(id);
    if (pageResult.isFailure()) {
      return failure(pageResult.error);
    }

    if (!pageResult.data) {
      return failure(new NotFoundError('Page', id));
    }

    const page = await this.attachSpecializations(pageResult.data);
    return success(page);
  }

  async getBySlug(slug: string): Promise<Result<Page>> {
    const pageResult = await this.pageRepository.findBySlug(slug);
    if (pageResult.isFailure()) {
      return failure(pageResult.error);
    }

    if (!pageResult.data) {
      return failure(new NotFoundError('Page', slug));
    }

    const page = await this.attachSpecializations(pageResult.data);
    return success(page);
  }

  async getPublished(): Promise<Result<Page[]>> {
    const pagesResult = await this.pageRepository.findPublished();
    if (pagesResult.isFailure()) {
      return failure(pagesResult.error);
    }

    const pages = await Promise.all(pagesResult.data.map(page => this.attachSpecializations(page)));

    return success(pages);
  }

  async getPublishedBySlug(slug: string): Promise<Result<Page>> {
    const pageResult = await this.getBySlug(slug);
    if (pageResult.isFailure()) {
      return pageResult;
    }

    if (!pageResult.data.is_published) {
      return failure(new NotFoundError('Page', slug));
    }

    return pageResult;
  }

  async create(input: CreatePageInput): Promise<Result<Page>> {
    const { specialization_ids = [], ...pageData } = input;
    const createResult = await this.pageRepository.create(pageData);
    if (createResult.isFailure()) {
      return failure(createResult.error);
    }

    await this.syncSpecializations(createResult.data.id, specialization_ids);
    const page = await this.attachSpecializations(createResult.data);
    return success(page);
  }

  async update(id: string, input: UpdatePageInput): Promise<Result<Page>> {
    const existsResult = await this.pageRepository.exists(id);
    if (existsResult.isFailure()) {
      return failure(existsResult.error);
    }
    if (!existsResult.data) {
      return failure(new NotFoundError('Page', id));
    }

    const { specialization_ids, ...pageData } = input;
    const updateResult = await this.pageRepository.update(id, pageData);
    if (updateResult.isFailure()) {
      return failure(updateResult.error);
    }

    if (specialization_ids) {
      await this.syncSpecializations(id, specialization_ids);
    }

    const page = await this.attachSpecializations(updateResult.data);
    return success(page);
  }

  async delete(id: string): Promise<Result<void>> {
    const existsResult = await this.pageRepository.exists(id);
    if (existsResult.isFailure()) {
      return failure(existsResult.error);
    }
    if (!existsResult.data) {
      return failure(new NotFoundError('Page', id));
    }

    await this.specializationRepository.deleteByPageId(id);
    return this.pageRepository.delete(id);
  }

  private async attachSpecializations(page: Page): Promise<Page> {
    const linksResult = await this.specializationRepository.listByPageId(page.id);
    if (linksResult.isFailure()) {
      return { ...page, specialization_ids: [] };
    }

    return {
      ...page,
      specialization_ids: linksResult.data.map(link => link.specialization_id),
    };
  }

  private async syncSpecializations(pageId: string, specializationIds: string[]) {
    const result = await this.specializationRepository.replaceLinks(pageId, specializationIds);
    if (result.isFailure()) {
      return;
    }
  }
}
