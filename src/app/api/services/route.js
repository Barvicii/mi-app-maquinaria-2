import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Service from '@/models/Service';

export async function GET(request) {
  try {
    console.log('API: Connecting to database...');
    await dbConnect();
    console.log('API: Connected to database, fetching services...');
    
    const services = await Service.find({}).sort({ fecha: -1 });
    console.log(`API: Found ${services.length} services`);
    
    return NextResponse.json(services);
  } catch (error) {
    console.error('API ERROR - GET services:', error);
    // Return detailed error for debugging
    return NextResponse.json(
      { 
        error: 'Failed to fetch services', 
        message: error.message,
        stack: error.stack
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    console.log('API: Connecting to database for POST...');
    await dbConnect();
    
    const data = await request.json();
    console.log('API: Received service data:', data);
    
    // Format the data
    const serviceData = {
      tecnico: data.tecnico,
      fecha: new Date(data.fecha || Date.now()),
      horasMaquina: Number(data.horasMaquina),
      tipoServicio: data.tipoServicio,
      proximoService: Number(data.proximoService),
      trabajosRealizados: Array.isArray(data.trabajosRealizados) 
        ? data.trabajosRealizados 
        : [],
      repuestos: data.repuestos || '',
      observaciones: data.observaciones || '',
      costo: Number(data.costo) || 0
    };

    console.log('API: Formatted service data:', serviceData);
    const service = new Service(serviceData);
    const savedService = await service.save();
    console.log('API: Service saved successfully:', savedService._id);
    
    return NextResponse.json(savedService, { status: 201 });
  } catch (error) {
    console.error('API ERROR - POST service:', error);
    return NextResponse.json(
      { 
        error: 'Error creating service', 
        message: error.message,
        stack: error.stack
      },
      { status: 500 }
    );
  }
}