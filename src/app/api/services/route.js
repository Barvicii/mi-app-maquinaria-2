import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Service from '@/models/Service';

export async function POST(request) {
  try {
    await dbConnect();
    
    const data = await request.json();
    console.log('Datos recibidos en API:', data);

    // Validar datos requeridos
    if (!data.maquinaId) {
      throw new Error('ID de máquina no proporcionado');
    }

    if (!data.datos?.horasActuales) {
      throw new Error('Horas actuales no proporcionadas');
    }

    if (!data.datos?.tecnico) {
      throw new Error('Técnico no seleccionado');
    }

    // Crear el servicio
    const serviceData = {
      maquinaId: data.maquinaId.toString(),
      fecha: new Date(data.fecha || Date.now()),
      datos: {
        ...data.datos,
        horasActuales: data.datos.horasActuales.toString(),
        horasProximoService: data.datos.horasProximoService.toString(),
        trabajosRealizados: Array.isArray(data.datos.trabajosRealizados) ? data.datos.trabajosRealizados : [],
        observaciones: data.datos.observaciones || '',
        repuestos: data.datos.repuestos || ''
      }
    };

    console.log('Service a guardar:', serviceData);

    const service = await Service.create(serviceData);
    console.log('Service guardado:', service);

    return NextResponse.json({
      success: true,
      data: service
    }, { status: 201 });

  } catch (error) {
    console.error('Error en API Service:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Error al guardar el Service'
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    await dbConnect();
    const services = await Service.find({}).sort({ fecha: -1 });
    
    console.log('Services encontrados:', services.length);
    
    return NextResponse.json({
      success: true,
      data: services
    });
  } catch (error) {
    console.error('Error al obtener services:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}