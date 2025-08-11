import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { connectDB } from "@/lib/mongodb";
import { authOptions } from '@/api/auth/[...nextauth]/route';

// GET: Obtener cantidad de notificaciones no leídas
export async function GET(request) {
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
    
    // Contar notificaciones no leídas
    const count = await db.collection('notifications').countDocuments({
      userId: session.user.id,
      organizationId: session.user.credentialId,
      read: false
    });
    
    return NextResponse.json({ count });
    
  } catch (error) {
    console.error('Error obteniendo conteo de notificaciones:', error);
    return NextResponse.json(
      { error: 'Error al obtener conteo de notificaciones', count: 0 },
      { status: 500 }
    );
  }
}


