import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Operator from '@/models/Operator';

export async function GET(request, { params }) {
  try {
    await dbConnect();
    const { id } = params;

    const operator = await Operator.findById(id);
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
    console.error('Error fetching operator:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    await dbConnect();
    const { id } = params;
    const updates = await request.json();

    const operator = await Operator.findByIdAndUpdate(
      id,
      { $set: updates },
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

export async function DELETE(request, { params }) {
  try {
    await dbConnect();
    const { id } = params;

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