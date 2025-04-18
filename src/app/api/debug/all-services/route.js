import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';

export async function GET() {
  try {
    const db = await connectDB();
    
    // Obtener todos los servicios sin ningún filtro
    const services = await db.collection('services')
      .find({})
      .sort({ createdAt: -1 })
      .limit(20)
      .toArray();
    
    return NextResponse.json({
      count: services.length,
      message: "Esta ruta es solo para depuración",
      services
    });
  } catch (error) {
    console.error("Error al obtener servicios:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}