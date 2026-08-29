import { type NextRequest, NextResponse } from 'next/server';
import { createMenusService } from '@/services';
import { CreateMenuItemSchema, UpdateMenuItemSchema, formatZodError } from '@/lib/schemas';
import { requireAuth, isAuthError } from '@/lib/auth';
import { NotFoundError } from '@/domain';

const menusService = createMenusService();

export async function GET() {
  try {
    const listResult = await menusService.getPublished();
    if (listResult.isFailure()) {
      throw listResult.error;
    }
    return NextResponse.json(listResult.data);
  } catch (e) {
    console.error('GET /api/menu_items error', e);
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (isAuthError(auth)) return auth;

  try {
    const body = await request.json();
    const parsed = CreateMenuItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error.issues) }, { status: 400 });
    }
    const created = await menusService.create(parsed.data);
    if (created.isFailure()) {
      throw created.error;
    }
    return NextResponse.json(created.data, { status: 201 });
  } catch (e) {
    console.error('POST /api/menu_items error', e);
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAuth(request);
  if (isAuthError(auth)) return auth;

  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();
    if (!id || id === 'menu_items') {
      return NextResponse.json({ error: 'Brak ID' }, { status: 400 });
    }
    const body = await request.json();
    const parsed = UpdateMenuItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error.issues) }, { status: 400 });
    }
    const updated = await menusService.update(id, parsed.data);
    if (updated.isFailure()) {
      if (updated.error instanceof NotFoundError) {
        return NextResponse.json({ error: 'Nie znaleziono' }, { status: 404 });
      }
      throw updated.error;
    }
    return NextResponse.json(updated.data);
  } catch (e) {
    console.error('PATCH /api/menu_items error', e);
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAuth(request);
  if (isAuthError(auth)) return auth;

  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();
    if (!id || id === 'menu_items') {
      return NextResponse.json({ error: 'Brak ID' }, { status: 400 });
    }
    const deleted = await menusService.delete(id);
    if (deleted.isFailure()) {
      if (deleted.error instanceof NotFoundError) {
        return NextResponse.json({ error: 'Nie znaleziono' }, { status: 404 });
      }
      throw deleted.error;
    }
    return NextResponse.json({ message: 'Menu item deleted successfully' });
  } catch (e) {
    console.error('DELETE /api/menu_items error', e);
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}
