import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { NextResponse } from 'next/server';
import { connectDB } from '../../../utils/db';

export async function GET(request) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    
    const userId = session.user.id;
    console.log('GET machines for user:', userId);
    
    const db = await connectDB();
    // Filtrar máquinas por userId
    const machines = await db.collection('machines')
      .find({ userId: userId })
      .sort({ createdAt: -1 })
      .toArray();
      
    return NextResponse.json(machines);
  } catch (error) {
    console.error('Error fetching machines:', error);
    return NextResponse.json({ error: error.message || "Failed to fetch machines" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    
    const userId = session.user.id;
    console.log('Creating machine for user:', userId);
    
    let data;
    try {
      data = await request.json();
    } catch (error) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    
    // Añadir userId al documento
    data.userId = userId;
    
    // Validar campos requeridos
    if (!data.model || !data.brand) {
      return NextResponse.json({ 
        error: "Model and brand are required" 
      }, { status: 400 });
    }

    // Generar machineId si no existe
    if (!data.machineId) {
      data.machineId = `MACHINE_${Date.now()}`;
    }

    // Añadir fechas
    const now = new Date();
    data.createdAt = now;
    data.updatedAt = now;

    const db = await connectDB();
    
    // Insertar en la base de datos
    const result = await db.collection('machines').insertOne(data);
    
    console.log('Insert result:', result);
    
    if (!result.insertedId) {
      return NextResponse.json({ 
        error: "Failed to create machine" 
      }, { status: 500 });
    }
    
    // Obtener la máquina recién creada
    const newMachine = await db.collection('machines').findOne({
      _id: result.insertedId
    });
    
    return NextResponse.json(newMachine);
  } catch (error) {
    console.error('Error creating machine:', error);
    return NextResponse.json({ error: error.message || "Failed to create machine" }, { status: 500 });
  }
}