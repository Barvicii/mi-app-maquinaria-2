import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectDB } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// Get a specific payment method
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
    
    const { id } = params;
    
    // Connect to database
    const db = await connectDB();
    
    // Fetch payment method
    const paymentMethod = await db.collection('paymentMethods').findOne(
      { _id: new ObjectId(id) },
      { projection: { cardNumber: 0, cvv: 0 } } // Don't return sensitive data
    );
    
    if (!paymentMethod) {
      return NextResponse.json(
        { error: 'Payment method not found' },
        { status: 404 }
      );
    }
    
    // Check if user is accessing their own payment method or is an admin
    const isOwnData = session.user.id === paymentMethod.userId.toString();
    const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN';
    
    if (!isOwnData && !isAdmin) {
      return NextResponse.json(
        { error: 'Not authorized to access this payment method' },
        { status: 403 }
      );
    }
    
    return NextResponse.json({ paymentMethod });
  } catch (error) {
    console.error('Error fetching payment method:', error);
    return NextResponse.json(
      { error: 'Error fetching payment method', details: error.message },
      { status: 500 }
    );
  }
}

// Update a payment method
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
    
    const { id } = params;
    
    // Connect to database
    const db = await connectDB();
    
    // Fetch payment method
    const paymentMethod = await db.collection('paymentMethods').findOne(
      { _id: new ObjectId(id) }
    );
    
    if (!paymentMethod) {
      return NextResponse.json(
        { error: 'Payment method not found' },
        { status: 404 }
      );
    }
    
    // Check if user is updating their own payment method or is an admin
    const isOwnData = session.user.id === paymentMethod.userId.toString();
    const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN';
    
    if (!isOwnData && !isAdmin) {
      return NextResponse.json(
        { error: 'Not authorized to update this payment method' },
        { status: 403 }
      );
    }
    
    // Parse request body
    const data = await request.json();
    const { 
      cardholderName, 
      expiryMonth, 
      expiryYear, 
      isDefault 
    } = data;
    
    // Prepare update object
    const updateData = {
      ...(cardholderName && { cardholderName }),
      ...(expiryMonth && { expiryMonth }),
      ...(expiryYear && { expiryYear }),
      updatedAt: new Date()
    };
    
    // If isDefault is true, update other payment methods
    if (isDefault === true && !paymentMethod.isDefault) {
      await db.collection('paymentMethods').updateMany(
        { userId: paymentMethod.userId },
        { $set: { isDefault: false } }
      );
      updateData.isDefault = true;
    }
    
    // Update payment method
    await db.collection('paymentMethods').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
    
    return NextResponse.json({
      success: true,
      message: 'Payment method updated successfully'
    });
  } catch (error) {
    console.error('Error updating payment method:', error);
    return NextResponse.json(
      { error: 'Error updating payment method', details: error.message },
      { status: 500 }
    );
  }
}

// Delete a payment method
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
    
    const { id } = params;
    
    // Connect to database
    const db = await connectDB();
    
    // Fetch payment method
    const paymentMethod = await db.collection('paymentMethods').findOne(
      { _id: new ObjectId(id) }
    );
    
    if (!paymentMethod) {
      return NextResponse.json(
        { error: 'Payment method not found' },
        { status: 404 }
      );
    }
    
    // Check if user is deleting their own payment method or is an admin
    const isOwnData = session.user.id === paymentMethod.userId.toString();
    const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN';
    
    if (!isOwnData && !isAdmin) {
      return NextResponse.json(
        { error: 'Not authorized to delete this payment method' },
        { status: 403 }
      );
    }
    
    // Delete payment method
    await db.collection('paymentMethods').deleteOne({ _id: new ObjectId(id) });
    
    // If this was the default payment method, set the oldest remaining card as default
    if (paymentMethod.isDefault) {
      const oldestCard = await db.collection('paymentMethods')
        .find({ userId: paymentMethod.userId })
        .sort({ createdAt: 1 })
        .limit(1)
        .toArray();
        
      if (oldestCard.length > 0) {
        await db.collection('paymentMethods').updateOne(
          { _id: oldestCard[0]._id },
          { $set: { isDefault: true } }
        );
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Payment method deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting payment method:', error);
    return NextResponse.json(
      { error: 'Error deleting payment method', details: error.message },
      { status: 500 }
    );
  }
}
