import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// List of public routes
const publicRoutes = [
  '/login',
  '/register',
  '/api/auth',
  '/api/register',
  '/service', // Make service routes public for QR functionality
  '/favicon.ico',
  '/_next',
  '/Imagen',
];

// Check if a route should be public
const isPublicRoute = (pathname) => {
  return publicRoutes.some(route => pathname.startsWith(route));
};

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for public routes
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }
  
  // Check for valid session
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  });
  
  // If no token and not a public route, redirect to login
  if (!token) {
    const url = new URL('/login', request.url);
    url.searchParams.set('callbackUrl', encodeURI(request.url));
    return NextResponse.redirect(url);
  }
  
  // If the user is trying to access admin routes
  if (pathname.startsWith('/admin') && token.role !== 'admin') {
    // Redirect to unauthorized page or homepage
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  // If the user is trying to access technician routes
  if (pathname.startsWith('/technician') && 
     (token.role !== 'admin' && token.role !== 'technician')) {
    return NextResponse.redirect(new URL('/', request.url));
  }
  
  // Continue with the request if authenticated
  return NextResponse.next();
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
     */
    '/((?!_next/static|_next/image|favicon.ico|public|Imagen).*)',
  ],
};