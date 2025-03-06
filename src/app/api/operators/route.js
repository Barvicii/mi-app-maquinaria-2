import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { ObjectId } from 'mongodb';

export async function GET() {
  try {
    const db = await connectDB();
    const operators = await db.collection('operators').find().toArray();
    
    console.log('Fetched operators:', operators.length); // Debug log
    
    return NextResponse.json(operators);
  } catch (error) {
    console.error('GET operators error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch operators' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await connectDB();
    const data = await request.json();
    
    const newOperator = {
      ...data,
      userId: session.user.id,
      createdAt: new Date()
    };

    const result = await db.collection('operators').insertOne(newOperator);

    console.log('Operator created:', result); // Debug log

    return NextResponse.json({
      _id: result.insertedId,
      ...newOperator
    });
  } catch (error) {
    console.error('Create operator error:', error);
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