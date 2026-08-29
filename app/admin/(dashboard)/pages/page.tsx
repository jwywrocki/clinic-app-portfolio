import { PagesManagement } from '../../components/PagesManagement';
import { savePageAction, deletePageAction } from '../../actions/pages';
import { Page } from '@/lib/types/pages';
import { Specialization } from '@/lib/types/specializations';
import { createPagesService, createSpecializationService } from '@/services';

export default async function AdminPagesPage() {
  const pagesService = createPagesService();
  const specializationsService = createSpecializationService();

  const pagesResult = await pagesService.getAllByUpdatedAt();
  const specializationsResult = await specializationsService.getAll();

  const pages: Page[] = pagesResult.isFailure() ? [] : pagesResult.data;
  const specializations: Specialization[] = specializationsResult.isFailure()
    ? []
    : specializationsResult.data;

  return (
    <PagesManagement
      pages={pages as Page[]}
      specializations={specializations}
      onSave={savePageAction}
      onDelete={deletePageAction}
    />
  );
}
