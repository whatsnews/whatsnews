// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define route patterns
const publicRoutes = [
  '/login',
  '/signup',
  '/public',
  '/api/news/public',
  '/api/news/public/latest',
  '/api/prompts/public'
];

const protectedRoutes = [
  '/prompts',
  '/news',
  '/settings'
];

// Helper to check if it's a public API route
const isPublicApiRoute = (pathname: string) => {
  return pathname.startsWith('/api/') && 
    (pathname.includes('/public/') || pathname.includes('/by-path/'));
};

// Helper to check if it's a username/prompt route
const isUsernamePromptRoute = (pathname: string) => {
  const parts = pathname.split('/').filter(Boolean);
  return parts.length === 2 && !protectedRoutes.some(route => pathname.startsWith(route));
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('token')?.value;

  // Allow all API routes with /public/ in them
  if (isPublicApiRoute(pathname)) {
    return NextResponse.next();
  }

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

  // Handle public routes (login/signup/public pages)
  if (publicRoutes.includes(pathname)) {
    if (token && (pathname === '/login' || pathname === '/signup')) {
      return NextResponse.redirect(new URL('/news', request.url));
    }
    return NextResponse.next();
  }

  // For unmatched routes in protected areas, require authentication
  if (!token && !publicRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * 1. /api/ (API routes)
     * 2. /_next/ (Next.js internals)
     * 3. /.next/static (static files)
     * 4. /favicon.ico, /sitemap.xml (static files)
     */
    '/((?!api/|_next/|_static/|_vercel|[\\w-]+\\.\\w+).*)',
    '/',
    '/login',
    '/signup',
    '/news',
    '/prompts/:path*',
    '/settings/:path*',
    '/:username/:prompt-slug'
  ],
};