import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import PreStart from '@/models/PreStart';

export async function POST(request) {
  try {
    await dbConnect();
    
    const data = await request.json();
    console.log('Datos recibidos:', data);

    // Asegurarnos de que maquinaId sea string
    const prestartData = {
      maquinaId: data.maquinaId.toString(),
      fecha: new Date(),
      datos: {
        ...data.datos,
        maquina: data.datos.maquina,
        horasMaquina: data.datos.horasMaquina.toString(),
        aceite: Boolean(data.datos.aceite),
        agua: Boolean(data.datos.agua),
        neumaticos: Boolean(data.datos.neumaticos),
        nivelCombustible: Boolean(data.datos.nivelCombustible),
        lucesYAlarmas: Boolean(data.datos.lucesYAlarmas),
        frenos: Boolean(data.datos.frenos),
        extintores: Boolean(data.datos.extintores),
        cinturonSeguridad: Boolean(data.datos.cinturonSeguridad),
        observaciones: data.datos.observaciones || '',
        operador: data.datos.operador
      }
    };

    console.log('Datos a guardar:', prestartData);

    const prestart = await PreStart.create(prestartData);
    
    console.log('PreStart guardado:', prestart);

    return NextResponse.json({
      success: true,
      data: prestart
    }, { status: 201 });

  } catch (error) {
    console.error('Error completo:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    await dbConnect();
    
    const prestarts = await PreStart.find({})
      .sort({ fecha: -1 })
      .lean();  // Convertir a objetos planos de JavaScript
    
    console.log('Prestarts encontrados:', prestarts.length);
    
    return NextResponse.json({
      success: true,
      data: prestarts
    });
    
  } catch (error) {
    console.error('Error al obtener prestarts:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}