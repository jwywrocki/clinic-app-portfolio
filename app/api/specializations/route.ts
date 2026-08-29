import { NextResponse } from 'next/server';
import { requireAuth, isAuthError, getSessionFromRequest } from '@/lib/auth';
import { type NextRequest } from 'next/server';
import { createSpecializationService } from '@/services';
import { ConflictError, ValidationError } from '@/domain';

const specializationService = createSpecializationService();

export async function GET(request: Request) {
  try {
    const session = await getSessionFromRequest(request);
    const onlyPublishedLike = !session;

    const list = await specializationService.getAll();
    if (list.isFailure()) {
      throw list.error;
    }

    return NextResponse.json(onlyPublishedLike ? list.data : { data: list.data });
  } catch (e) {
    console.error('GET /api/specializations error', e);
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (isAuthError(auth)) return auth;

  try {
    const body = await request.json();
    const name = typeof body?.name === 'string' ? body.name : '';
    const description = typeof body?.description === 'string' ? body.description : null;

    const created = await specializationService.create({ name, description });
    if (created.isFailure()) {
      if (created.error instanceof ValidationError) {
        return NextResponse.json({ error: created.error.message }, { status: 400 });
      }
      if (created.error instanceof ConflictError) {
        return NextResponse.json({ error: created.error.message }, { status: 409 });
      }
      throw created.error;
    }

    return NextResponse.json(created.data, { status: 201 });
  } catch (e) {
    console.error('POST /api/specializations error', e);
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}
