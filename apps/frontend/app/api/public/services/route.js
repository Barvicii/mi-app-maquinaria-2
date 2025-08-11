import { NextResponse } from 'next/server';
import { connectDB } from "@/lib/mongodb";
import { ObjectId } from 'mongodb';

export async function POST(request) {
  try {
    const data = await request.json();
    
    // Validar campos requeridos
    if (!data.maquinaId) {
      return NextResponse.json({
        error: 'Missing required machine ID'
      }, { status: 400 });
    }

    // Validar formato de ID
    if (data.maquinaId && !ObjectId.isValid(data.maquinaId)) {
      return NextResponse.json({
        error: 'Invalid machine ID format'
      }, { status: 400 });
    }
    
    const db = await connectDB();
    
    // Añadir metadatos
    const service = {
      ...data,
      createdAt: new Date(),
      source: 'public', // Marcar como creado desde acceso público
    };
    
    // Guardar en la base de datos
    const result = await db.collection('services').insertOne(service);
    
    // Obtener documento insertado
    const savedService = await db.collection('services')
      .findOne({ _id: result.insertedId });
    
    return NextResponse.json(savedService, { status: 201 });
  } catch (error) {
    console.error('Error creating public service:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


