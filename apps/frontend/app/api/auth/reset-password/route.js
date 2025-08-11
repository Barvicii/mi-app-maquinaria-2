import { NextResponse } from 'next/server';
import { connectDB } from "@/lib/mongodb";
import bcrypt from 'bcryptjs';
import { z } from 'zod';

// Validación de datos
const schema = z.object({
  token: z.string().min(1, 'Token es requerido'),
  email: z.string().email('Email inválido').optional(),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una letra mayúscula')
    .regex(/[a-z]/, 'Debe contener al menos una letra minúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número')
    .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'Debe contener al menos un carácter especial')
});

export async function POST(request) {
  try {
    const data = await request.json();
    
    // Validar datos
    const result = schema.safeParse(data);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }
    
    const { token, email, password } = result.data;
    const db = await connectDB();
    
    // Buscar usuario con el token válido y no expirado
    const user = await db.collection('users').findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: new Date() }
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'Token inválido o expirado' },
        { status: 400 }
      );
    }
    
    // Validar que el email coincida si se proporciona
    if (email && user.email !== email) {
      return NextResponse.json(
        { error: 'El email no coincide con el del token' },
        { status: 400 }
      );
    }
    
    // Hash de la nueva contraseña
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Actualizar usuario
    await db.collection('users').updateOne(
      { _id: user._id },
      { 
        $set: { 
          password: hashedPassword,
          passwordChangeRequired: false,
          temporaryPassword: false,
          updatedAt: new Date()
        },
        $unset: {
          resetToken: "",
          resetTokenExpiry: "",
          temporaryPasswordCreated: ""
        }
      }
    );
    
    // Log para auditoría
    await db.collection('activityLogs').insertOne({
      action: 'password_reset_completed',
      userId: user._id,
      timestamp: new Date(),
      metadata: {
        email: user.email,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
      }
    });
    
    return NextResponse.json({ 
      success: true, 
      message: "Contraseña restablecida exitosamente" 
    });
    
  } catch (error) {
    console.error('Error restableciendo contraseña:', error);
    return NextResponse.json(
      { error: 'Error procesando la solicitud' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { 
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}


