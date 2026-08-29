import { type NextRequest, NextResponse } from 'next/server';
import { createContactService } from '@/services';
import { UpdateContactGroupSchema, formatZodError } from '@/lib/schemas';
import { requireAuth, isAuthError } from '@/lib/auth';
import { NotFoundError } from '@/domain';

const contactService = createContactService();

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const groupWithDetails = await contactService.getGroupWithDetails(id);
    if (groupWithDetails.isFailure()) {
      if (groupWithDetails.error instanceof NotFoundError) {
        return NextResponse.json({ error: 'Nie znaleziono' }, { status: 404 });
      }
      throw groupWithDetails.error;
    }
    return NextResponse.json(groupWithDetails.data);
  } catch (e) {
    console.error('GET /api/contact_groups/:id error', e);
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(request);
  if (isAuthError(auth)) return auth;

  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = UpdateContactGroupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error.issues) }, { status: 400 });
    }
    const groupWithDetails = await contactService.updateGroup(id, parsed.data);
    if (groupWithDetails.isFailure()) {
      if (groupWithDetails.error instanceof NotFoundError) {
        return NextResponse.json({ error: 'Nie znaleziono' }, { status: 404 });
      }
      throw groupWithDetails.error;
    }
    return NextResponse.json(groupWithDetails.data);
  } catch (e) {
    console.error('PATCH /api/contact_groups/:id error', e);
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(request);
  if (isAuthError(auth)) return auth;

  try {
    const { id } = await params;
    try {
      const deleted = await contactService.deleteGroup(id);
      if (deleted.isFailure()) {
        if (deleted.error instanceof NotFoundError) {
          return NextResponse.json({ error: 'Nie znaleziono' }, { status: 404 });
        }
        throw deleted.error;
      }
    } catch (error: any) {
      if (error?.code === '23503') {
        return NextResponse.json(
          { error: 'Nie można usunąć grupy - jest powiązana z innymi rekordami.' },
          { status: 409 }
        );
      }
      throw error;
    }
    return NextResponse.json({ message: 'Contact group deleted successfully' });
  } catch (e) {
    console.error('DELETE /api/contact_groups/:id error', e);
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}
