import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';

export async function GET(request) {
  try {
    const db = await connectDB();
    
    // Obtener los últimos 10 servicios sin filtro
    const services = await db.collection('services')
      .find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();
    
    // Información detallada sobre cada servicio
    const detailedServices = services.map(service => {
      return {
        _id: service._id?.toString(),
        fullDocument: {
          ...service,
          _id: service._id?.toString(),
          maquinaId: service.maquinaId?.toString()
        },
        keys: Object.keys(service),
        values: Object.entries(service).reduce((acc, [key, value]) => {
          acc[key] = {
            type: typeof value,
            isEmpty: value === null || value === undefined || value === '',
            value: value && typeof value === 'object' ? 
              (value instanceof Date ? value.toISOString() : JSON.stringify(value)) : 
              String(value)
          };
          return acc;
        }, {})
      };
    });
    
    return NextResponse.json({
      count: services.length,
      services: detailedServices
    });
  } catch (error) {
    console.error("Error en endpoint de diagnóstico:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}