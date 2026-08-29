'use server';

import { createNewsService } from '@/services';
import type { CreateNewsInput, UpdateNewsInput } from '@/lib/schemas';
import { NewsItem } from '@/lib/types/news';
import { revalidatePath } from 'next/cache';
import { isAuthError, requireAuth } from '@/lib/auth';

async function requireAdminSession() {
  const session = await requireAuth();
  if (isAuthError(session)) {
    throw new Error('Brak autoryzacji');
  }
  return session;
}

export async function saveNewsAction(data: Partial<NewsItem>) {
  const newsService = createNewsService();

  const payload = {
    title: data.title || '',
    slug: data.slug || data.title || '',
    content: data.content || '',
    image_url: data.image_url || null,
    excerpt: data.excerpt || null,
    is_published: !!data.is_published,
    published_at: data.published_at ?? null,
    created_by: data.created_by ?? null,
  };

  try {
    await requireAdminSession();
    if (data.id) {
      const updatePayload: UpdateNewsInput = payload;
      const updated = await newsService.update(data.id, updatePayload);
      if (updated.isFailure()) {
        return { success: false, error: updated.error.message };
      }
    } else {
      const createPayload: CreateNewsInput = payload;
      const created = await newsService.create(createPayload);
      if (created.isFailure()) {
        return { success: false, error: created.error.message };
      }
    }
    revalidatePath('/admin/news');
    revalidatePath('/');
    revalidatePath('/aktualnosci');
    return { success: true };
  } catch (error: any) {
    console.error('Error saving news:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteNewsAction(id: string): Promise<void> {
  const newsService = createNewsService();
  try {
    await requireAdminSession();
    const deleted = await newsService.delete(id);
    if (deleted.isFailure()) {
      throw deleted.error;
    }
    revalidatePath('/admin/news');
    revalidatePath('/');
    revalidatePath('/aktualnosci');
  } catch (error: any) {
    console.error('Error deleting news:', error);
    throw new Error(error.message);
  }
}
