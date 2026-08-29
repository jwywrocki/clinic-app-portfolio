import { type NextRequest, NextResponse } from 'next/server';
import { createContactService } from '@/services';
import { UpdateContactDetailSchema, formatZodError } from '@/lib/schemas';
import { requireAuth, isAuthError } from '@/lib/auth';
import { NotFoundError } from '@/domain';

const contactService = createContactService();

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await contactService.getDetailById(id);
    if (data.isFailure()) {
      if (data.error instanceof NotFoundError) {
        return NextResponse.json({ error: 'Nie znaleziono' }, { status: 404 });
      }
      throw data.error;
    }
    return NextResponse.json(data.data);
  } catch (e) {
    console.error('GET /api/contact_details/:id error', e);
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(request);
  if (isAuthError(auth)) return auth;

  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = UpdateContactDetailSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error.issues) }, { status: 400 });
    }
    const updateData = { ...parsed.data };
    const data = await contactService.updateDetail(id, updateData);
    if (data.isFailure()) {
      if (data.error instanceof NotFoundError) {
        return NextResponse.json({ error: 'Nie znaleziono' }, { status: 404 });
      }
      throw data.error;
    }
    return NextResponse.json(data.data);
  } catch (e) {
    console.error('PATCH /api/contact_details/:id error', e);
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
    const deleted = await contactService.deleteDetail(id);
    if (deleted.isFailure()) {
      if (deleted.error instanceof NotFoundError) {
        return NextResponse.json({ error: 'Nie znaleziono' }, { status: 404 });
      }
      throw deleted.error;
    }
    return NextResponse.json({ message: 'Contact detail deleted successfully' });
  } catch (e) {
    console.error('DELETE /api/contact_details/:id error', e);
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}
