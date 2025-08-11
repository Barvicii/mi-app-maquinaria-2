import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { ObjectId } from 'mongodb';
import { generatePassword } from '@/lib/utils';

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
    
    // Conectar a la base de datos
    const db = await connectDB();
    
    // Buscar la solicitud
    const request = await db.collection('applicationRequests').findOne({
      _id: new ObjectId(id),
      status: 'pending'
    });
    
    if (!request) {
      return NextResponse.json({ error: 'Solicitud no encontrada o ya procesada' }, { status: 404 });
    }
    
    // Generar contraseña temporal
    const tempPassword = generatePassword();
    
    // Crear usuario
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    
    const newUser = {
      name: request.applicationData.fullName,
      email: request.applicationData.email,
      password: hashedPassword,
      role: 'user',
      company: request.applicationData.company,
      phone: request.applicationData.phone,
      firstLogin: true,
      status: 'active',
      createdAt: new Date(),
      createdBy: session.user.id
    };
    
    const userResult = await db.collection('users').insertOne(newUser);
    
    // Actualizar solicitud a aprobada
    await db.collection('applicationRequests').updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: {
          status: 'approved',
          reviewDate: new Date(),
          reviewedBy: new ObjectId(session.user.id)
        }
      }
    );
    
    // Enviar email con credenciales temporales
    // await sendApprovalEmail(request.applicationData.email, request.applicationData.fullName, tempPassword);
    
    return NextResponse.json({
      success: true,
      message: 'Solicitud aprobada y usuario creado correctamente'
    });
    
  } catch (error) {
    console.error('Error procesando aprobación:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}