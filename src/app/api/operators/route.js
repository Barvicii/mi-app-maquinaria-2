import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { ObjectId } from 'mongodb';

export async function GET(request) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    
    const userId = session.user.id;
    console.log('GET operators for user:', userId);
    
    const db = await connectDB();
    // Filtrar operadores por userId
    const operators = await db.collection('operators')
      .find({ userId: userId })
      .sort({ createdAt: -1 })
      .toArray();
      
    return NextResponse.json(operators);
  } catch (error) {
    console.error('Error fetching operators:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    
    const userId = session.user.id;
    console.log('Creating operator for user:', userId);
    
    let data;
    try {
      data = await request.json();
    } catch (error) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    
    // Añadir userId al documento
    data.userId = userId;
    data.createdAt = new Date();
    
    const db = await connectDB();
    const result = await db.collection('operators').insertOne(data);
    
    const newOperator = await db.collection('operators').findOne({
      _id: result.insertedId
    });
    
    return NextResponse.json(newOperator);
  } catch (error) {
    console.error('Error creating operator:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    const db = await connectDB();
    const result = await db.collection('operators').deleteOne({
      _id: new ObjectId(id),
      userId: session.user.id
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'Operator not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting operator:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}