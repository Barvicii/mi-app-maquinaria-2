import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { connectDB, dbConnect } from '@/lib/mongodb';
import User from '@/models/User';
import { authOptions } from '../../auth/[...nextauth]/route';

// Helper function to check organization suspension
const checkOrganizationSuspension = (session) => {
  if (session.user.role !== 'SUPER_ADMIN' && session.user.organizationSuspended === true) {
    return NextResponse.json(
      { error: 'Organization is suspended. Contact support for assistance.' },
      { status: 403 }
    );
  }
  return null;
};

// Get a single user by ID
export async function GET(request, { params }) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Check if organization is suspended
    const suspensionCheck = checkOrganizationSuspension(session);
    if (suspensionCheck) return suspensionCheck;
    
    await dbConnect();
    const { id } = await params;
    
    // Users can only view themselves or admins/super admins can view users (super admins can view any user)
    if (session.user.id !== id && session.user.role !== 'admin' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Not authorized to view this user' },
        { status: 403 }
      );
    }
    
    const user = await User.findById(id).select('-password');
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ user });
  } catch (error) {
    console.error('GET user error:', error);
    return NextResponse.json(
      { error: 'Error retrieving user', details: error.message },
      { status: 500 }
    );
  }
}

// Delete a user by ID
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Check if organization is suspended
    const suspensionCheck = checkOrganizationSuspension(session);
    if (suspensionCheck) return suspensionCheck;
    
    // Only admins and super admins can delete users
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Not authorized to delete users' },
        { status: 403 }
      );
    }
    
    await dbConnect();
    const { id } = params;
    
    // Find the user first to verify organization
    const existingUser = await User.findById(id);
    
    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Organization-level security check (super admins can delete users from any organization)
    if (session.user.role !== 'SUPER_ADMIN' && existingUser.company !== session.user.company) {
      return NextResponse.json(
        { error: 'Not authorized to delete this user' },
        { status: 403 }
      );
    }
    
    // Prevent deleting yourself
    if (existingUser._id.toString() === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }
    
    const deletedUser = await User.findByIdAndDelete(id);
    
    if (!deletedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      message: 'User deleted successfully',
      id: deletedUser._id 
    });
  } catch (error) {
    console.error('DELETE user error:', error);
    return NextResponse.json(
      { error: 'Error deleting user', details: error.message },
      { status: 500 }
    );
  }
}

// Update a user by ID
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Check if organization is suspended
    const suspensionCheck = checkOrganizationSuspension(session);
    if (suspensionCheck) return suspensionCheck;
    
    // Only admins and super admins can update users
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: 'Not authorized to update users' },
        { status: 403 }
      );
    }
    
    await dbConnect();
    const { id } = params;
    const updateData = await request.json();
    
    // Find the user first to verify organization
    const existingUser = await User.findById(id);
    
    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Organization-level security check (super admins can update users from any organization)
    if (session.user.role !== 'SUPER_ADMIN' && existingUser.organizationId?.toString() !== session.user.organizationId) {
      return NextResponse.json(
        { error: 'Not authorized to update this user' },
        { status: 403 }
      );
    }
    
    // Prepare update data, mapping workplaceName to workplace
    const fieldsToUpdate = {
      name: updateData.name,
      email: updateData.email,
      role: updateData.role,
      workplace: updateData.workplaceName, // Map workplaceName to workplace
      updatedAt: new Date()
    };
    
    // Remove undefined fields
    Object.keys(fieldsToUpdate).forEach(key => {
      if (fieldsToUpdate[key] === undefined) {
        delete fieldsToUpdate[key];
      }
    });
    
    const updatedUser = await User.findByIdAndUpdate(
      id,
      fieldsToUpdate,
      { new: true, select: '-password' }
    );
    
    if (!updatedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      message: 'User updated successfully',
      user: updatedUser 
    });
  } catch (error) {
    console.error('PUT user error:', error);
    return NextResponse.json(
      { error: 'Error updating user', details: error.message },
      { status: 500 }
    );
  }
}
