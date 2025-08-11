import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { connectDB } from '@/lib/mongodb';
import { authOptions } from '../../auth/[...nextauth]/route';
import { ObjectId } from 'mongodb';

// PUT: Marcar una notificación como leída
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }
    
    const data = await request.json();
    const { read = true } = data;
    
    const db = await connectDB();
    
    // Verificar que la notificación existe y pertenece al usuario
    const notification = await db.collection('notifications').findOne({
      _id: new ObjectId(id),
      userId: session.user.id
    });
    
    if (!notification) {
      return NextResponse.json(
        { error: 'Notificación no encontrada' },
        { status: 404 }
      );
    }
    
    // Actualizar el estado de lectura
    const result = await db.collection('notifications').updateOne(
      { _id: new ObjectId(id) },
      { $set: { read, updatedAt: new Date() } }
    );
    
    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: 'No se pudo actualizar la notificación' },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Notificación actualizada correctamente'
    });
    
  } catch (error) {
    console.error('Error actualizando notificación:', error);
    return NextResponse.json(
      { error: 'Error al actualizar notificación' },
      { status: 500 }
    );
  }
}

// DELETE: Eliminar una notificación
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }
    
    const db = await connectDB();
    
    // Verificar que la notificación existe y pertenece al usuario
    const notification = await db.collection('notifications').findOne({
      _id: new ObjectId(id),
      userId: session.user.id
    });
    
    if (!notification) {
      return NextResponse.json(
        { error: 'Notificación no encontrada' },
        { status: 404 }
      );
    }
    
    // Eliminar la notificación
    const result = await db.collection('notifications').deleteOne({
      _id: new ObjectId(id)
    });
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'No se pudo eliminar la notificación' },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Notificación eliminada correctamente'
    });
    
  } catch (error) {
    console.error('Error eliminando notificación:', error);
    return NextResponse.json(
      { error: 'Error al eliminar notificación' },
      { status: 500 }
    );
  }
}