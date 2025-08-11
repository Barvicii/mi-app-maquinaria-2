import { NextResponse } from 'next/server';
import { connectDB } from "@/lib/mongodb";
import { getServerSession } from 'next-auth';
import { authOptions } from '@/api/auth/[...nextauth]/route';
import { ObjectId } from 'mongodb';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await connectDB();
    console.log('Database connected:', db.databaseName); // Verify database name

    const data = await request.json();
    console.log('Received prestart check data:', data);

    // Verify machine belongs to user
    const machine = await db.collection('machines').findOne({
      _id: new ObjectId(data.maquinaId),
      userId: session.user.id
    });

    if (!machine) {
      console.error('Machine not found or unauthorized');
      return NextResponse.json({ error: 'Machine not found' }, { status: 404 });
    }

    const prestartCheck = {
      ...data,
      userId: session.user.id,
      createdAt: new Date()
    };

    const result = await db.collection('prestartChecks').insertOne(prestartCheck);
    console.log('Prestart check saved:', result.insertedId);

    return NextResponse.json({
      _id: result.insertedId,
      ...prestartCheck
    });
  } catch (error) {
    console.error('Error saving prestart check:', error);
    return NextResponse.json({ 
      error: 'Error saving prestart check',
      details: error.message 
    }, { status: 500 });
  }
}


