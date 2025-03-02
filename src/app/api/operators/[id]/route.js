import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await connectDB();
    const operator = await db.collection('operators').findOne({
      _id: new ObjectId(params.id),
      userId: session.user.id
    });

    if (!operator) {
      return NextResponse.json({ error: 'Operator not found' }, { status: 404 });
    }

    return NextResponse.json(operator);
  } catch (error) {
    console.error('Get operator error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await connectDB();
    const data = await request.json();
    
    // Remove _id from the data before updating
    const { _id, ...updateData } = data;
    
    const result = await db.collection('operators').updateOne(
      { 
        _id: new ObjectId(params.id),
        userId: session.user.id
      },
      { $set: { ...updateData, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Operator not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      message: 'Operator updated successfully', 
      _id: params.id,
      ...updateData 
    });
  } catch (error) {
    console.error('Update operator error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await connectDB();
    const result = await db.collection('operators').deleteOne({
      _id: new ObjectId(params.id),
      userId: session.user.id
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Operator not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Operator deleted successfully' });
  } catch (error) {
    console.error('Delete operator error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}