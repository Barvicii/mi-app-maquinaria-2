import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { ObjectId } from 'mongodb';

export async function POST(request, { params }) {
  try {
    // Verificar autenticación y rol de admin
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    
    const { id } = params;
    
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }
    
    // Obtener el motivo de rechazo del cuerpo de la solicitud
    const body = await request.json();
    const { rejectionReason } = body;
    
    // Conectar a la base de datos
    const db = await connectDB();
    
    // Buscar la solicitud
    const requestData = await db.collection('applicationRequests').findOne({
      _id: new ObjectId(id),
      status: 'pending'
    });
    
    if (!requestData) {
      return NextResponse.json({ error: 'Solicitud no encontrada o ya procesada' }, { status: 404 });
    }
    
    // Actualizar solicitud a rechazada
    await db.collection('applicationRequests').updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: {
          status: 'rejected',
          rejectionReason: rejectionReason || '',
          reviewDate: new Date(),
          reviewedBy: new ObjectId(session.user.id)
        }
      }
    );
    
    // Enviar email de rechazo
    // Si se proporciona un motivo, incluirlo en el email
    // await sendRejectionEmail(requestData.applicationData.email, requestData.applicationData.fullName, rejectionReason);
    
    return NextResponse.json({
      success: true,
      message: 'Solicitud rechazada correctamente'
    });
    
  } catch (error) {
    console.error('Error procesando rechazo:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}