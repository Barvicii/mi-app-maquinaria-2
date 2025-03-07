import { NextResponse } from 'next/server';
import { getToken } from "next-auth/jwt";

// Mejora: Usar expresiones regulares para rutas dinámicas
const publicRoutes = [
  '/login',
  '/register',
  '/api/auth',
  '/api/public', // Ruta base para todas las APIs públicas
  '/service', // Incluye la ruta base de service
  '/favicon.ico',
  '/_next',
  '/Imagen',
];

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // Verificar si la ruta es pública
  // Mejora: verificación más precisa para rutas dinámicas
  const isPublicPath = publicRoutes.some(route => 
    pathname === route || 
    pathname.startsWith(`${route}/`)
  );
  
  // Si es ruta pública, permitir acceso
  if (isPublicPath) {
    return NextResponse.next();
  }
  
  // Verificar si hay token (usuario autenticado)
  const token = await getToken({ 
    req: request, 
    secret: process.env.NEXTAUTH_SECRET 
  });
  
  // Si no hay token, redirigir al login
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|Imagen/.*|styles/.*).*)",
  ],
};