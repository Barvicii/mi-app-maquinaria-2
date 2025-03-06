// src/middleware.js
import { NextResponse } from 'next/server';

export function middleware(request) {
  try {
    return NextResponse.next();
  } catch (error) {
    console.error('Middleware error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export const config = {
  matcher: '/api/:path*',
};