import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import PreStart from '@/models/PreStart';

export async function GET() {
  try {
    await dbConnect();
    const prestarts = await PreStart.find({})
      .sort({ createdAt: -1 });
    
    return NextResponse.json(prestarts);
  } catch (error) {
    console.error('GET prestarts error:', error);
    return NextResponse.json(
      { error: 'Error loading prestarts' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    const data = await request.json();
    
    console.log('Received PreStart data:', data);
    
    // Check if machineId is present
    if (!data.maquinaId) {
      console.warn('No machineId provided for PreStart check');
    }
    
    // Calculate status based on checks
    const allChecks = [
      'aceite', 'agua', 'neumaticos', 'nivelCombustible',
      'lucesYAlarmas', 'frenos', 'extintores', 'cinturonSeguridad'
    ];
    
    const hasFailedChecks = allChecks.some(check => !data[check]);
    data.estado = hasFailedChecks ? 'Requiere atención' : 'OK';

    // Handle both direct submission and nested submission formats
    let prestartData;
    if (data.datos) {
      // Format from ServiceForm (nested data)
      prestartData = {
        ...data.datos,
        machineId: data.maquinaId, // Ensure machineId is attached
        fecha: data.fecha || new Date()
      };
    } else {
      // Direct submission from PreStartCheckForm
      prestartData = {
        ...data,
        machineId: data.maquinaId, // Ensure consistency in field name
        fecha: data.fecha || new Date()
      };
    }

    console.log('Saving PreStart data:', prestartData);
    
    const prestart = new PreStart(prestartData);
    const savedPrestart = await prestart.save();

    console.log('PreStart saved with ID:', savedPrestart._id);
    return NextResponse.json(savedPrestart, { status: 201 });
  } catch (error) {
    console.error('POST prestart error:', error);
    return NextResponse.json(
      { error: 'Error creating prestart', message: error.message },
      { status: 500 }
    );
  }
}