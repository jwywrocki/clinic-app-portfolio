import { type NextRequest, NextResponse } from 'next/server';
import { createClinicServicesService } from '@/services';
import { CreateServiceSchema, UpdateServiceSchema, formatZodError } from '@/lib/schemas';
import { requireAuth, isAuthError } from '@/lib/auth';
import { NotFoundError } from '@/domain';

const clinicServicesService = createClinicServicesService();

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const parts = url.pathname.split('/');
    const maybeId = parts[parts.length - 1];

    if (maybeId && maybeId !== 'services') {
      const data = await clinicServicesService.getById(maybeId);
      if (data.isFailure()) {
        if (data.error instanceof NotFoundError) {
          return NextResponse.json({ error: 'Not found' }, { status: 404 });
        }
        throw data.error;
      }
      return NextResponse.json(data.data);
    }
    const list = await clinicServicesService.getPublished();
    if (list.isFailure()) {
      throw list.error;
    }
    return NextResponse.json(list.data);
  } catch (e: unknown) {
    console.error('GET /api/services error', e);
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (isAuthError(auth)) return auth;

  try {
    const body = await request.json();
    const parsed = CreateServiceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error.issues) }, { status: 400 });
    }
    const created = await clinicServicesService.create(parsed.data);
    if (created.isFailure()) {
      throw created.error;
    }
    return NextResponse.json(created.data, { status: 201 });
  } catch (e: unknown) {
    console.error('POST /api/services error', e);
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAuth(request);
  if (isAuthError(auth)) return auth;

  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();
    if (!id || id === 'services') {
      return NextResponse.json({ error: 'Brak ID' }, { status: 400 });
    }
    const body = await request.json();
    const parsed = UpdateServiceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error.issues) }, { status: 400 });
    }
    const updated = await clinicServicesService.update(id, parsed.data);
    if (updated.isFailure()) {
      if (updated.error instanceof NotFoundError) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
      throw updated.error;
    }
    return NextResponse.json(updated.data);
  } catch (e: unknown) {
    console.error('PATCH /api/services/:id error', e);
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAuth(request);
  if (isAuthError(auth)) return auth;

  try {
    const url = new URL(request.url);
    const id = url.pathname.split('/').pop();
    if (!id || id === 'services') {
      return NextResponse.json({ error: 'Brak ID' }, { status: 400 });
    }
    const deleted = await clinicServicesService.delete(id);
    if (deleted.isFailure()) {
      if (deleted.error instanceof NotFoundError) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
      throw deleted.error;
    }
    return NextResponse.json({ message: 'Service deleted successfully' });
  } catch (e: unknown) {
    console.error('DELETE /api/services/:id error', e);
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}
