import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Array de rutas que siempre son públicas
const publicRoutes = [
  '/_next',
  '/api/auth',
  '/login',
  '/register',
  '/',
  '/favicon.ico',
  '/images',
  '/Imagen'
];

// Array de rutas de API que pueden ser públicas si se pasa el parámetro public=true
const conditionalPublicApis = [
  '/api/technicians',
  '/api/prestart',
  '/api/operators',
  '/api/machines',
  '/api/services'
];

export async function middleware(request) {
  const { pathname, searchParams } = new URL(request.url);
  
  // Log all routes being processed
  console.log(`[Middleware] Processing: ${pathname} with query params: ${searchParams}`);
  
  // Verificar si es una solicitud pública
  const isPublicAccess = searchParams.get('public') === 'true';
  
  // RUTAS QUE SIEMPRE SON PÚBLICAS
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }
  
  // IMPORTANTE: Permitir acceso público a /service/, /services/ y /prestart/ y sus sub-rutas
  if (pathname.startsWith('/service/') || 
      pathname.startsWith('/services/') || 
      pathname.startsWith('/prestart/')) {
    console.log(`[Middleware] Allowing public access to service/prestart path: ${pathname}`);
    return NextResponse.next();
  }
  
  // IMPORTANTE: Permitir acceso público a APIs con ?public=true
  if (isPublicAccess && conditionalPublicApis.some(api => pathname.startsWith(api))) {
    console.log(`[Middleware] Allowing public API access: ${pathname}`);
    return NextResponse.next();
  }
  
  // Para todas las demás rutas, verificar autenticación
  const token = await getToken({ req: request });
  
  if (!token) {
    console.log(`[Middleware] Authentication required for: ${pathname}, redirecting to login`);
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  return NextResponse.next();
}

// Rutas a las que aplicar el middleware
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/machines/:path*',
    '/prestart/:path*',
    '/services/:path*',
    '/alerts/:path*',
    '/qr/:path*',
    '/operators/:path*',
    '/admin/:path*', // Make sure admin paths are allowed
  ],
};