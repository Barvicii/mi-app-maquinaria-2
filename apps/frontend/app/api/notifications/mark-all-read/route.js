import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { connectDB } from "@/lib/mongodb";
import { authOptions } from '@/api/auth/[...nextauth]/route';

// PUT: Marcar todas las notificaciones como leídas
export async function PUT(request) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }
    
    const db = await connectDB();
    
    // Actualizar todas las notificaciones no leídas del usuario
    const result = await db.collection('notifications').updateMany(
      { 
        userId: session.user.id, 
        organizationId: session.user.credentialId,
        read: false 
      },
      { 
        $set: { 
          read: true, 
          updatedAt: new Date() 
        } 
      }
    );
    
    return NextResponse.json({
      success: true,
      count: result.modifiedCount,
      message: 'Todas las notificaciones han sido marcadas como leídas'
    });
    
  } catch (error) {
    console.error('Error marcando todas las notificaciones como leídas:', error);
    return NextResponse.json(
      { error: 'Error al actualizar notificaciones' },
      { status: 500 }
    );
  }
}


