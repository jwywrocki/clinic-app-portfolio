import { type NextRequest, NextResponse } from 'next/server';
import { createContactService } from '@/services';
import { requireAuth, isAuthError } from '@/lib/auth';

const contactService = createContactService();

export async function PATCH(request: NextRequest) {
  const auth = await requireAuth(request);
  if (isAuthError(auth)) return auth;

  try {
    const { groups } = await request.json();
    if (!Array.isArray(groups)) {
      return NextResponse.json({ error: 'Tablica groups jest wymagana' }, { status: 400 });
    }
    const reordered = await contactService.reorderGroups(groups);
    if (reordered.isFailure()) {
      throw reordered.error;
    }
    const updatedGroups = await contactService.getAllGroupsWithDetails();
    if (updatedGroups.isFailure()) {
      throw updatedGroups.error;
    }
    return NextResponse.json(updatedGroups.data);
  } catch (e) {
    console.error('PATCH /api/contact_groups/reorder error', e);
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}
