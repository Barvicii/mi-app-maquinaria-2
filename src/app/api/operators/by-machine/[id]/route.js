// src/app/api/operators/by-machine/[id]/route.js
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(request, { params }) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json({ error: 'Machine ID is required' }, { status: 400 });
    }
    
    const db = await connectDB();
    
    // Primero obtenemos la máquina para conseguir su userId
    let machine;
    try {
      machine = await db.collection('machines').findOne({ _id: new ObjectId(id) });
    } catch (error) {
      console.error('Error al convertir ID de máquina:', error);
      // Intentamos buscar con el ID como string por si acaso
      machine = await db.collection('machines').findOne({ id: id });
    }
    
    if (!machine) {
      return NextResponse.json({ error: 'Machine not found' }, { status: 404 });
    }
    
    // Obtenemos el userId de la máquina
    const machineUserId = machine.userId;
    
    if (!machineUserId) {
      return NextResponse.json({ error: 'No user associated with this machine' }, { status: 404 });
    }
    
    console.log(`Finding operators for machine: ${id}, userId: ${machineUserId}`);
    
    // Buscamos los operadores/técnicos que tengan el mismo userId
    const operators = await db.collection('operators')
      .find({ userId: machineUserId })
      .toArray();
    
    return NextResponse.json(operators);
  } catch (error) {
    console.error('Error fetching operators for machine:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}