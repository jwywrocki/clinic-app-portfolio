import { BaseEntity, QueryOptions, Result } from '@/domain';
import type { MenuItem } from '@/lib/types/menu';
import type { NewsItem } from '@/lib/types/news';
import type { Service } from '@/lib/types/services';
import type { SiteSetting } from '@/lib/types/settings';
import type { PageSpecializationLink } from '@/lib/types/pages';
import type { ContactDetail, ContactGroup } from '@/lib/types/contact';
import type { Question, QuestionOption, Survey, SurveyAnswer } from '@/lib/types/surveys';
import type { DoctorSpecializationLink } from '@/lib/types/doctors';
import type { Specialization } from '@/lib/types/specializations';
import type { Role, User, UserRoleLink } from '@/lib/types/users';
import type { DatabaseBackup } from '@/lib/types/backups';

export interface Repository<T extends BaseEntity> {
  findById(id: string): Promise<Result<T | null>>;
  findAll(options?: QueryOptions): Promise<Result<T[]>>;
  create(entity: Omit<T, 'id' | 'created_at' | 'updated_at'>): Promise<Result<T>>;
  update(id: string, updates: Partial<Omit<T, 'id' | 'created_at'>>): Promise<Result<T>>;
  delete(id: string): Promise<Result<void>>;
  exists(id: string): Promise<Result<boolean>>;
}

export interface DoctorRepository extends Repository<import('@/domain').Doctor> {
  findBySpecialization(specialization: string): Promise<Result<import('@/domain').Doctor[]>>;
  findByCategory(category: string): Promise<Result<import('@/domain').Doctor[]>>;
  findActive(): Promise<Result<import('@/domain').Doctor[]>>;
  updateOrderPositions(
    updates: Array<{ id: string; order_position: number }>
  ): Promise<Result<void>>;
}

export interface DoctorSpecializationRepository {
  listAll(): Promise<Result<DoctorSpecializationLink[]>>;
  listByDoctorId(doctorId: string): Promise<Result<DoctorSpecializationLink[]>>;
  addLink(doctorId: string, specializationId: string): Promise<Result<DoctorSpecializationLink>>;
  replaceLinks(doctorId: string, specializationIds: string[]): Promise<Result<void>>;
  deleteByDoctorId(doctorId: string): Promise<Result<void>>;
}

export interface PageRepository extends Repository<import('@/domain').Page> {
  findBySlug(slug: string): Promise<Result<import('@/domain').Page | null>>;
  findPublished(): Promise<Result<import('@/domain').Page[]>>;
  findByCategory(category?: string): Promise<Result<import('@/domain').Page[]>>;
}

export interface MenuItemRepository extends Repository<MenuItem> {
  findPublished(): Promise<Result<MenuItem[]>>;
  updateOrderPositions(
    updates: Array<{ id: string; order_position: number; parent_id?: string | null }>
  ): Promise<Result<void>>;
}

export interface NewsRepository extends Repository<NewsItem> {
  findPublished(): Promise<Result<NewsItem[]>>;
}

export interface ClinicServicesRepository extends Repository<Service> {
  findPublished(): Promise<Result<Service[]>>;
}

export interface SpecializationRepository extends Repository<Specialization> {
  findByName(name: string): Promise<Result<Specialization | null>>;
  hasLinkedDoctors(specializationId: string, specializationName?: string): Promise<Result<boolean>>;
}

export interface ContactGroupRepository extends Repository<ContactGroup> {
  listOrdered(): Promise<Result<ContactGroup[]>>;
  updateOrderPositions(
    updates: Array<{ id: string; order_position: number }>
  ): Promise<Result<void>>;
}

export interface ContactDetailRepository extends Repository<ContactDetail> {
  listOrdered(): Promise<Result<ContactDetail[]>>;
  listByGroupId(groupId: string): Promise<Result<ContactDetail[]>>;
  deleteByGroupId(groupId: string): Promise<Result<void>>;
}

export interface SurveyRepository extends Repository<Survey> {
  listOrdered(): Promise<Result<Survey[]>>;
  findPublishedById(id: string): Promise<Result<Survey | null>>;
  countAll(): Promise<Result<number>>;
  countPublished(): Promise<Result<number>>;
}

