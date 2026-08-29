'use server';

import {
  createSpecializationService,
  type CreateSpecializationRequest,
  type UpdateSpecializationRequest,
} from '@/services';
import { revalidatePath } from 'next/cache';
import { Specialization } from '@/lib/types/specializations';
import { isAuthError, requireAuth } from '@/lib/auth';

async function requireAdminSession() {
  const session = await requireAuth();
  if (isAuthError(session)) {
    throw new Error('Brak autoryzacji');
  }
  return session;
}

export async function saveSpecializationAction(data: Partial<Specialization>) {
  try {
    await requireAdminSession();
    const specializationService = createSpecializationService();

    if (data.id) {
      const payload: UpdateSpecializationRequest = {};
      if (data.name !== undefined) payload.name = data.name;
      if (data.description !== undefined) payload.description = data.description;

      const updated = await specializationService.update(data.id, payload);
      if (updated.isFailure()) {
        return { success: false, error: updated.error.message };
      }
    } else {
      const payload: CreateSpecializationRequest = {
        name: data.name ?? '',
        description: data.description ?? null,
      };

      const created = await specializationService.create(payload);
      if (created.isFailure()) {
        return { success: false, error: created.error.message };
      }
    }

    revalidatePath('/admin/specializations');
    revalidatePath('/admin/doctors');
    revalidatePath('/lekarze');
    return { success: true };
  } catch (error: any) {
    console.error('Error saving specialization:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteSpecializationAction(id: string) {
  try {
    await requireAdminSession();
    const specializationService = createSpecializationService();
    const deleted = await specializationService.delete(id);
    if (deleted.isFailure()) {
      return { success: false, error: deleted.error.message };
    }

    revalidatePath('/admin/specializations');
    revalidatePath('/admin/doctors');
    revalidatePath('/lekarze');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting specialization:', error);
    return { success: false, error: error.message };
  }
}
