import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { ObjectId } from 'mongodb';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      console.log('No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await connectDB();
    const data = await request.json();
    
    const newMachine = {
      ...data,
      userId: session.user.id,
      createdAt: new Date()
    };

    console.log('Creating machine:', newMachine);
    const result = await db.collection('machines').insertOne(newMachine);
    console.log('Machine created with ID:', result.insertedId);

    return NextResponse.json({
      _id: result.insertedId,
      ...newMachine
    });
  } catch (error) {
    console.error('Create machine error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await connectDB();
    const machines = await db.collection('machines')
      .find({ userId: session.user.id })
      .toArray();

    console.log(`Found ${machines.length} machines for user ${session.user.id}`);
    return NextResponse.json(machines);
  } catch (error) {
    console.error('Fetch machines error:', error);
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
    
    if (!id) {
      return NextResponse.json({ error: 'Machine ID is required' }, { status: 400 });
    }

    const db = await connectDB();
    console.log('Attempting to delete machine:', id);
    
    const result = await db.collection('machines').deleteOne({
      _id: new ObjectId(id),
      userId: session.user.id
    });

    console.log('Delete result:', result);

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Machine not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete machine error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { _id, ...updateData } = data;

    if (!_id) {
      return NextResponse.json({ error: 'Machine ID is required' }, { status: 400 });
    }

    const db = await connectDB();
    console.log('Updating machine:', _id, updateData);

    const result = await db.collection('machines').updateOne(
      { 
        _id: new ObjectId(_id),
        userId: session.user.id 
      },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Machine not found' }, { status: 404 });
    }

    console.log('Update result:', result);
    return NextResponse.json({ ...data, message: 'Machine updated successfully' });
  } catch (error) {
    console.error('Update machine error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}