import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    const { email, password, name } = await request.json();
    const db = await connectDB();

    // Log the current database
    console.log('Using database:', db.databaseName);

    // Check if user already exists
    const existingUser = await db.collection('users').findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const result = await db.collection('users').insertOne({
      email,
      password: hashedPassword,
      name,
      createdAt: new Date()
    });

    console.log('User created in database:', db.databaseName);

    return NextResponse.json({
      message: 'User created successfully',
      userId: result.insertedId
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Error creating user' },
      { status: 500 }
    );
  }
}