import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(request, { params }) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json({ error: 'Machine ID is required' }, { status: 400 });
    }
    
    // Obtener parámetros de la consulta
    const { searchParams } = new URL(request.url);
    const isPublic = searchParams.get('public') === 'true';
    
    console.log(`Finding technicians for machine: ${id}, public access: ${isPublic}`);
    
    const db = await connectDB();
    
    // Primero obtenemos la máquina para conseguir su userId
    let machine;
    try {
      machine = await db.collection('machines').findOne({ _id: new ObjectId(id) });
    } catch (error) {
      console.error('Error converting machine ID:', error);
      return NextResponse.json({ error: 'Invalid machine ID format' }, { status: 400 });
    }
    
    if (!machine) {
      return NextResponse.json({ error: 'Machine not found' }, { status: 404 });
    }
    
    // Obtenemos el userId de la máquina
    const machineUserId = machine.userId;
    
    if (!machineUserId) {
      return NextResponse.json({ error: 'No user associated with this machine' }, { status: 404 });
    }
    
    console.log(`Finding technicians for machine: ${id}, userId: ${machineUserId}`);
    
    // Buscamos los técnicos que tengan el mismo userId que creó la máquina
    // y sean de tipo técnico
    const technicians = await db.collection('operators')
      .find({ 
        userId: machineUserId,
        $or: [
          { tipo: 'technician' },
          { tipo: 'técnico' },
          { tipo: 'tecnico' }
        ]
      })
      .toArray();
    
    return NextResponse.json(technicians);
  } catch (error) {
    console.error('Error fetching technicians for machine:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}