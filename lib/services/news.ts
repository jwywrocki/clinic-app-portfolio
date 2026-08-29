import type { NewsItem } from '@/lib/types/news';
import type { CreateNewsInput, UpdateNewsInput } from '@/lib/schemas';
import type { NewsRepository } from '@/repositories';
import { failure, success, type Result, NotFoundError } from '@/domain';

export class NewsService {
  constructor(private repository: NewsRepository) {}

  async getAll(): Promise<Result<NewsItem[]>> {
    return this.repository.findAll({
      orderBy: { column: 'published_at', ascending: false },
    });
  }

  async getAllByCreatedAt(): Promise<Result<NewsItem[]>> {
    return this.repository.findAll({
      orderBy: { column: 'created_at', ascending: false },
    });
  }

  async getPublished(): Promise<Result<NewsItem[]>> {
    const publishedResult = await this.repository.findPublished();
    if (publishedResult.isFailure()) {
      return publishedResult;
    }

    const now = new Date();
    const visibleNews = publishedResult.data.filter(
      item => !item.published_at || new Date(item.published_at) <= now
    );

    return success(visibleNews);
  }

  async getById(id: string): Promise<Result<NewsItem>> {
    const result = await this.repository.findById(id);
    if (result.isFailure()) {
      return failure(result.error);
    }
    if (!result.data) {
      return failure(new NotFoundError('News', id));
    }
    return success(result.data);
  }

  async create(input: CreateNewsInput): Promise<Result<NewsItem>> {
    const payload = this.normalizeCreateInput(input);
    return this.repository.create(payload);
  }

  async update(id: string, input: UpdateNewsInput): Promise<Result<NewsItem>> {
    const existsResult = await this.repository.exists(id);
    if (existsResult.isFailure()) {
      return failure(existsResult.error);
    }
    if (!existsResult.data) {
      return failure(new NotFoundError('News', id));
    }

    const payload = this.normalizeUpdateInput(input);
    return this.repository.update(id, payload);
  }

  async delete(id: string): Promise<Result<void>> {
    const existsResult = await this.repository.exists(id);
    if (existsResult.isFailure()) {
      return failure(existsResult.error);
    }
    if (!existsResult.data) {
      return failure(new NotFoundError('News', id));
    }

    return this.repository.delete(id);
  }

  private normalizeCreateInput(
    input: CreateNewsInput
  ): Pick<
    NewsItem,
    'title' | 'content' | 'image_url' | 'excerpt' | 'is_published' | 'published_at'
  > {
    const shouldPublish = input.is_published;
    const publishedAt = shouldPublish
      ? (input.published_at ?? new Date().toISOString())
      : (input.published_at ?? null);

    return {
      title: input.title,
      content: input.content,
      image_url: input.image_url ?? null,
      excerpt: input.excerpt ?? null,
      is_published: input.is_published,
      published_at: publishedAt,
    };
  }

  private normalizeUpdateInput(
    input: UpdateNewsInput
  ): Partial<
    Pick<NewsItem, 'title' | 'content' | 'image_url' | 'excerpt' | 'is_published' | 'published_at'>
  > {
    const normalized: UpdateNewsInput = { ...input };

    if (normalized.is_published === true && !normalized.published_at) {
      normalized.published_at = new Date().toISOString();
    }

    if (normalized.is_published === false && normalized.published_at === undefined) {
      normalized.published_at = null;
    }

    const payload: Partial<
      Pick<
        NewsItem,
        'title' | 'content' | 'image_url' | 'excerpt' | 'is_published' | 'published_at'
      >
    > = {};

    if (normalized.title !== undefined) payload.title = normalized.title;
    if (normalized.content !== undefined) payload.content = normalized.content;
    if (normalized.image_url !== undefined) payload.image_url = normalized.image_url;
    if (normalized.excerpt !== undefined) payload.excerpt = normalized.excerpt;
    if (normalized.is_published !== undefined) payload.is_published = normalized.is_published;
    if (normalized.published_at !== undefined) payload.published_at = normalized.published_at;

    return payload;
  }
}
