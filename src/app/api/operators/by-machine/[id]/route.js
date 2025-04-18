// src/app/api/operators/by-machine/[id]/route.js
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(request, { params }) {
  try {
    // Asegurarse de que params está disponible y obtener id de manera segura
    if (!params) {
      return NextResponse.json({ error: "Invalid request: params is undefined" }, { status: 400 });
    }
    
    const id = params.id;
    
    console.log(`Finding operators for machine ID: ${id}`);
    
    if (!id) {
      return NextResponse.json({ error: 'Machine ID is required' }, { status: 400 });
    }
    
    const { searchParams } = new URL(request.url);
    const isPublic = searchParams.get('public') === 'true';
    
    console.log(`Finding operators for machine: ${id}, public access: ${isPublic}`);
    
    const db = await connectDB();
    
    // Primero obtenemos la máquina para conseguir su userId
    let machine;
    try {
      if (ObjectId.isValid(id)) {
        machine = await db.collection('machines').findOne({ 
          _id: new ObjectId(id)
        });
        console.log(`Searched machine by ObjectId: ${!!machine}`);
      }
      
      // Si no se encuentra por ObjectId, buscar por otros campos de ID
      if (!machine) {
        machine = await db.collection('machines').findOne({
          $or: [
            { machineId: id },
            { maquinaId: id },
            { customId: id }
          ]
        });
        console.log(`Searched machine by alternate IDs: ${!!machine}`);
      }
    } catch (error) {
      console.error('Error finding machine:', error);
      return NextResponse.json({ error: 'Error finding machine' }, { status: 500 });
    }

    if (!machine) {
      console.error(`Machine with ID ${id} not found`);
      return NextResponse.json({ error: 'Machine not found' }, { status: 404 });
    }
    
    // Obtenemos el userId de la máquina
    const machineUserId = machine.userId;
    
    console.log(`Found machine: ${machine._id}, userId: ${machineUserId}`);
    
    if (!machineUserId) {
      console.log(`No userId found for machine ${id}, returning empty array`);
      return NextResponse.json([]);
    }
    
    // Buscamos TODOS los operadores que tengan el mismo userId que creó la máquina
    const operators = await db.collection('operators')
      .find({ userId: machineUserId })
      .sort({ nombre: 1 })
      .toArray();
    
    console.log(`Found ${operators.length} operators for machine ${id} with userId ${machineUserId}`);
    
    return NextResponse.json(operators);
  } catch (error) {
    console.error('Error fetching operators for machine:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}