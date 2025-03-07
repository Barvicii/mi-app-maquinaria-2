import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import dbConnect from '@/lib/43432';
import User from '@/models/User';
import { authOptions } from '../../auth/[...nextauth]/route';

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
    
    await dbConnect();
    const { id } = params;
    
    // Users can only view themselves or admins can view any user in their org
    if (session.user.id !== id && session.user.role !== 'admin') {
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
    
    // Organization-level security check
    if (user.organization !== session.user.organization) {
      return NextResponse.json(
        { error: 'Not authorized to view this user' },
        { status: 403 }
      );
    }
    
    return NextResponse.json(user);
  } catch (error) {
    console.error('GET user error:', error);
    return NextResponse.json(
      { error: 'Error loading user', details: error.message },
      { status: 500 }
    );
  }
}

// Update a user
export async function PUT(request, { params }) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    await dbConnect();
    const { id } = params;
    const updateData = await request.json();
    
    // Users can only update themselves or admins can update any user in their org
    if (session.user.id !== id && session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Not authorized to update this user' },
        { status: 403 }
      );
    }
    
    // Find the user first to verify organization
    const existingUser = await User.findById(id);
    
    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Organization-level security check
    if (existingUser.organization !== session.user.organization) {
      return NextResponse.json(
        { error: 'Not authorized to update this user' },
        { status: 403 }
      );
    }
    
    // Prevent changing organization unless admin
    if (updateData.organization && updateData.organization !== existingUser.organization && session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Not authorized to change organization' },
        { status: 403 }
      );
    }
    
    // Prevent changing role unless admin
    if (updateData.role && session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Not authorized to change role' },
        { status: 403 }
      );
    }
    
    // Prevent regular users from setting admin role
    if (updateData.role === 'admin' && session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Not authorized to assign admin role' },
        { status: 403 }
      );
    }
    
    // If changing password, handle separately
    if (updateData.password) {
      existingUser.password = updateData.password;
      delete updateData.password;
    }
    
    // Update user using findByIdAndUpdate to avoid changing the password hashing
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { ...updateData },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!updatedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('PUT user error:', error);
    return NextResponse.json(
      { error: 'Error updating user', details: error.message },
      { status: 500 }
    );
  }
}

// Delete a user
export async function DELETE(request, { params }) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Only admins can delete users
    if (session.user.role !== 'admin') {
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
    
    // Organization-level security check
    if (existingUser.organization !== session.user.organization) {
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