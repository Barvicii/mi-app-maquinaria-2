import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';

export async function GET(request) {
  return POST(request);
}

export async function POST(request) {
  // Headers to bypass Vercel authentication
  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'X-Vercel-No-Auth': 'true',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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

    // Check if admin already exists
    const existingAdmin = await usersCollection.findOne({ 
      email: 'orchardservices96@gmail.com' 
    });

    if (existingAdmin) {
      return NextResponse.json({
        success: true,
        message: 'Admin user already exists',
        user: {
          id: existingAdmin._id.toString(),
          email: existingAdmin.email,
          name: existingAdmin.name,
          role: existingAdmin.role
        }
      }, { status: 200, headers });
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('BaltonInalen321!', 12);
    
    const newAdmin = {
      email: 'orchardservices96@gmail.com',
      password: hashedPassword,
      name: 'Super Admin',
      role: 'SUPER_ADMIN',
      active: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await usersCollection.insertOne(newAdmin);

    return NextResponse.json({
      success: true,
      message: 'Admin user created successfully',
      user: {
        id: result.insertedId.toString(),
        email: newAdmin.email,
        name: newAdmin.name,
        role: newAdmin.role
      },
      timestamp: new Date().toISOString()
    }, { status: 201, headers });

  } catch (error) {
    console.error('Error creating admin:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500, headers });

  } finally {
    if (client) {
      await client.close();
    }
  }
}

export async function OPTIONS(request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

