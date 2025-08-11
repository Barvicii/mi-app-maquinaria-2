import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

export async function POST() {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  let client;

  try {
    if (!process.env.MONGODB_URI) {
      return NextResponse.json({
        success: false,
        error: 'MongoDB URI not configured'
      }, { status: 500, headers });
    }

    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();

    const db = client.db('orchardservice');
    const usersCollection = db.collection('users');

    // Update the admin user role to SUPER_ADMIN
    const result = await usersCollection.updateOne(
      { email: 'orchardservices96@gmail.com' },
      { 
        $set: { 
          role: 'SUPER_ADMIN',
          updatedAt: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({
        success: false,
        error: 'Admin user not found'
      }, { status: 404, headers });
    }

    // Get the updated user
    const updatedUser = await usersCollection.findOne({ email: 'orchardservices96@gmail.com' });

    return NextResponse.json({
      success: true,
      message: 'Admin user role updated to SUPER_ADMIN',
      user: {
        id: updatedUser._id.toString(),
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role
      },
      timestamp: new Date().toISOString()
    }, { status: 200, headers });

  } catch (error) {
    console.error('Error updating admin role:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500, headers });
  } finally {
    if (client) {
      await client.close();
    }
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { 
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}

