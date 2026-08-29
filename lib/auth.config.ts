import type { NextAuthConfig } from 'next-auth';

/**
 * Auth.js v5 edge-compatible configuration.
 * This subset is used by the middleware (runs in Edge Runtime).
 * The full config with the Credentials provider lives in lib/auth.ts.
 */
export const authConfig = {
  pages: {
    signIn: '/admin/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAdminRoute =
        nextUrl.pathname.startsWith('/admin') && !nextUrl.pathname.startsWith('/admin/login');
      const isAdminApi = nextUrl.pathname.startsWith('/api/admin');

      if (isAdminRoute || isAdminApi) {
        return isLoggedIn;
      }

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role ?? '';
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role as string;
      }
      return session;
    },
  },
  providers: [], // Providers added in lib/auth.ts (not edge-compatible)
} satisfies NextAuthConfig;
