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
    
    // Calculate status based on checks
    const allChecks = [
      'aceite', 'agua', 'neumaticos', 'nivelCombustible',
      'lucesYAlarmas', 'frenos', 'extintores', 'cinturonSeguridad'
    ];
    
    const hasFailedChecks = allChecks.some(check => !data[check]);
    data.estado = hasFailedChecks ? 'Requiere atención' : 'OK';

    const prestart = new PreStart(data);
    const savedPrestart = await prestart.save();

    return NextResponse.json(savedPrestart, { status: 201 });
  } catch (error) {
    console.error('POST prestart error:', error);
    return NextResponse.json(
      { error: 'Error creating prestart', message: error.message },
      { status: 500 }
    );
  }
}