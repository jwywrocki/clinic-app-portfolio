import { SpecializationsManagement } from '../../components/SpecializationsManagement';
import {
  saveSpecializationAction,
  deleteSpecializationAction,
} from '../../actions/specializations';
import { Specialization } from '@/lib/types/specializations';
import { createSpecializationService } from '@/services';

export default async function AdminSpecializationsPage() {
  const specializationService = createSpecializationService();
  const listResult = await specializationService.getAll();
  const specializations: Specialization[] = listResult.isFailure() ? [] : listResult.data;

  return (
    <SpecializationsManagement
      specializations={specializations}
      onSave={saveSpecializationAction}
      onDelete={deleteSpecializationAction}
    />
  );
}
