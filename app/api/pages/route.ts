import { type NextRequest, NextResponse } from 'next/server';
import { createPagesService } from '@/services';
import { CreatePageSchema, UpdatePageSchema, formatZodError } from '@/lib/schemas';
import { requireAuth, isAuthError } from '@/lib/auth';
import { NotFoundError } from '@/domain';

const pagesService = createPagesService();

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const parts = url.pathname.split('/');
    const maybeId = parts[parts.length - 1];

    if (maybeId && maybeId !== 'pages') {
      const data = await pagesService.getById(maybeId);
      if (data.isFailure()) {
        if (data.error instanceof NotFoundError) {
          return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }
        throw data.error;
      }
      return NextResponse.json(data.data);
    }
    const list = await pagesService.getAll();
    if (list.isFailure()) {
      throw list.error;
    }
    return NextResponse.json(list.data);
  } catch (e: unknown) {
    console.error('GET /api/pages error', e);
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (isAuthError(auth)) return auth;

  try {
    const body = await request.json();
    const parsed = CreatePageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error.issues) }, { status: 400 });
    }
    const created = await pagesService.create(parsed.data);
    if (created.isFailure()) {
      throw created.error;
    }
    return NextResponse.json(created.data, { status: 201 });
  } catch (e: unknown) {
    console.error('POST /api/pages error', e);
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAuth(request);
  if (isAuthError(auth)) return auth;

  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();
    if (!id || id === 'pages') {
      return NextResponse.json({ error: 'Brak ID' }, { status: 400 });
    }
    const body = await request.json();
    const parsed = UpdatePageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error.issues) }, { status: 400 });
    }
    const updated = await pagesService.update(id, parsed.data);
    if (updated.isFailure()) {
      if (updated.error instanceof NotFoundError) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
      throw updated.error;
    }
    return NextResponse.json(updated.data);
  } catch (e: unknown) {
    console.error('PATCH /api/pages/:id error', e);
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAuth(request);
  if (isAuthError(auth)) return auth;

  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();
    if (!id || id === 'pages') {
      return NextResponse.json({ error: 'Brak ID' }, { status: 400 });
    }
    const deleted = await pagesService.delete(id);
    if (deleted.isFailure()) {
      if (deleted.error instanceof NotFoundError) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
      throw deleted.error;
    }
    return NextResponse.json({ message: 'Page deleted successfully' });
  } catch (e: unknown) {
    console.error('DELETE /api/pages/:id error', e);
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}
