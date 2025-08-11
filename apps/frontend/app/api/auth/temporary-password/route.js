import { NextResponse } from 'next/server';
import { connectDB } from "@/lib/mongodb";
import bcrypt from 'bcryptjs';
import { generateTemporaryPassword, sendTemporaryPasswordEmail } from "@/lib/emailUtils";
import { z } from 'zod';

// Validación de datos
const schema = z.object({
  email: z.string().email('Email inválido')
});

export async function POST(request) {
  try {
    const data = await request.json();
    
    // Validar datos
    const result = schema.safeParse(data);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      );
    }
    
    const { email } = result.data;
    const db = await connectDB();
    
    // Buscar usuario
    const user = await db.collection('users').findOne({ email });
    
    if (!user) {
      // No revelar si el usuario existe por seguridad
      return NextResponse.json({ 
        success: true, 
        message: "Si existe una cuenta con este email, recibirás una contraseña temporal." 
      });
    }
    
    // Generar contraseña temporal
    const temporaryPassword = generateTemporaryPassword();
    const hashedPassword = await bcrypt.hash(temporaryPassword, 12);
    
    // Actualizar usuario con la contraseña temporal
    await db.collection('users').updateOne(
      { _id: user._id },
      { 
        $set: { 
          password: hashedPassword,
          temporaryPassword: true,
          passwordChangeRequired: true,
          temporaryPasswordCreated: new Date()
        }
      }
    );
    
    // Enviar email con contraseña temporal
    const emailResult = await sendTemporaryPasswordEmail(email, temporaryPassword);
    
    if (!emailResult.success) {
      console.error('Error enviando email:', emailResult.error);
      // No revelar el error específico por seguridad
    }
    
    // Log para auditoría
    await db.collection('activityLogs').insertOne({
      action: 'temporary_password_generated',
      userId: user._id,
      timestamp: new Date(),
      metadata: {
        email: user.email,
        emailSent: emailResult.success,
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
      }
    });
    
    return NextResponse.json({ 
      success: true, 
      message: "Si existe una cuenta con este email, recibirás una contraseña temporal.",
      emailSent: emailResult.success
    });
    
  } catch (error) {
    console.error('Error generando contraseña temporal:', error);
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


