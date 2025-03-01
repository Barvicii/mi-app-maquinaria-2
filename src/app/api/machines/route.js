import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Machine from '@/models/Machine';

export async function GET() {
  try {
    await dbConnect();
    console.log('Redirecting GET request from /api/maquinas to /api/machines');
    
    const machines = await Machine.find({}).sort({ createdAt: -1 });
    
    return NextResponse.json(machines, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0'
      }
    });
  } catch (error) {
    console.error('Error fetching machines:', error);
    return NextResponse.json(
      { 
        error: 'Error loading machines', 
        details: error.message 
      }, 
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    console.log('Redirecting POST request from /api/maquinas to /api/machines');
    
    const data = await request.json();
    
    // Validate required fields
    if (!data.model && !data.brand) {
      return NextResponse.json(
        { error: 'Model and Brand are required fields' }, 
        { status: 400 }
      );
    }

    // Create new machine
    const machine = new Machine(data);
    const savedMachine = await machine.save();

    return NextResponse.json(savedMachine, { status: 201 });
  } catch (error) {
    console.error('Error creating machine:', error);
    return NextResponse.json(
      { error: 'Error creating machine', details: error.message }, 
      { status: 500 }
    );
  }
}