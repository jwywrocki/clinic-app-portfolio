import type { DBClient } from '@/lib/db/types';
import type { NewsItem } from '@/lib/types/news';
import { BaseRepository } from './base';
import type { NewsRepository } from './interfaces';
import type { Result } from '@/domain';

export class NewsRepositoryImpl extends BaseRepository<NewsItem> implements NewsRepository {
  constructor(db: DBClient) {
    super(db, 'news');
  }

  async findPublished(): Promise<Result<NewsItem[]>> {
    return this.findByField('is_published', true, {
      orderBy: { column: 'published_at', ascending: false },
    });
  }
}
