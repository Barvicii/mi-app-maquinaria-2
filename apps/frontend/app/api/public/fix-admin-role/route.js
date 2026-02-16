import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';

export async function POST(request) {
  try {
    // Require a setup secret
    const setupSecret = process.env.ADMIN_SETUP_SECRET;
    if (!setupSecret) {
      return NextResponse.json({ success: false, error: 'Setup not available' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    if (body.secret !== setupSecret) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
      return NextResponse.json({ success: false, error: 'Admin email not configured' }, { status: 500 });
    }

    const db = await connectDB();

    const result = await db.collection('users').updateOne(
      { email: adminEmail },
      { $set: { role: 'SUPER_ADMIN', updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ success: false, error: 'Admin user not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Admin role updated to SUPER_ADMIN'
    });

  } catch (error) {
    console.error('Error updating admin role:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

