'use server';

import { createPagesService } from '@/services';
import type { CreatePageInput, UpdatePageInput } from '@/lib/schemas';
import { Page } from '@/lib/types/pages';
import { revalidatePath } from 'next/cache';
import { isAuthError, requireAuth } from '@/lib/auth';

async function requireAdminSession() {
  const session = await requireAuth();
  if (isAuthError(session)) {
    throw new Error('Brak autoryzacji');
  }
  return session;
}

export async function savePageAction(data: Partial<Page>) {
  const pagesService = createPagesService();

  const payload = {
    title: data.title || '',
    slug: data.slug || '',
    content: data.content || '',
    meta_description: data.meta_description || null,
    is_published: !!data.is_published,
    survey_id: data.survey_id ?? null,
    specialization_ids: (data.specialization_ids || []).filter(Boolean),
  };

  try {
    await requireAdminSession();
    if (data.id) {
      const updatePayload: UpdatePageInput = payload;
      const updated = await pagesService.update(data.id, updatePayload);
      if (updated.isFailure()) {
        return { success: false, error: updated.error.message };
      }
    } else {
      const createPayload: CreatePageInput = {
        ...payload,
        created_by: data.created_by ?? null,
      };
      const created = await pagesService.create(createPayload);
      if (created.isFailure()) {
        return { success: false, error: created.error.message };
      }
    }

    revalidatePath('/admin/pages');
    revalidatePath(`/${data.slug}`);
    return { success: true };
  } catch (error: any) {
    console.error('Error saving page:', error);
    return { success: false, error: error.message };
  }
}

export async function deletePageAction(id: string): Promise<void> {
  const pagesService = createPagesService();
  try {
    await requireAdminSession();
    const deleted = await pagesService.delete(id);
    if (deleted.isFailure()) {
      throw deleted.error;
    }
    revalidatePath('/admin/pages');
  } catch (error: any) {
    console.error('Error deleting page:', error);
    throw new Error(error.message);
  }
}
