// src/middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const publicRoutes = ['/login', '/signup'];

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  // If trying to access a public route while logged in
  if (token && publicRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL('/prompts/technology', request.url));
  }

  // If trying to access protected route without being logged in
  if (!token && !publicRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}