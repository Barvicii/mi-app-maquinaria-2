import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(request, context) {
  try {
    const { id } = await context.params;
    console.log('API request for machine ID:', id);
    
    // Validar que el ID sea un ObjectId válido
    if (!ObjectId.isValid(id)) {
      console.log('Invalid machine ID format:', id);
      return NextResponse.json({ error: 'Invalid machine ID format' }, { status: 400 });
    }
    
    const db = await connectDB();
    
    // Buscar la máquina por ID
    const machine = await db.collection('machines').findOne(
      { _id: new ObjectId(id) }
    );
    
    if (!machine) {
      console.log('Machine not found:', id);
      return NextResponse.json({ error: 'Machine not found' }, { status: 404 });
    }
    
    console.log('Machine found:', machine._id);
    return NextResponse.json(machine);
  } catch (error) {
    console.error('Error fetching machine:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}