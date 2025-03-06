import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { ObjectId } from 'mongodb';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await connectDB();
    console.log('Connected to database:', db.databaseName);
    
    // Get user's machines
    const userMachines = await db.collection('machines')
      .find({ userId: session.user.id })
      .toArray();
    
    const userMachineIds = userMachines.map(m => m._id.toString());
    
    // Get services for user's machines
    const services = await db.collection('services')
      .find({ maquinaId: { $in: userMachineIds } })
      .toArray();

    console.log(`Found ${services.length} services for user's machines`);
    return NextResponse.json(services);
  } catch (error) {
    console.error('Error fetching services:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await connectDB();
    console.log('Connected to database');

    const data = await request.json();
    console.log('Received service data:', data);

    if (!data.maquinaId || !data.tecnico || !data.horasActuales) {
      return NextResponse.json({ 
        error: 'Missing required fields' 
      }, { status: 400 });
    }

    let machineId;
    try {
      machineId = new ObjectId(data.maquinaId);
    } catch (error) {
      return NextResponse.json({ 
        error: 'Invalid machine ID format' 
      }, { status: 400 });
    }

    const machine = await db.collection('machines').findOne({
      _id: machineId,
      userId: session.user.id
    });

    if (!machine) {
      return NextResponse.json({ 
        error: 'Machine not found' 
      }, { status: 404 });
    }

    const serviceRecord = {
      maquinaId: machineId,
      userId: session.user.id,
      tecnico: data.tecnico,
      fecha: new Date(data.fecha),
      horasActuales: Number(data.horasActuales),
      tipoServicio: data.tipoServicio,
      horasProximoService: Number(data.horasProximoService),
      trabajosRealizados: data.trabajosRealizados,
      repuestos: data.repuestos,
      observaciones: data.observaciones,
      costo: Number(data.costo),
      createdAt: new Date()
    };

    const result = await db.collection('services').insertOne(serviceRecord);
    console.log('Service created:', result.insertedId);

    // Update machine's current hours and next service
    await db.collection('machines').updateOne(
      { _id: machineId },
      { 
        $set: { 
          horasActuales: serviceRecord.horasActuales,
          proximoService: serviceRecord.horasProximoService
        } 
      }
    );

    return NextResponse.json({
      _id: result.insertedId,
      ...serviceRecord
    }, { status: 201 });

  } catch (error) {
    console.error('POST service error:', error);
    return NextResponse.json({ 
      error: 'Error creating service',
      details: error.message 
    }, { status: 500 });
  }
}