import { connectDB } from "@/lib/mongodb";
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { generateResetToken, sendPasswordResetEmail } from "@/lib/emailUtils";

// Validación de email
const schema = z.object({
  email: z.string().email('Email inválido')
});

export async function POST(request) {
  try {
    const data = await request.json();
    
    // Validar email
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
    
    // No revelar si el email existe por seguridad
    if (!user) {
      return NextResponse.json({ 
        success: true, 
        message: "Si existe una cuenta con este email, recibirás instrucciones para recuperar tu contraseña." 
      });
    }
    
    // Generar token y establecer fecha de expiración (1 hora)
    const resetToken = generateResetToken();
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hora
    
    // Guardar token en la base de datos
    await db.collection('users').updateOne(
      { _id: user._id },
      { $set: { 
        resetToken,
        resetTokenExpiry,
        resetRequested: new Date()
      }}
    );
    
    // Enviar email de reset usando el template
    const emailResult = await sendPasswordResetEmail(email, resetToken);
    
    if (!emailResult.success) {
      console.error('Error enviando email:', emailResult.error);
      // No revelar el error específico por seguridad
    }
    
    // Log para auditoría
    await db.collection('activityLogs').insertOne({
      action: 'password_reset_requested',
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
      message: "Si existe una cuenta con este email, recibirás instrucciones para recuperar tu contraseña." 
    });
    
  } catch (error) {
    console.error('Error en recuperación de contraseña:', error);
    return NextResponse.json(
      { error: 'Error procesando la solicitud' },
      { status: 500 }
    );
  }
}


