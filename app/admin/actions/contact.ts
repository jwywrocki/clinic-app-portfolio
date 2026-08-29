'use server';

import { revalidatePath } from 'next/cache';
import { createContactService } from '@/services';
import type {
  CreateContactDetailInput,
  CreateContactGroupInput,
  UpdateContactDetailInput,
  UpdateContactGroupInput,
} from '@/lib/schemas';
import type { ContactGroup, ContactDetail } from '@/lib/types/contact';
import { isAuthError, requireAuth } from '@/lib/auth';

async function requireAdminSession() {
  const session = await requireAuth();
  if (isAuthError(session)) {
    throw new Error('Brak autoryzacji');
  }
  return session;
}

/**
 * Creates or updates a contact group and its details.
 * If group.id starts with "new-" (or is empty), a new group is created.
 * Otherwise the existing group is updated.
 */
export async function saveContactGroupAction(group: ContactGroup): Promise<void> {
  await requireAdminSession();
  const contactService = createContactService();
  const isNew = !group.id || group.id.startsWith('new-');

  // Prepare group fields (strip client-only transient ids / nested details)
  const { contact_details } = group;

  let savedGroup: ContactGroup;

  const groupPayload: CreateContactGroupInput = {
    label: group.label,
    in_hero: group.in_hero,
    in_footer: group.in_footer,
    order_position: group.order_position,
  };

  if (isNew) {
    const created = await contactService.createGroup(groupPayload);
    if (created.isFailure()) {
      throw created.error;
    }
    savedGroup = created.data;
  } else {
    const updatePayload: UpdateContactGroupInput = groupPayload;
    const updated = await contactService.updateGroup(group.id, updatePayload);
    if (updated.isFailure()) {
      throw updated.error;
    }
    savedGroup = updated.data;
  }

  const groupId = savedGroup.id;

  // Persist each contact detail
  if (contact_details && contact_details.length > 0) {
    for (const detail of contact_details) {
      const isNewDetail = !detail.id || detail.id.startsWith('new-');
      const detailPayload: CreateContactDetailInput = {
        type: detail.type,
        value: detail.value,
        group_id: groupId,
        order_position: detail.order_position,
      };

      if (isNewDetail) {
        const createdDetail = await contactService.createDetail(detailPayload);
        if (createdDetail.isFailure()) {
          throw createdDetail.error;
        }
      } else {
        const updatePayload: UpdateContactDetailInput = detailPayload;
        const updatedDetail = await contactService.updateDetail(detail.id, updatePayload);
        if (updatedDetail.isFailure()) {
          throw updatedDetail.error;
        }
      }
    }
  }

  revalidatePath('/admin/contact');
  revalidatePath('/kontakt');
  revalidatePath('/');
}

/**
 * Deletes a contact group and all its associated details.
 */
export async function deleteContactGroupAction(groupId: string): Promise<void> {
  await requireAdminSession();
  const contactService = createContactService();
  const deleted = await contactService.deleteGroup(groupId);
  if (deleted.isFailure()) {
    throw deleted.error;
  }
  revalidatePath('/admin/contact');
  revalidatePath('/kontakt');
  revalidatePath('/');
}

/**
 * Deletes a single contact detail.
 */
export async function deleteContactDetailAction(detailId: string, _groupId: string): Promise<void> {
  await requireAdminSession();
  const contactService = createContactService();
  const deleted = await contactService.deleteDetail(detailId);
  if (deleted.isFailure()) {
    throw deleted.error;
  }
  revalidatePath('/admin/contact');
  revalidatePath('/kontakt');
  revalidatePath('/');
}

/**
 * Persists a new ordering of contact groups.
 */
export async function reorderContactGroupsAction(groups: ContactGroup[]): Promise<void> {
  await requireAdminSession();
  const contactService = createContactService();
  const reordered = groups.map((g, index) => ({
    id: g.id,
    order_position: index,
  }));
  const updated = await contactService.reorderGroups(reordered);
  if (updated.isFailure()) {
    throw updated.error;
  }
  revalidatePath('/admin/contact');
  revalidatePath('/kontakt');
  revalidatePath('/');
}
