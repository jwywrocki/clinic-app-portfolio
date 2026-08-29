'use server';

import { createUserService, type CreateUserRequest, type UpdateUserRequest } from '@/services';
import { User } from '@/lib/types/users';
import { revalidatePath } from 'next/cache';
import { isAuthError, requireAuth } from '@/lib/auth';

async function requireAdminSession() {
  const session = await requireAuth();
  if (isAuthError(session)) {
    throw new Error('Brak autoryzacji');
  }
  return session;
}

export async function saveUserAction(data: Partial<User>) {
  try {
    await requireAdminSession();
    const userService = createUserService();
    if (data.id) {
      // Update
      const payload: UpdateUserRequest = {};
      if (data.username !== undefined) payload.username = data.username;
      if (data.password_hash !== undefined) payload.password = data.password_hash;
      if (data.is_active !== undefined) payload.is_active = data.is_active;
      if (data.role !== undefined) payload.role = data.role;

      const updated = await userService.updateUser(data.id, payload);
      if (updated.isFailure()) {
        return { success: false, error: updated.error.message };
      }
    } else {
      // Create
      if (!data.username || !data.password_hash) {
        return { success: false, error: 'Username and password are required' };
      }
      const payload: CreateUserRequest = {
        username: data.username,
        password: data.password_hash,
        is_active: data.is_active ?? true,
      };
      if (data.role !== undefined) payload.role = data.role;

      const created = await userService.createUser(payload);
      if (created.isFailure()) {
        return { success: false, error: created.error.message };
      }
    }
    revalidatePath('/admin/users');
    return { success: true };
  } catch (error: any) {
    console.error('Error saving user:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteUserAction(id: string): Promise<void> {
  try {
    await requireAdminSession();
    const userService = createUserService();
    const deleted = await userService.deleteUser(id);
    if (deleted.isFailure()) {
      throw deleted.error;
    }
    revalidatePath('/admin/users');
  } catch (error: any) {
    console.error('Error deleting user:', error);
    throw new Error(error.message);
  }
}
