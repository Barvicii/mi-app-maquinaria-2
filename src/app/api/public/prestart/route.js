import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
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

    // Validar formato de ID si es un ObjectId
    if (data.maquinaId && !ObjectId.isValid(data.maquinaId)) {
      return NextResponse.json({
        error: 'Invalid machine ID format'
      }, { status: 400 });
    }
    
    const db = await connectDB();
    
    // Añadir metadatos
    const prestart = {
      ...data,
      createdAt: new Date(),
      source: 'public', // Marcar como creado desde acceso público
    };
    
    // Guardar en la base de datos
    const result = await db.collection('prestarts').insertOne(prestart);
    
    // Obtener documento insertado
    const savedPrestart = await db.collection('prestarts')
      .findOne({ _id: result.insertedId });
    
    return NextResponse.json(savedPrestart, { status: 201 });
  } catch (error) {
    console.error('Error creating public prestart:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}