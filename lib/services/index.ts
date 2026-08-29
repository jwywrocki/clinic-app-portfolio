export * from './doctor';
export * from './doctor-admin';
export * from './backups';
export * from './database-export';
export * from './auth';
export * from './news';
export * from './pages';
export * from './clinic-services';
export * from './menus';
export * from './contact';
export * from './surveys';
export * from './settings';
export * from './specializations';
export * from './users';

import {
  createClinicServicesRepository,
  createContactDetailRepository,
  createContactGroupRepository,
  createBackupRepository,
  createDatabaseExportRepository,
  createDoctorRepository,
  createDoctorSpecializationRepository,
  createMenuItemRepository,
  createNewsRepository,
  createPageRepository,
  createPageSpecializationRepository,
  createSurveyAnswerRepository,
  createSurveyOptionRepository,
  createSurveyQuestionRepository,
  createSurveyRepository,
  createSettingsRepository,
  createSpecializationRepository,
  createRoleRepository,
  createUserRepository,
  createUserRoleRepository,
} from '@/repositories';
import { DoctorService } from './doctor';
import { DoctorAdminService } from './doctor-admin';
import { BackupService } from './backups';
import { DatabaseExportService } from './database-export';
import { AuthService } from './auth';
import { SettingsService } from './settings';
import { MenusService } from './menus';
import { NewsService } from './news';
import { ClinicServicesService } from './clinic-services';
import { PagesService } from './pages';
import { ContactService } from './contact';
import { SurveyService } from './surveys';
import { UserService } from './users';
import { SpecializationService } from './specializations';

export function createDoctorService() {
  return new DoctorService(createDoctorRepository());
}

export function createBackupService() {
  return new BackupService(createBackupRepository());
}

export function createDatabaseExportService() {
  return new DatabaseExportService(createDatabaseExportRepository());
}

export function createAuthService() {
  return new AuthService(
    createUserRepository(),
    createRoleRepository(),
    createUserRoleRepository()
  );
}

export function createDoctorAdminService() {
  return new DoctorAdminService(
    createDoctorRepository(),
    createSpecializationRepository(),
    createDoctorSpecializationRepository()
  );
}

export function createMenusService() {
  return new MenusService(createMenuItemRepository());
}

export function createNewsService() {
  return new NewsService(createNewsRepository());
}

export function createClinicServicesService() {
  return new ClinicServicesService(createClinicServicesRepository());
}

export function createContactService() {
  return new ContactService(createContactGroupRepository(), createContactDetailRepository());
}

export function createPagesService() {
  return new PagesService(createPageRepository(), createPageSpecializationRepository());
}

export function createSpecializationService() {
  return new SpecializationService(createSpecializationRepository());
}

export function createSurveyService() {
  return new SurveyService(
    createSurveyRepository(),
    createSurveyQuestionRepository(),
    createSurveyOptionRepository(),
    createSurveyAnswerRepository()
  );
}

export function createSettingsService() {
  return new SettingsService(createSettingsRepository());
}

export function createUserService() {
  return new UserService(
    createUserRepository(),
    createRoleRepository(),
    createUserRoleRepository()
  );
}
