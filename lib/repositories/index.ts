export * from './interfaces';
export * from './base';
export * from './backups';
export * from './database-export';
export * from './clinic-services';
export * from './contact';
export * from './doctor';
export * from './doctor-specializations';
export * from './menu';
export * from './news';
export * from './page';
export * from './page-specializations';
export * from './specializations';
export * from './settings';
export * from './surveys';
export * from './users';

// Factory function to create repository instances
import { getDB } from '@/lib/db';
import { BackupRepositoryImpl } from './backups';
import { DatabaseExportRepositoryImpl } from './database-export';
import { DoctorRepositoryImpl } from './doctor';
import { DoctorSpecializationRepositoryImpl } from './doctor-specializations';
import { MenuItemRepositoryImpl } from './menu';
import { NewsRepositoryImpl } from './news';
import { PageRepositoryImpl } from './page';
import { PageSpecializationRepositoryImpl } from './page-specializations';
import { SettingsRepositoryImpl } from './settings';
import { ClinicServicesRepositoryImpl } from './clinic-services';
import { ContactDetailRepositoryImpl, ContactGroupRepositoryImpl } from './contact';
import { SpecializationRepositoryImpl } from './specializations';
import {
  SurveyAnswerRepositoryImpl,
  SurveyOptionRepositoryImpl,
  SurveyQuestionRepositoryImpl,
  SurveyRepositoryImpl,
} from './surveys';
import { RoleRepositoryImpl, UserRepositoryImpl, UserRoleRepositoryImpl } from './users';

export function createDoctorRepository() {
  return new DoctorRepositoryImpl(getDB());
}

export function createBackupRepository() {
  return new BackupRepositoryImpl(getDB());
}

export function createDatabaseExportRepository() {
  return new DatabaseExportRepositoryImpl(getDB());
}

export function createDoctorSpecializationRepository() {
  return new DoctorSpecializationRepositoryImpl(getDB());
}

export function createContactGroupRepository() {
  return new ContactGroupRepositoryImpl(getDB());
}

export function createContactDetailRepository() {
  return new ContactDetailRepositoryImpl(getDB());
}

export function createMenuItemRepository() {
  return new MenuItemRepositoryImpl(getDB());
}

export function createNewsRepository() {
  return new NewsRepositoryImpl(getDB());
}

export function createClinicServicesRepository() {
  return new ClinicServicesRepositoryImpl(getDB());
}

export function createPageRepository() {
  return new PageRepositoryImpl(getDB());
}

export function createPageSpecializationRepository() {
  return new PageSpecializationRepositoryImpl(getDB());
}

export function createSpecializationRepository() {
  return new SpecializationRepositoryImpl(getDB());
}

export function createSurveyRepository() {
  return new SurveyRepositoryImpl(getDB());
}

export function createSurveyQuestionRepository() {
  return new SurveyQuestionRepositoryImpl(getDB());
}

export function createSurveyOptionRepository() {
  return new SurveyOptionRepositoryImpl(getDB());
}

export function createSurveyAnswerRepository() {
  return new SurveyAnswerRepositoryImpl(getDB());
}

export function createUserRepository() {
  return new UserRepositoryImpl(getDB());
}

export function createRoleRepository() {
  return new RoleRepositoryImpl(getDB());
}

export function createUserRoleRepository() {
  return new UserRoleRepositoryImpl(getDB());
}

export function createSettingsRepository() {
  return new SettingsRepositoryImpl(getDB());
}

// Add more repository factories as needed
