import { type NextRequest, NextResponse } from 'next/server';
import { createPagesService } from '@/services';
import { UpdatePageSchema, formatZodError } from '@/lib/schemas';
import { requireAuth, isAuthError } from '@/lib/auth';
import { NotFoundError } from '@/domain';

const pagesService = createPagesService();

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await pagesService.getById(id);
    if (data.isFailure()) {
      if (data.error instanceof NotFoundError) {
        return NextResponse.json({ error: 'Nie znaleziono' }, { status: 404 });
      }
      throw data.error;
    }
    return NextResponse.json(data.data);
  } catch (e) {
    console.error('GET /api/pages/:id error', e);
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(request);
  if (isAuthError(auth)) return auth;

  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = UpdatePageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error.issues) }, { status: 400 });
    }
    const data = await pagesService.update(id, parsed.data);
    if (data.isFailure()) {
      if (data.error instanceof NotFoundError) {
        return NextResponse.json({ error: 'Nie znaleziono' }, { status: 404 });
      }
      throw data.error;
    }
    return NextResponse.json(data.data);
  } catch (e) {
    console.error('PATCH /api/pages/:id error', e);
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
    const deleted = await pagesService.delete(id);
    if (deleted.isFailure()) {
      if (deleted.error instanceof NotFoundError) {
        return NextResponse.json({ error: 'Nie znaleziono' }, { status: 404 });
      }
      throw deleted.error;
    }
    return NextResponse.json({ message: 'Page deleted successfully' });
  } catch (e) {
    console.error('DELETE /api/pages/:id error', e);
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}
