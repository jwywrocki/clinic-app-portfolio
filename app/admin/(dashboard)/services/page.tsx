import { ServicesManagement } from '../../components/ServicesManagement';
import {
  saveServiceAction,
  deleteServiceAction,
  reorderServiceAction,
} from '../../actions/services';
import { Service } from '@/lib/types/services';
import { createClinicServicesService } from '@/services';

export default async function AdminServicesPage() {
  const clinicServicesService = createClinicServicesService();
  const servicesResult = await clinicServicesService.getAll();
  const services: Service[] = servicesResult.isFailure() ? [] : servicesResult.data;

  return (
    <ServicesManagement
      services={services as Service[]}
      onSave={saveServiceAction}
      onDelete={deleteServiceAction}
      onReorder={reorderServiceAction}
    />
  );
}
