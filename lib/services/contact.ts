import type { ContactGroup, ContactDetail } from '@/lib/types/contact';
import type {
  CreateContactDetailInput,
  CreateContactGroupInput,
  UpdateContactDetailInput,
  UpdateContactGroupInput,
} from '@/lib/schemas';
import type { ContactDetailRepository, ContactGroupRepository } from '@/repositories';
import { failure, success, type Result, NotFoundError } from '@/domain';

export class ContactService {
  constructor(
    private groupRepository: ContactGroupRepository,
    private detailRepository: ContactDetailRepository
  ) {}

  async getAllDetails(): Promise<Result<ContactDetail[]>> {
    return this.detailRepository.listOrdered();
  }

  async getDetailById(id: string): Promise<Result<ContactDetail>> {
    const detailResult = await this.detailRepository.findById(id);
    if (detailResult.isFailure()) {
      return failure(detailResult.error);
    }
    if (!detailResult.data) {
      return failure(new NotFoundError('Contact detail', id));
    }
    return success(detailResult.data);
  }

  async getAllGroupsWithDetails(): Promise<Result<ContactGroup[]>> {
    const groupResult = await this.groupRepository.listOrdered();
    if (groupResult.isFailure()) {
      return failure(groupResult.error);
    }

    const detailResult = await this.detailRepository.listOrdered();
    if (detailResult.isFailure()) {
      return failure(detailResult.error);
    }

    const detailsByGroupId = detailResult.data.reduce<Record<string, ContactDetail[]>>(
      (acc, detail) => {
        if (!detail.group_id) return acc;
        acc[detail.group_id] = acc[detail.group_id] || [];
        acc[detail.group_id]?.push(detail);
        return acc;
      },
      {}
    );

    const groups = groupResult.data.map(group => ({
      ...group,
      contact_details: detailsByGroupId[group.id] || [],
    }));

    return success(groups);
  }

  async getGroupWithDetails(groupId: string): Promise<Result<ContactGroup>> {
    const groupResult = await this.groupRepository.findById(groupId);
    if (groupResult.isFailure()) {
      return failure(groupResult.error);
    }
    if (!groupResult.data) {
      return failure(new NotFoundError('Contact group', groupId));
    }

    const detailResult = await this.detailRepository.listByGroupId(groupId);
    if (detailResult.isFailure()) {
      return failure(detailResult.error);
    }

    return success({
      ...groupResult.data,
      contact_details: detailResult.data,
    });
  }

  async createGroup(input: CreateContactGroupInput): Promise<Result<ContactGroup>> {
    const createResult = await this.groupRepository.create(input);
    if (createResult.isFailure()) {
      return failure(createResult.error);
    }

    return success({ ...createResult.data, contact_details: [] });
  }

  async updateGroup(id: string, input: UpdateContactGroupInput): Promise<Result<ContactGroup>> {
    const existsResult = await this.groupRepository.exists(id);
    if (existsResult.isFailure()) {
      return failure(existsResult.error);
    }
    if (!existsResult.data) {
      return failure(new NotFoundError('Contact group', id));
    }

    const updateResult = await this.groupRepository.update(id, input);
    if (updateResult.isFailure()) {
      return failure(updateResult.error);
    }

    const detailResult = await this.detailRepository.listByGroupId(id);
    if (detailResult.isFailure()) {
      return failure(detailResult.error);
    }

    return success({
      ...updateResult.data,
      contact_details: detailResult.data,
    });
  }

  async createDetail(input: CreateContactDetailInput): Promise<Result<ContactDetail>> {
    return this.detailRepository.create(input);
  }

  async updateDetail(id: string, input: UpdateContactDetailInput): Promise<Result<ContactDetail>> {
    const existsResult = await this.detailRepository.exists(id);
    if (existsResult.isFailure()) {
      return failure(existsResult.error);
    }
    if (!existsResult.data) {
      return failure(new NotFoundError('Contact detail', id));
    }

    return this.detailRepository.update(id, input);
  }

  async deleteDetail(id: string): Promise<Result<void>> {
    const existsResult = await this.detailRepository.exists(id);
    if (existsResult.isFailure()) {
      return failure(existsResult.error);
    }
    if (!existsResult.data) {
      return failure(new NotFoundError('Contact detail', id));
    }

    return this.detailRepository.delete(id);
  }

  async deleteGroup(id: string): Promise<Result<void>> {
    const existsResult = await this.groupRepository.exists(id);
    if (existsResult.isFailure()) {
      return failure(existsResult.error);
    }
    if (!existsResult.data) {
      return failure(new NotFoundError('Contact group', id));
    }

    const detailsDelete = await this.detailRepository.deleteByGroupId(id);
    if (detailsDelete.isFailure()) {
      return failure(detailsDelete.error);
    }

    return this.groupRepository.delete(id);
  }

  async reorderGroups(groups: { id: string; order_position: number }[]): Promise<Result<void>> {
    return this.groupRepository.updateOrderPositions(groups);
  }
}
