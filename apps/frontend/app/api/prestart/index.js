import { dbConnect } from "@/lib/mongodb";
import PreStart from "@/models/PreStart";
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    await dbConnect();
    
    const data = await request.json();
    console.log('Datos recibidos:', data);

    // Validar datos requeridos
    if (!data.maquinaId || !data.datos?.horasMaquina || !data.datos?.operador) {
      return NextResponse.json({
        success: false,
        error: 'Faltan datos requeridos'
      }, { status: 400 });
    }

    // Asegurar que los booleanos estén definidos
    const datos = {
      ...data.datos,
      aceite: !!data.datos.aceite,
      agua: !!data.datos.agua,
      neumaticos: !!data.datos.neumaticos,
      nivelCombustible: !!data.datos.nivelCombustible,
      lucesYAlarmas: !!data.datos.lucesYAlarmas,
      frenos: !!data.datos.frenos,
      extintores: !!data.datos.extintores,
      cinturonSeguridad: !!data.datos.cinturonSeguridad,
      observaciones: data.datos.observaciones || ''
    };

    const prestart = await PreStart.create({
      maquinaId: data.maquinaId,
      fecha: new Date(),
      datos
    });

    console.log('PreStart creado:', prestart);

    return NextResponse.json({
      success: true,
      data: prestart
    }, { status: 201 });

  } catch (error) {
    console.error('Error al crear PreStart:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    await dbConnect();
    const prestarts = await PreStart.find({}).sort({ fecha: -1 });
    return NextResponse.json({ success: true, data: prestarts });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}


