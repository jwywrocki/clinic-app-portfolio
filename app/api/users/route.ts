import { type NextRequest, NextResponse } from 'next/server';
import { createUserService } from '@/services';
import { CreateUserSchema, formatZodError } from '@/lib/schemas';
import { requireRole, isAuthError } from '@/lib/auth';
import { ConflictError, NotFoundError, ValidationError } from '@/domain';

const userService = createUserService();

export async function GET(request: NextRequest) {
  const auth = await requireRole(request, 'admin');
  if (isAuthError(auth)) return auth;

  try {
    const usersWithRoles = await userService.getAllUsersWithRoles();
    if (usersWithRoles.isFailure()) {
      throw usersWithRoles.error;
    }
    return NextResponse.json(usersWithRoles.data);
  } catch (e) {
    console.error('GET /api/users error', e);
    return NextResponse.json({ error: 'Błąd serwera' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireRole(request, 'admin');
  if (isAuthError(auth)) return auth;

  try {
    const body = await request.json();
    const parsed = CreateUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error.issues) }, { status: 400 });
    }
    const completeUser = await userService.createUser(parsed.data);
    if (completeUser.isFailure()) {
      if (completeUser.error instanceof ValidationError) {
        return NextResponse.json({ error: completeUser.error.message }, { status: 400 });
      }
      if (completeUser.error instanceof ConflictError) {
        return NextResponse.json({ error: completeUser.error.message }, { status: 409 });
      }
      if (completeUser.error instanceof NotFoundError) {
        return NextResponse.json({ error: completeUser.error.message }, { status: 404 });
      }
      throw completeUser.error;
    }
    return NextResponse.json(completeUser.data, { status: 201 });
  } catch (e: any) {
    console.error('POST /api/users error', e);
    return NextResponse.json({ error: e?.message || 'Błąd serwera' }, { status: 500 });
  }
}
