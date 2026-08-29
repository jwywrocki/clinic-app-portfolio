'use server';

import { createMenusService } from '@/services';
import type { CreateMenuItemInput, UpdateMenuItemInput } from '@/lib/schemas';
import { MenuItem } from '@/lib/types/menu';
import type { LoosePartial } from '@/lib/db/types';
import { revalidatePath } from 'next/cache';
import { isAuthError, requireAuth } from '@/lib/auth';

async function requireAdminSession() {
  const session = await requireAuth();
  if (isAuthError(session)) {
    throw new Error('Brak autoryzacji');
  }
  return session;
}

export async function saveMenuAction(data: LoosePartial<MenuItem>) {
  const menusService = createMenusService();
  const userId = 'system'; // Get this from session properly in real implementation

  const payload = {
    title: data.title || '',
    url: data.url || null,
    order_position: data.order_position || 0,
    parent_id: data.parent_id ?? null,
    is_published: !!data.is_published,
  };

  try {
    await requireAdminSession();
    if (data.id) {
      const updatePayload: UpdateMenuItemInput = payload;
      const updated = await menusService.update(data.id, updatePayload);
      if (updated.isFailure()) {
        return { success: false, error: updated.error.message };
      }
    } else {
      const createPayload: CreateMenuItemInput = {
        ...payload,
        created_by: userId,
      };
      const created = await menusService.create(createPayload);
      if (created.isFailure()) {
        return { success: false, error: created.error.message };
      }
    }
    revalidatePath('/admin/menus');
    revalidatePath('/'); // Menus can affect anywhere
    return { success: true };
  } catch (error: any) {
    console.error('Error saving menu item:', error);
    return { success: false, error: error.message };
  }
}

export async function updateMenuOrderAction(updatedItems: MenuItem[]) {
  const menusService = createMenusService();

  try {
    await requireAdminSession();
    const updates = updatedItems
      .filter(item => item.id)
      .map(item => ({
        id: item.id,
        order_position: item.order_position,
        parent_id: item.parent_id ?? null,
      }));
    const reordered = await menusService.reorder(updates);
    if (reordered.isFailure()) {
      return { success: false, error: reordered.error.message };
    }
    revalidatePath('/admin/menus');
    revalidatePath('/');
    return { success: true };
  } catch (error: any) {
    console.error('Error updating menu order:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteMenuAction(id: string): Promise<void> {
  const menusService = createMenusService();
  try {
    await requireAdminSession();
    const itemsResult = await menusService.getAll();
    if (itemsResult.isFailure()) {
      throw itemsResult.error;
    }

    const children = itemsResult.data.filter(item => item.parent_id === id);
    for (const child of children) {
      const deletedChild = await menusService.delete(child.id);
      if (deletedChild.isFailure()) {
        throw deletedChild.error;
      }
    }

    const deleted = await menusService.delete(id);
    if (deleted.isFailure()) {
      throw deleted.error;
    }
    revalidatePath('/admin/menus');
    revalidatePath('/');
  } catch (error: any) {
    console.error('Error deleting menu item:', error);
    throw new Error(error.message);
  }
}
