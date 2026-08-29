import { NextResponse, type NextRequest } from 'next/server';
import { createNewsService } from '@/services';
import { NotFoundError } from '@/domain';
import { requireAuth, isAuthError } from '@/lib/auth';

const newsService = createNewsService();

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const data = await newsService.getById(id);
    if (data.isFailure()) {
      if (data.error instanceof NotFoundError) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
      throw data.error;
    }
    return NextResponse.json(data.data);
  } catch (e: any) {
    console.error('GET /api/news/:id error', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth(request);
  if (isAuthError(auth)) return auth;

  try {
    const { id } = params;
    const body = await request.json();
    const data = await newsService.update(id, body);
    if (data.isFailure()) {
      if (data.error instanceof NotFoundError) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
      throw data.error;
    }
    return NextResponse.json(data.data);
  } catch (e: any) {
    console.error('PATCH /api/news/:id error', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth(request);
  if (isAuthError(auth)) return auth;

  try {
    const { id } = params;
    const deleted = await newsService.delete(id);
    if (deleted.isFailure()) {
      if (deleted.error instanceof NotFoundError) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
      throw deleted.error;
    }
    return NextResponse.json({ message: 'News item deleted successfully' });
  } catch (e: any) {
    console.error('DELETE /api/news/:id error', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
