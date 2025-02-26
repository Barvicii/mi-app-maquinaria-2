import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Operator from '@/models/Operator';

export async function GET() {
  try {
    await dbConnect();
    console.log('Getting all operators...');
    
    const operators = await Operator.find({})
      .sort({ createdAt: -1 })
      .lean();
    
    console.log(`Found ${operators.length} operators`);
    
    return NextResponse.json({
      success: true,
      data: operators
    });
  } catch (error) {
    console.error('Error fetching operators:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    
    const data = await request.json();
    console.log('Creating new operator:', data);

    // Basic validation
    if (!data.nombre || !data.apellido || !data.tipo) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields'
      }, { status: 400 });
    }

    const operator = await Operator.create(data);
    console.log('Created operator:', operator);

    return NextResponse.json({
      success: true,
      data: operator
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating operator:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    await dbConnect();
    const data = await request.json();
    
    if (!data._id) {
      return NextResponse.json({
        success: false,
        error: 'No ID provided for update'
      }, { status: 400 });
    }

    const operator = await Operator.findByIdAndUpdate(
      data._id,
      data,
      { new: true, runValidators: true }
    );

    if (!operator) {
      return NextResponse.json({
        success: false,
        error: 'Operator not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: operator
    });
  } catch (error) {
    console.error('Error updating operator:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'No ID provided for deletion'
      }, { status: 400 });
    }

    const operator = await Operator.findByIdAndDelete(id);
    
    if (!operator) {
      return NextResponse.json({
        success: false,
        error: 'Operator not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Operator deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting operator:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}