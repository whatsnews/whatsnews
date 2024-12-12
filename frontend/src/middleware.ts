// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define route patterns
const publicRoutes = ['/login', '/signup'];
const protectedRoutes = ['/prompts', '/settings'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('token')?.value;

  // First, handle protected routes (most specific first)
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    // If no token, always redirect to login
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  // Handle root route
  if (pathname === '/') {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.redirect(new URL('/prompts/1', request.url));
  }

  // Handle public routes (login/signup)
  if (publicRoutes.includes(pathname)) {
    if (token) {
      return NextResponse.redirect(new URL('/prompts/1', request.url));
    }
    return NextResponse.next();
  }

  // For any other routes, redirect to login if no token
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths that need middleware processing
     */
    '/',
    '/login',
    '/signup',
    '/prompts/:path*',
    '/settings/:path*',
  ],
};