import { NextResponse } from 'next/server';
import { connectDB } from "@/lib/mongodb";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }

  try {
    const db = await connectDB();
    const user = await db.collection('users').findOne({ email: email.toLowerCase().trim() });
    return NextResponse.json({ exists: !!user });
  } catch (error) {
    console.error('Error checking email:', error);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}


