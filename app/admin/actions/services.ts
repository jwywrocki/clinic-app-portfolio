'use server';

import { createClinicServicesService } from '@/services';
import type { CreateServiceInput, UpdateServiceInput } from '@/lib/schemas';
import { Service } from '@/lib/types/services';
import { revalidatePath } from 'next/cache';
import { isAuthError, requireAuth } from '@/lib/auth';

async function requireAdminSession() {
  const session = await requireAuth();
  if (isAuthError(session)) {
    throw new Error('Brak autoryzacji');
  }
  return session;
}

export async function saveServiceAction(data: Partial<Service>) {
  const clinicServicesService = createClinicServicesService();

  const payload: CreateServiceInput = {
    title: data.title || '',
    description: data.description || '',
    icon: data.icon || '',
    is_published: data.is_published ?? true,
    order_position: data.order_position ?? 0,
  };

  try {
    await requireAdminSession();
    if (data.id && data.order_position !== undefined) {
      const allServicesResult = await clinicServicesService.getAll();
      if (allServicesResult.isFailure()) {
        return { success: false, error: allServicesResult.error.message };
      }
      const allServices = allServicesResult.data;
      const current = allServices.find((s: Service) => s.id === data.id);
      const oldPos = current?.order_position ?? 0;
      const newPos = data.order_position;

      if (oldPos !== newPos && oldPos > 0 && newPos > 0) {
        for (const svc of allServices) {
          if (svc.id === data.id) continue;
          const pos = svc.order_position || 0;

          if (oldPos > newPos) {
            if (pos >= newPos && pos < oldPos) {
              const moved = await clinicServicesService.update(svc.id, {
                order_position: pos + 1,
              });
              if (moved.isFailure()) {
                return { success: false, error: moved.error.message };
              }
            }
          } else {
            if (pos > oldPos && pos <= newPos) {
              const moved = await clinicServicesService.update(svc.id, {
                order_position: pos - 1,
              });
              if (moved.isFailure()) {
                return { success: false, error: moved.error.message };
              }
            }
          }
        }
      }
    }

    if (data.id) {
      const updatePayload: UpdateServiceInput = payload;
      const updated = await clinicServicesService.update(data.id, updatePayload);
      if (updated.isFailure()) {
        return { success: false, error: updated.error.message };
      }
    } else {
      const created = await clinicServicesService.create(payload);
      if (created.isFailure()) {
        return { success: false, error: created.error.message };
      }
    }

    revalidatePath('/admin/services');
    revalidatePath('/uslugi');
    return { success: true };
  } catch (error: any) {
    console.error('Error saving service:', error);
    return { success: false, error: error.message };
  }
}

export async function reorderServiceAction(
  serviceId: string,
  targetId: string,
  serviceNewPos: number,
  targetNewPos: number
): Promise<{ success: boolean; error?: string }> {
  const clinicServicesService = createClinicServicesService();
  try {
    const firstUpdate = await clinicServicesService.update(serviceId, {
      order_position: serviceNewPos,
    });
    if (firstUpdate.isFailure()) {
      return { success: false, error: firstUpdate.error.message };
    }

    const secondUpdate = await clinicServicesService.update(targetId, {
      order_position: targetNewPos,
    });
    if (secondUpdate.isFailure()) {
      return { success: false, error: secondUpdate.error.message };
    }

    revalidatePath('/admin/services');
    revalidatePath('/uslugi');
    return { success: true };
  } catch (error: any) {
    console.error('Error reordering services:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteServiceAction(id: string): Promise<void> {
  const clinicServicesService = createClinicServicesService();
  try {
    await requireAdminSession();
    const deleted = await clinicServicesService.delete(id);
    if (deleted.isFailure()) {
      throw deleted.error;
    }
    revalidatePath('/admin/services');
    revalidatePath('/uslugi');
  } catch (error: any) {
    console.error('Error deleting service:', error);
    throw new Error(error.message);
  }
}
