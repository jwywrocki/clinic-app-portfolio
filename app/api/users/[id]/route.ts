import { type NextRequest, NextResponse } from 'next/server';
import { createUserService } from '@/services';
import { UpdateUserSchema, formatZodError } from '@/lib/schemas';
import { requireRole, isAuthError } from '@/lib/auth';
import { ConflictError, NotFoundError, ValidationError } from '@/domain';

const userService = createUserService();

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole(request, 'admin');
  if (isAuthError(auth)) return auth;

  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = UpdateUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error.issues) }, { status: 400 });
    }
    const userWithRole = await userService.updateUser(id, parsed.data);
    if (userWithRole.isFailure()) {
      if (userWithRole.error instanceof ValidationError) {
        return NextResponse.json({ error: userWithRole.error.message }, { status: 400 });
      }
      if (userWithRole.error instanceof ConflictError) {
        return NextResponse.json({ error: userWithRole.error.message }, { status: 409 });
      }
      if (userWithRole.error instanceof NotFoundError) {
        return NextResponse.json({ error: userWithRole.error.message }, { status: 404 });
      }
      throw userWithRole.error;
    }
    return NextResponse.json(userWithRole.data);
  } catch (e: any) {
    console.error('PATCH /api/users/:id error', e);
    return NextResponse.json({ error: e?.message || 'Błąd serwera' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(request, 'admin');
  if (isAuthError(auth)) return auth;

  try {
    const { id } = await params;
    const deleted = await userService.deleteUser(id);
    if (deleted.isFailure()) {
      if (deleted.error instanceof NotFoundError) {
        return NextResponse.json({ error: deleted.error.message }, { status: 404 });
      }
      throw deleted.error;
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('DELETE /api/users/:id error', e);
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}
