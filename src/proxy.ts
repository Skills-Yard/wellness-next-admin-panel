import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { isTokenExpired } from './lib/token';

// NOTE: this project targets a Next.js version where the `middleware.ts` convention has been
// renamed to `proxy.ts` (the `middleware` export is now `proxy`) — see
// node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md.

const TOKEN_COOKIE = 'wellness_admin_token';
const PUBLIC_PATHS = ['/login'];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

// Runs on every navigation before the page renders, so an expired/missing session bounces to
// /login immediately instead of flashing the authenticated shell (or an empty dashboard) while
// the client-side AuthContext is still figuring that out from localStorage. This is only an
// optimistic check — we decode the JWT's `exp` claim without verifying its signature — every
// real API request is still authorized server-side.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(TOKEN_COOKIE)?.value;
  const authenticated = !!token && !isTokenExpired(token);
  const onPublicPath = isPublicPath(pathname);

  if (!authenticated && !onPublicPath) {
    const loginUrl = new URL('/login', request.url);
    const response = NextResponse.redirect(loginUrl);
    if (token) {
      // Stale/expired token — drop it so the client doesn't keep treating the session as live.
      response.cookies.delete(TOKEN_COOKIE);
    }
    return response;
  }

  if (authenticated && onPublicPath) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip static assets, image optimization, and metadata files — everything else (all app
    // routes) goes through the auth check above.
    '/((?!_next/static|_next/image|favicon.ico|images/|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico)$).*)',
  ],
};