export interface SurveyQuestionRepository {
  findById(id: string): Promise<Result<Question | null>>;
  findAll(): Promise<Result<Question[]>>;
  create(data: Omit<Question, 'id'>): Promise<Result<Question>>;
  update(id: string, updates: Partial<Omit<Question, 'id'>>): Promise<Result<Question>>;
  delete(id: string): Promise<Result<void>>;
  exists(id: string): Promise<Result<boolean>>;
  listBySurveyId(surveyId: string): Promise<Result<Question[]>>;
  updateOrder(questionId: string, orderNo: number): Promise<Result<Question>>;
}

export interface SurveyOptionRepository {
  findById(id: string): Promise<Result<QuestionOption | null>>;
  findAll(): Promise<Result<QuestionOption[]>>;
  create(data: Omit<QuestionOption, 'id'>): Promise<Result<QuestionOption>>;
  update(id: string, updates: Partial<Omit<QuestionOption, 'id'>>): Promise<Result<QuestionOption>>;
  delete(id: string): Promise<Result<void>>;
  exists(id: string): Promise<Result<boolean>>;
  listByQuestionId(questionId: string): Promise<Result<QuestionOption[]>>;
  updateOrder(optionId: string, orderNo: number): Promise<Result<QuestionOption>>;
}

export interface SurveyAnswerRepository {
  findById(id: string): Promise<Result<SurveyAnswer | null>>;
  findAll(): Promise<Result<SurveyAnswer[]>>;
  create(data: Omit<SurveyAnswer, 'id'>): Promise<Result<SurveyAnswer>>;
  update(id: string, updates: Partial<Omit<SurveyAnswer, 'id'>>): Promise<Result<SurveyAnswer>>;
  delete(id: string): Promise<Result<void>>;
  exists(id: string): Promise<Result<boolean>>;
  listBySurveyId(surveyId: string): Promise<Result<SurveyAnswer[]>>;
  insertMany(rows: Omit<SurveyAnswer, 'id'>[]): Promise<Result<SurveyAnswer[]>>;
}

export interface UserRepository extends Repository<User> {
  findByUsername(username: string): Promise<Result<User | null>>;
}

export interface RoleRepository extends Repository<Role> {
  findByName(name: string): Promise<Result<Role | null>>;
}

export interface UserRoleRepository extends Repository<UserRoleLink> {
  listByUserId(userId: string): Promise<Result<UserRoleLink[]>>;
  deleteByUserId(userId: string): Promise<Result<void>>;
  replaceRole(userId: string, roleId: string): Promise<Result<void>>;
}

export interface PageSpecializationRepository {
  listByPageId(pageId: string): Promise<Result<PageSpecializationLink[]>>;
  replaceLinks(pageId: string, specializationIds: string[]): Promise<Result<void>>;
  deleteByPageId(pageId: string): Promise<Result<void>>;
}

export interface SettingsRepository extends Repository<SiteSetting> {
  findByKey(key: string): Promise<Result<SiteSetting | null>>;
  upsertByKey(input: {
    key: string;
    value: string | null;
    description?: string | null;
    updatedBy?: string | null;
  }): Promise<Result<SiteSetting>>;
  deleteByKey(key: string): Promise<Result<boolean>>;
  listAllAsMap(): Promise<Result<Record<string, string>>>;
}

export interface BackupRepository {
  listRecent(limit: number): Promise<Result<DatabaseBackup[]>>;
  listAll(): Promise<Result<DatabaseBackup[]>>;
  findLatestByType(backupType: string): Promise<Result<DatabaseBackup | null>>;
  findCompletedById(id: string): Promise<Result<DatabaseBackup | null>>;
  create(data: Omit<DatabaseBackup, 'created_at'>): Promise<Result<DatabaseBackup>>;
  update(
    id: string,
    updates: Partial<Omit<DatabaseBackup, 'id' | 'created_at'>>
  ): Promise<Result<DatabaseBackup>>;
  delete(id: string): Promise<Result<void>>;
}

export interface DatabaseExportRepository {
  listTable(tableName: string): Promise<Result<Record<string, unknown>[]>>;
}
