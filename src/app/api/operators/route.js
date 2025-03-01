import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Operator from '@/models/Operator';

export async function GET() {
  try {
    await connectDB();
    const operators = await Operator.find({}).sort({ createdAt: -1 });
    
    console.log('Successfully fetched operators:', operators.length);
    
    return NextResponse.json(operators);
  } catch (error) {
    console.error('GET operators error:', error);
    return NextResponse.json(
      { error: 'Error loading operators' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const data = await request.json();
    
    // Format date if provided
    if (data.fechaIngreso) {
      data.fechaIngreso = new Date(data.fechaIngreso);
    }

    const operator = new Operator(data);
    const savedOperator = await operator.save();

    console.log('Successfully created operator:', savedOperator._id);
    
    return NextResponse.json(savedOperator, { status: 201 });
  } catch (error) {
    console.error('POST operator error:', error);
    return NextResponse.json(
      { error: 'Error creating operator', message: error.message },
      { status: 500 }
    );
  }
}