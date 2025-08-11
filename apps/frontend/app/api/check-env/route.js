import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Verificar variables de entorno críticas
    const config = {
      SENDGRID_API_KEY: process.env.SENDGRID_API_KEY ? 'CONFIGURADA' : 'NO CONFIGURADA',
      SENDGRID_FROM_EMAIL: process.env.SENDGRID_FROM_EMAIL || 'NO CONFIGURADA',
      SENDGRID_FROM_NAME: process.env.SENDGRID_FROM_NAME || 'NO CONFIGURADA',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'NO CONFIGURADA',
      MONGODB_URI: process.env.MONGODB_URI ? 'CONFIGURADA' : 'NO CONFIGURADA',
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV
    };
    
    console.log('🔍 Verificando configuración de variables de entorno:', config);
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
      config: config,
      message: 'Variables de entorno verificadas'
    });
    
  } catch (error) {
    console.error('❌ Error verificando configuración:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

