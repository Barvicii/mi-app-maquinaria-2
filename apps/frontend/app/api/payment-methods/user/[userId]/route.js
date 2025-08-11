import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { connectDB } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// Get all payment methods for a user
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
    
    const { userId } = params;
    
    // Check if user is accessing their own payment methods or is an admin
    const isOwnData = session.user.id === userId;
    const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN';
    
    if (!isOwnData && !isAdmin) {
      return NextResponse.json(
        { error: 'Not authorized to access this data' },
        { status: 403 }
      );
    }
    
    // Connect to database
    const db = await connectDB();
    
    // Fetch payment methods
    const paymentMethods = await db.collection('paymentMethods')
      .find({ userId: new ObjectId(userId) })
      .project({ 
        cardNumber: 0, // Don't return full card number
        cvv: 0 // Don't return CVV
      })
      .toArray();
    
    return NextResponse.json({
      paymentMethods: paymentMethods || []
    });
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    return NextResponse.json(
      { error: 'Error fetching payment methods', details: error.message },
      { status: 500 }
    );
  }
}

// Add a new payment method
export async function POST(request, { params }) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    const { userId } = params;
    
    // Check if user is adding their own payment method or is an admin
    const isOwnData = session.user.id === userId;
    const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN';
    
    if (!isOwnData && !isAdmin) {
      return NextResponse.json(
        { error: 'Not authorized to add payment method for this user' },
        { status: 403 }
      );
    }
    
    // Parse request body
    const data = await request.json();
    const { 
      cardNumber, 
      cardholderName, 
      expiryMonth, 
      expiryYear, 
      cvv,
      isDefault 
    } = data;
    
    // Basic validation
    if (!cardNumber || !cardholderName || !expiryMonth || !expiryYear || !cvv) {
      return NextResponse.json(
        { error: 'All card details are required' },
        { status: 400 }
      );
    }
    
    // Further validation could be added here (e.g., card number format, expiry date validity)
    
    // Connect to database
    const db = await connectDB();
    
    // Prepare payment method object
    const lastFourDigits = cardNumber.slice(-4);
    const cardType = detectCardType(cardNumber);
    
    const paymentMethod = {
      userId: new ObjectId(userId),
      cardType,
      lastFourDigits,
      cardholderName,
      expiryMonth,
      expiryYear,
      isDefault: isDefault || false,
      createdAt: new Date()
    };
    
    // If this is set as default, update other payment methods
    if (paymentMethod.isDefault) {
      await db.collection('paymentMethods').updateMany(
        { userId: new ObjectId(userId) },
        { $set: { isDefault: false } }
      );
    }
    
    // Insert payment method
    const result = await db.collection('paymentMethods').insertOne(paymentMethod);
    
    return NextResponse.json({
      success: true,
      paymentMethodId: result.insertedId,
      message: 'Payment method added successfully'
    });
  } catch (error) {
    console.error('Error adding payment method:', error);
    return NextResponse.json(
      { error: 'Error adding payment method', details: error.message },
      { status: 500 }
    );
  }
}

// Helper function to detect card type
function detectCardType(cardNumber) {
  const number = cardNumber.replace(/\s+/g, '');
  
  if (/^4/.test(number)) return 'Visa';
  if (/^5[1-5]/.test(number)) return 'Mastercard';
  if (/^3[47]/.test(number)) return 'American Express';
  if (/^6(?:011|5)/.test(number)) return 'Discover';
  
  return 'Unknown';
}
