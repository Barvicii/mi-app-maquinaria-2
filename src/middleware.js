// src/middleware.js
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// List of public paths that don't require authentication
const publicPaths = [
  '/login',
  '/register',
  '/api/auth',
  '/api/register',
  '/service', // Make service routes public for QR functionality
  '/favicon.ico',
  '/_next',
  '/Imagen',
];

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // Check if the path is public
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  try {
    // Check for session token
    const token = await getToken({ 
      req: request,
      secret: process.env.NEXTAUTH_SECRET 
    });

    // If no token and not a public route, redirect to login
    if (!token) {
      const url = new URL('/login', request.url);
      // Add the original URL as callbackUrl so user can be redirected after login
      url.searchParams.set('callbackUrl', encodeURI(request.url));
      return NextResponse.redirect(url);
    }

    // Allow the request through if authenticated
    return NextResponse.next();
  } catch (error) {
    console.error('Middleware error:', error);
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

// Configure which routes the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api/auth (authentication routes)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|Imagen|api/auth).*)',
  ],
};