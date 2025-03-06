import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { ObjectId } from 'mongodb';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    console.log('Received machine data:', body); // Debug log

    // Validate required fields
    if (!body.customId || !body.model || !body.marca) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const db = await connectDB();
    
    // Check for duplicate customId
    const existingMachine = await db.collection('machines').findOne({ 
      customId: body.customId,
      userId: session.user.id
    });

    if (existingMachine) {
      return NextResponse.json(
        { error: "Machine ID already exists" },
        { status: 400 }
      );
    }

    const newMachine = {
      ...body,
      userId: session.user.id,
      createdAt: new Date()
    };

    console.log('Creating new machine:', newMachine); // Debug log

    const result = await db.collection('machines').insertOne(newMachine);
    
    // Return the created machine
    return NextResponse.json({
      _id: result.insertedId,
      ...newMachine
    });

  } catch (error) {
    console.error('POST machines error:', error);
    return NextResponse.json(
      { error: "Error creating machine" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const db = await connectDB();
    const machines = await db.collection('machines')
      .find({ userId: session.user.id })
      .toArray();

    return NextResponse.json(machines);

  } catch (error) {
    console.error('GET machines error:', error);
    return NextResponse.json(
      { error: "Error fetching machines" },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
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