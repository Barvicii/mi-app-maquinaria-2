import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Machine from '@/models/Machine';

export async function GET() {
  try {
    await dbConnect();
    
    // Obtener todas las máquinas
    const maquinas = await Maquina.find({});
    
    console.log('Total de máquinas en DB:', maquinas.length);
    console.log('IDs disponibles:', maquinas.map(m => m.id));
    
    return NextResponse.json({
      total: maquinas.length,
      maquinas: maquinas.map(m => ({
        id: m.id,
        modelo: m.modelo,
        marca: m.marca
      }))
    });
  } catch (error) {
    console.error('Error al obtener debug:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}