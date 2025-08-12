import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { authOptions } from '../../../../auth/[...nextauth]/route';

export async function PUT(request, { params }) {
  try {
    console.log('🔧 Admin password change request received');
    
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session) {
      console.log('❌ No session found');
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Check if user has admin privileges
    if (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN') {
      console.log('❌ User is not admin or super admin:', session.user.role);
      return NextResponse.json(
        { error: 'Not authorized. Admin access required.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const { newPassword } = await request.json();

    console.log('📋 Changing password for user ID:', id);

    if (!newPassword) {
      return NextResponse.json(
        { error: 'New password is required' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    // Connect to database
    const db = await connectDB();
    const usersCollection = db.collection('users');

    // Find the user to update
    const user = await usersCollection.findOne({ _id: new ObjectId(id) });

    if (!user) {
      console.log('❌ User not found with ID:', id);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // If user is ADMIN (not SUPER_ADMIN), check if they can modify this user
    if (session.user.role === 'ADMIN') {
      // Admin can only change passwords for users in their organization
      if (user.organizationId !== session.user.organizationId) {
        console.log('❌ Admin trying to change password for user outside their organization');
        return NextResponse.json(
          { error: 'Not authorized. You can only change passwords for users in your organization.' },
          { status: 403 }
        );
      }
      
      // Admin cannot change password for other admins or super admins
      if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
        console.log('❌ Admin trying to change password for another admin/super admin');
        return NextResponse.json(
          { error: 'Not authorized. You cannot change passwords for other administrators.' },
          { status: 403 }
        );
      }
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update the user's password
    const updateResult = await usersCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          password: hashedPassword,
          temporaryPassword: false,
          passwordChangeRequired: false,
          temporaryPasswordCreated: null,
          updatedAt: new Date()
        }
      }
    );

    if (updateResult.modifiedCount === 0) {
      console.log('❌ Failed to update password');
      return NextResponse.json(
        { error: 'Failed to update password' },
        { status: 500 }
      );
    }

    console.log('✅ Password updated successfully for user:', user.email);

    return NextResponse.json({
      success: true,
      message: `Password updated successfully for user ${user.email}`,
      action: 'password_changed_by_admin',
      timestamp: new Date().toISOString(),
      targetUser: {
        id: user._id,
        email: user.email,
        name: user.name
      },
      changedBy: {
        id: session.user.id,
        email: session.user.email,
        role: session.user.role
      }
    });

  } catch (error) {
    console.error('❌ Error in admin password change:', error);
    return NextResponse.json(
      { error: 'Error updating password', details: error.message },
      { status: 500 }
    );
  }
}
