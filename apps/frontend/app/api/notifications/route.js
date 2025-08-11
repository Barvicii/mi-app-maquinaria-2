import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { connectDB } from "@/lib/mongodb";
import { authOptions } from '../auth/[...nextauth]/route';
import { ObjectId } from 'mongodb';

// GET: Obtener notificaciones del usuario actual
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
    
    const searchParams = new URL(request.url).searchParams;
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const unreadOnly = searchParams.get('unread') === 'true';
    
    const db = await connectDB();
    
    // Construir la consulta
    const query = {
      userId: session.user.id,
      organizationId: session.user.credentialId
    };
    
    if (unreadOnly) {
      query.read = false;
    }
    
    // Ejecutar consulta con paginación
    const total = await db.collection('notifications').countDocuments(query);
    
    const notifications = await db.collection('notifications')
      .find(query)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();
    
    // Transformar resultados
    const transformedNotifications = notifications.map(notification => ({
      id: notification._id.toString(),
      title: notification.title,
      message: notification.message,
      type: notification.type,
      read: notification.read || false,
      createdAt: notification.createdAt,
      data: notification.data || {},
      actionUrl: notification.actionUrl
    }));
    
    return NextResponse.json({
      notifications: transformedNotifications,
      pagination: {
        total,
        limit,
        offset,
        hasMore: total > offset + limit
      }
    });
    
  } catch (error) {
    console.error('Error obteniendo notificaciones:', error);
    return NextResponse.json(
      { error: 'Error al obtener notificaciones' },
      { status: 500 }
    );
  }
}

// POST: Crear notificación interna (sólo para uso del sistema, no expuesto al cliente)
export async function POST(request) {
  try {
    // Esta función debe ser llamada solo desde otros endpoints del servidor
    // Verificar API key interna o token para autenticar solicitudes internas
    const internalKey = request.headers.get('x-internal-api-key');
    
    if (internalKey !== process.env.INTERNAL_API_KEY) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      );
    }
    
    const data = await request.json();
    const { 
      userId, 
      organizationId, 
      title, 
      message, 
      type, 
      actionUrl, 
      relatedEntityId,
      relatedEntityType,
      additionalData 
    } = data;
    
    // Validar campos obligatorios
    if (!userId || !organizationId || !title || !message || !type) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios' },
        { status: 400 }
      );
    }
    
    const db = await connectDB();
    
    // Crear la notificación
    const notification = {
      userId,
      organizationId,
      title,
      message,
      type,
      read: false,
      createdAt: new Date(),
      actionUrl: actionUrl || null,
      data: {
        relatedEntityId: relatedEntityId || null,
        relatedEntityType: relatedEntityType || null,
        ...additionalData
      }
    };
    
    const result = await db.collection('notifications').insertOne(notification);
    
    return NextResponse.json({
      success: true,
      notification: {
        id: result.insertedId,
        ...notification
      }
    });
    
  } catch (error) {
    console.error('Error creando notificación:', error);
    return NextResponse.json(
      { error: 'Error al crear notificación' },
      { status: 500 }
    );
  }
}


