import { Dashboard } from '../../components/Dashboard';
import {
  createClinicServicesService,
  createDoctorService,
  createNewsService,
  createPagesService,
} from '@/services';
import type { Page } from '@/lib/types/pages';
import type { Service } from '@/lib/types/services';
import type { NewsItem } from '@/lib/types/news';
import type { Doctor } from '@/lib/types/doctors';

export default async function AdminDashboardPage() {
  const pagesService = createPagesService();
  const clinicServicesService = createClinicServicesService();
  const newsService = createNewsService();
  const doctorService = createDoctorService();

  const pagesResult = await pagesService.getAllByUpdatedAt();
  const servicesResult = await clinicServicesService.getAll();
  const newsResult = await newsService.getAllByCreatedAt();
  const doctorsResult = await doctorService.getAllDoctors();

  const pages: Page[] = pagesResult.isFailure() ? [] : pagesResult.data;
  const services: Service[] = servicesResult.isFailure() ? [] : servicesResult.data;
  const news: NewsItem[] = newsResult.isFailure() ? [] : newsResult.data;
  const doctors: Doctor[] = doctorsResult.isFailure() ? [] : doctorsResult.data;

  return <Dashboard pages={pages} services={services} news={news} doctors={doctors} />;
}
