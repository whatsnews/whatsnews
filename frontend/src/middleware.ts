// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define route patterns
const publicRoutes = ['/login', '/signup'];
const protectedRoutes = ['/prompts', '/news', '/settings'];

// Helper to check if it's a username/prompt route
const isUsernamePromptRoute = (pathname: string) => {
  const parts = pathname.split('/').filter(Boolean);
  return parts.length === 2;
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('token')?.value;

  // Allow username/prompt routes without auth
  if (isUsernamePromptRoute(pathname)) {
    return NextResponse.next();
  }

  // Handle protected routes (most specific first)
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  // Handle root route
  if (pathname === '/') {
    return NextResponse.next();  // Allow access to landing page
  }

  // Handle public routes (login/signup)
  if (publicRoutes.includes(pathname)) {
    if (token) {
      return NextResponse.redirect(new URL('/news', request.url));
    }
    return NextResponse.next();
  }

  // For dashboard routes, require authentication
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/signup',
    '/news',
    '/prompts/:path*',
    '/settings/:path*',
    '/:username/:prompt-slug',
  ],
};