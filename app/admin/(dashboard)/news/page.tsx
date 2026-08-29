import { NewsManagement } from '../../components/NewsManagement';
import { saveNewsAction, deleteNewsAction } from '../../actions/news';
import { NewsItem } from '@/lib/types/news';
import { createNewsService } from '@/services';

export default async function AdminNewsPage() {
  const newsService = createNewsService();
  const newsResult = await newsService.getAllByCreatedAt();
  const news: NewsItem[] = newsResult.isFailure() ? [] : newsResult.data;

  return (
    <NewsManagement news={news as NewsItem[]} onSave={saveNewsAction} onDelete={deleteNewsAction} />
  );
}
