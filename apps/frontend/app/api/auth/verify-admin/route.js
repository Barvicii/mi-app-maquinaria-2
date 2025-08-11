import { NextResponse } from 'next/server';
import { connectDB } from "@/lib/mongodb";
import bcrypt from 'bcryptjs';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../[...nextauth]/route';

export async function POST(request) {
  try {
    const data = await request.json();
    const { email, password } = data;
    
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      );
    }
    
    const db = await connectDB();
    const user = await db.collection('users').findOne({ email });
    
    if (!user) {
      return NextResponse.json(
        { error: 'Credenciales incorrectas' },
        { status: 401 }
      );
    }
    
    // Verificar si el usuario es Super Admin
    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'No tiene permisos de administrador' },
        { status: 403 }
      );
    }
    
    // Verificar contraseña
    const passwordMatch = await bcrypt.compare(password, user.password);
    
    if (!passwordMatch) {
      return NextResponse.json(
        { error: 'Credenciales incorrectas' },
        { status: 401 }
      );
    }
    
    // Verificar si tiene configurado 2FA
    const requireTOTP = !!user.totpSecret;
    
    // Registrar intento de acceso exitoso en logs
    await db.collection('adminAccessLogs').insertOne({
      userId: user._id,
      email: user.email,
      action: 'admin_login_attempt',
      success: true,
      requireTOTP,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      timestamp: new Date()
    });
    
    return NextResponse.json({
      success: true,
      requireTOTP,
      userId: user._id.toString()
    });
    
  } catch (error) {
    console.error('Error en verificación de admin:', error);
    
    // Registrar error en logs
    try {
      const db = await connectDB();
      await db.collection('errorLogs').insertOne({
        endpoint: '/api/auth/verify-admin',
        error: error.message,
        stack: error.stack,
        timestamp: new Date()
      });
    } catch (logError) {
      console.error('Error al registrar log:', logError);
    }
    
    return NextResponse.json(
      { error: 'Error en la autenticación' },
      { status: 500 }
    );
  }
}


