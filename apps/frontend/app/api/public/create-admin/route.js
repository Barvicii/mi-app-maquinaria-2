import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';

export async function GET(request) {
  return POST(request);
}

export async function POST(request) {
  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
  };

  try {
    // Require a setup secret to prevent unauthorized admin creation
    const setupSecret = process.env.ADMIN_SETUP_SECRET;
    if (!setupSecret) {
      return NextResponse.json({ success: false, error: 'Setup not available' }, { status: 403, headers });
    }

    const { searchParams } = new URL(request.url);
    const providedSecret = searchParams.get('secret');
    if (providedSecret !== setupSecret) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403, headers });
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminEmail || !adminPassword) {
      return NextResponse.json({ success: false, error: 'Admin credentials not configured in env' }, { status: 500, headers });
    }

    const db = await connectDB();

    const existingAdmin = await db.collection('users').findOne({ email: adminEmail });
    if (existingAdmin) {
      return NextResponse.json({
        success: true,
        message: 'Admin user already exists',
        user: { id: existingAdmin._id.toString(), email: existingAdmin.email, role: existingAdmin.role }
      }, { status: 200, headers });
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    const result = await db.collection('users').insertOne({
      email: adminEmail,
      password: hashedPassword,
      name: 'Super Admin',
      role: 'SUPER_ADMIN',
      active: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return NextResponse.json({
      success: true,
      message: 'Admin user created successfully',
      user: { id: result.insertedId.toString(), email: adminEmail, role: 'SUPER_ADMIN' }
    }, { status: 201, headers });

  } catch (error) {
    console.error('Error creating admin:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500, headers });
  }
}

