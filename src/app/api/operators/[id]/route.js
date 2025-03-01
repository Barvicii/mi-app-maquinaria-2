import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Operator from '@/models/Operator';

export async function GET(request, { params }) {
  try {
    await connectDB();
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Operator ID is required' },
        { status: 400 }
      );
    }
    
    const operator = await Operator.findById(id);
    
    if (!operator) {
      return NextResponse.json(
        { error: 'Operator not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(operator);
  } catch (error) {
    console.error('GET operator error:', error);
    return NextResponse.json(
      { error: 'Error fetching operator', message: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    await connectDB();
    const { id } = params;
    const data = await request.json();
    
    // Format date if provided
    if (data.fechaIngreso) {
      data.fechaIngreso = new Date(data.fechaIngreso);
    }
    
    const operator = await Operator.findByIdAndUpdate(
      id,
      data,
      { new: true, runValidators: true }
    );
    
    if (!operator) {
      return NextResponse.json(
        { error: 'Operator not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(operator);
  } catch (error) {
    console.error('PUT operator error:', error);
    return NextResponse.json(
      { error: 'Error updating operator', message: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectDB();
    const { id } = params;
    
    const operator = await Operator.findByIdAndDelete(id);
    
    if (!operator) {
      return NextResponse.json(
        { error: 'Operator not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ message: 'Operator deleted successfully' });
  } catch (error) {
    console.error('DELETE operator error:', error);
    return NextResponse.json(
      { error: 'Error deleting operator', message: error.message },
      { status: 500 }
    );
  }
}