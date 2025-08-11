import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { ObjectId } from 'mongodb';

export async function PUT(request, { params }) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: 'Alert ID is required' }, { status: 400 });
    }
    
    const updateData = await request.json();
    
    const db = await connectDB();
    
    // Verificar que la alerta existe y pertenece al usuario
    const existingAlert = await db.collection('userAlerts').findOne({ 
      _id: new ObjectId(id),
      userId: session.user.id
    });
    
    if (!existingAlert) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
    }
    
    // Actualizar la alerta
    await db.collection('userAlerts').updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: {
          ...updateData,
          updatedAt: new Date()
        } 
      }
    );
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Error updating alert:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}