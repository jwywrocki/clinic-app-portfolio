'use server';

import { createDoctorAdminService } from '@/services';
import { Doctor } from '@/lib/types/doctors';
import { revalidatePath } from 'next/cache';
import { isAuthError, requireAuth } from '@/lib/auth';

async function requireAdminSession() {
  const session = await requireAuth();
  if (isAuthError(session)) {
    throw new Error('Brak autoryzacji');
  }
  return session;
}

export async function saveDoctorAction(data: Partial<Doctor>) {
  try {
    await requireAdminSession();
    const doctorAdminService = createDoctorAdminService();
    const saved = await doctorAdminService.saveDoctor(data);
    if (saved.isFailure()) {
      return { success: false, error: saved.error.message };
    }

    revalidatePath('/admin/doctors');
    revalidatePath('/admin/specializations');
    revalidatePath('/lekarze');
    return { success: true };
  } catch (error: any) {
    console.error('Error saving doctor:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteDoctorAction(id: string): Promise<void> {
  try {
    await requireAdminSession();
    const doctorAdminService = createDoctorAdminService();
    const deleted = await doctorAdminService.deleteDoctor(id);
    if (deleted.isFailure()) {
      throw deleted.error;
    }
    revalidatePath('/admin/doctors');
    revalidatePath('/lekarze');
  } catch (error: any) {
    console.error('Error deleting doctor:', error);
    throw new Error(error.message);
  }
}
