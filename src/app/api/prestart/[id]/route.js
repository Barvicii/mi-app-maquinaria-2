import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import PreStart from '@/models/PreStart';

export async function GET(request, { params }) {
  try {
    await dbConnect();
    const { id } = params;
    
    const prestart = await PreStart.findById(id);
    
    if (!prestart) {
      return NextResponse.json(
        { error: 'Prestart check not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(prestart);
  } catch (error) {
    console.error('GET prestart error:', error);
    return NextResponse.json(
      { error: 'Error loading prestart check' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    await dbConnect();
    const { id } = params;
    const data = await request.json();
    
    const updatedPrestart = await PreStart.findByIdAndUpdate(
      id,
      data,
      { new: true, runValidators: true }
    );
    
    if (!updatedPrestart) {
      return NextResponse.json(
        { error: 'Prestart check not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedPrestart);
  } catch (error) {
    console.error('PUT prestart error:', error);
    return NextResponse.json(
      { error: 'Error updating prestart check' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    await dbConnect();
    const { id } = params;
    
    const deletedPrestart = await PreStart.findByIdAndDelete(id);
    
    if (!deletedPrestart) {
      return NextResponse.json(
        { error: 'Prestart check not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'Prestart check deleted successfully' }
    );
  } catch (error) {
    console.error('DELETE prestart error:', error);
    return NextResponse.json(
      { error: 'Error deleting prestart check' },
      { status: 500 }
    );
  }
}