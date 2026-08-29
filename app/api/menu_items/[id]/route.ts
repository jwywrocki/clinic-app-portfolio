import { type NextRequest, NextResponse } from 'next/server';
import { createMenusService } from '@/services';
import { UpdateMenuItemSchema, formatZodError } from '@/lib/schemas';
import { requireAuth, isAuthError } from '@/lib/auth';
import { NotFoundError } from '@/domain';

const menusService = createMenusService();

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await menusService.getById(id);
    if (data.isFailure()) {
      if (data.error instanceof NotFoundError) {
        return NextResponse.json({ error: 'Nie znaleziono' }, { status: 404 });
      }
      throw data.error;
    }
    return NextResponse.json(data.data);
  } catch (e) {
    console.error('GET /api/menu_items/:id error', e);
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(request);
  if (isAuthError(auth)) return auth;

  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = UpdateMenuItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error.issues) }, { status: 400 });
    }
    const data = await menusService.update(id, parsed.data);
    if (data.isFailure()) {
      if (data.error instanceof NotFoundError) {
        return NextResponse.json({ error: 'Nie znaleziono' }, { status: 404 });
      }
      throw data.error;
    }
    return NextResponse.json(data.data);
  } catch (e) {
    console.error('PATCH /api/menu_items/:id error', e);
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
    const deleted = await menusService.delete(id);
    if (deleted.isFailure()) {
      if (deleted.error instanceof NotFoundError) {
        return NextResponse.json({ error: 'Nie znaleziono' }, { status: 404 });
      }
      throw deleted.error;
    }
    return NextResponse.json({ message: 'Menu item deleted successfully' });
  } catch (e) {
    console.error('DELETE /api/menu_items/:id error', e);
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}
