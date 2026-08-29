import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from '@/lib/auth.config';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createAuthService } from '@/services';

function getPepper(): string {
  const pepper = process.env.BCRYPT_SECRET_KEY;
  if (!pepper) {
    throw new Error('BCRYPT_SECRET_KEY environment variable is required');
  }
  return pepper;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  trustHost: true,
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60, // 8 hours
  },
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        username: { label: 'Nazwa użytkownika', type: 'text' },
        password: { label: 'Hasło', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        const username = credentials.username as string;
        const password = credentials.password as string;

        try {
          const authService = createAuthService();
          const authResult = await authService.authenticateCredentials(
            username,
            password,
            getPepper()
          );
          if (authResult.isFailure()) {
            console.error('Auth error:', authResult.error);
            return null;
          }

          if (!authResult.data) return null;

          return {
            id: authResult.data.user.id,
            name: authResult.data.user.username,
            email: authResult.data.user.username,
            role: authResult.data.role,
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      },
    }),
  ],
});

export interface SessionUser {
  id: string;
  username: string;
  role?: string;
}

export async function getServerSession(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user) return null;

  return {
    id: session.user.id ?? '',
    username: session.user.name ?? '',
    role: (session.user as any).role ?? '',
  };
}

export async function requireAuth(
  _request?: NextRequest | Request
): Promise<SessionUser | NextResponse> {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: 'Brak autoryzacji' }, { status: 401 });
  }
  return session;
}

export async function requireRole(
  _request?: NextRequest | Request,
  ...roles: string[]
): Promise<SessionUser | NextResponse> {
  const sessionOrResponse = await requireAuth(_request);
  if (sessionOrResponse instanceof NextResponse) return sessionOrResponse;

  const normalizeRole = (role: string) => {
    const normalized = role.trim().toLowerCase();
    return normalized === 'administrator' ? 'admin' : normalized;
  };
  const userRole = normalizeRole(sessionOrResponse.role ?? '');
  const allowed = roles.map(normalizeRole);
  if (allowed.length > 0 && !allowed.includes(userRole)) {
    return NextResponse.json({ error: 'Brak uprawnień' }, { status: 403 });
  }
  return sessionOrResponse;
}

export function isAuthError(result: SessionUser | NextResponse): result is NextResponse {
  return result instanceof NextResponse;
}

export async function getSessionFromRequest(
  _request?: NextRequest | Request
): Promise<SessionUser | null> {
  return getServerSession();
}
