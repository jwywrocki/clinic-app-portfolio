import { DoctorsManagement } from '../../components/DoctorsManagement';
import { saveDoctorAction, deleteDoctorAction } from '../../actions/doctors';
import { Doctor } from '@/lib/types/doctors';
import { Specialization } from '@/lib/types/specializations';
import { createDoctorAdminService } from '@/services';

export default async function AdminDoctorsPage() {
  const doctorAdminService = createDoctorAdminService();
  const overview = await doctorAdminService.getAdminOverview();
  const doctors: Doctor[] = overview.isFailure() ? [] : overview.data.doctors;
  const specializations: Specialization[] = overview.isFailure()
    ? []
    : overview.data.specializations;

  return (
    <DoctorsManagement
      doctors={doctors}
      specializations={specializations}
      onSave={saveDoctorAction}
      onDelete={deleteDoctorAction}
    />
  );
}
